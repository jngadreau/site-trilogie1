import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { mkdir, readdir, readFile, writeFile } from 'fs/promises';
import * as path from 'path';
import {
  getCardMetadataArbreDeViePath,
  getContentGeneratedArbreDeVieDir,
  getGameBookletDir,
  getGameCardsContextDir,
  getGameContextPath,
  getGameContextPromptsDir,
  getSiteManifestPath,
  getTrilogyContextPath,
} from '../paths';

/** Assez large pour ~32 cartes + textes longs ; réduire si besoin de tokens API. */
const MAX_CARDS_BUNDLE = 220_000;
const MAX_BOOKLET_BUNDLE = 100_000;

function stripOuterMarkdownFence(s: string): string {
  const t = s.trim();
  const m = /^```(?:markdown|md)?\s*\r?\n([\s\S]*?)\r?\n```\s*$/i.exec(t);
  if (m) return m[1].trim();
  return t;
}

async function bundleMarkdownFiles(
  dir: string,
  maxChars: number,
): Promise<{ text: string; fileCount: number; truncated: boolean }> {
  let names: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    names = entries
      .filter((e) => e.isFile() && /\.md$/i.test(e.name))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b, 'fr'));
  } catch {
    return { text: `_(dossier introuvable ou vide : ${dir})_\n`, fileCount: 0, truncated: false };
  }

  const parts: string[] = [];
  let total = 0;
  let truncated = false;
  let used = 0;

  for (const name of names) {
    let raw: string;
    try {
      raw = await readFile(path.join(dir, name), 'utf8');
    } catch {
      continue;
    }
    const block = `### ${name}\n\n${raw}\n\n`;
    if (total + block.length > maxChars) {
      truncated = true;
      break;
    }
    parts.push(block);
    total += block.length;
    used++;
  }

  if (truncated && names.length > used) {
    parts.push(
      `\n\n_…troncature (${used}/${names.length} fichiers inclus ; limite ${maxChars} caractères)._\n`,
    );
  }

  if (!parts.length) {
    return {
      text: `_(aucun fichier .md dans ${dir})_\n`,
      fileCount: 0,
      truncated: false,
    };
  }

  return { text: parts.join(''), fileCount: used, truncated };
}

@Injectable()
export class GameContextGenerationService {
  private readonly logger = new Logger(GameContextGenerationService.name);

  constructor(private readonly config: ConfigService) {}

  private async readGameLabel(): Promise<string> {
    try {
      const raw = await readFile(getSiteManifestPath(), 'utf8');
      const j = JSON.parse(raw) as { title?: string; subtitle?: string; gameId?: string };
      const t = [j.title, j.subtitle].filter(Boolean).join(' — ');
      return t || j.gameId || 'Jeu (manifeste sans titre)';
    } catch (e) {
      this.logger.warn(`Manifeste: ${(e as Error).message}`);
      return 'Jeu (manifeste indisponible)';
    }
  }

  async generateAndSave(): Promise<{
    path: string;
    model: string;
    chars: number;
    cardFiles: number;
    cardsTruncated: boolean;
    bookletTruncated: boolean;
  }> {
    const apiKey = this.config.get<string>('GROK_API_KEY') ?? '';
    const baseUrl = this.config.get<string>('GROK_API_URL') ?? 'https://api.x.ai/v1';
    const model =
      this.config.get<string>('GROK_GAME_CONTEXT_MODEL')?.trim() ||
      this.config.get<string>('GROK_TEXT_MODEL')?.trim() ||
      'grok-3-mini';

    if (!apiKey) {
      throw new InternalServerErrorException('GROK_API_KEY is not configured');
    }

    const system = await readFile(
      path.join(getGameContextPromptsDir(), '01-system.md'),
      'utf8',
    );
    let userTpl = await readFile(
      path.join(getGameContextPromptsDir(), '02-user-template.md'),
      'utf8',
    );

    const gameLabel = await this.readGameLabel();

    const cardsBundle = await bundleMarkdownFiles(
      getGameCardsContextDir(),
      MAX_CARDS_BUNDLE,
    );
    const bookletBundle = await bundleMarkdownFiles(
      getGameBookletDir(),
      MAX_BOOKLET_BUNDLE,
    );

    let metaJson = '{}';
    try {
      metaJson = await readFile(getCardMetadataArbreDeViePath(), 'utf8');
    } catch {
      metaJson = '{"note":"metadata.json absent"}';
    }

    let trilogy = '';
    try {
      trilogy = await readFile(getTrilogyContextPath(), 'utf8');
    } catch {
      trilogy = '(trilogy-context.md absent)';
    }

    userTpl = userTpl
      .replace('{{GAME_LABEL}}', gameLabel)
      .replace('{{CARDS_MD_BUNDLE}}', cardsBundle.text)
      .replace('{{BOOKLET_MD_BUNDLE}}', bookletBundle.text)
      .replace('{{GAME_META_JSON}}', metaJson)
      .replace('{{TRILOGY_CONTEXT}}', trilogy);

    const client = new OpenAI({ apiKey, baseURL: baseUrl });

    this.logger.log(`Grok game-context model=${model}`);

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.35,
      max_tokens: 8_000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userTpl },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent?.trim()) {
      throw new InternalServerErrorException('No content from Grok API');
    }

    const md = stripOuterMarkdownFence(rawContent);

    const outDir = getContentGeneratedArbreDeVieDir();
    await mkdir(outDir, { recursive: true });

    const outPath = getGameContextPath();
    await writeFile(outPath, md, 'utf8');

    this.logger.log(`Saved game-context.md (${md.length} chars)`);

    return {
      path: outPath,
      model,
      chars: md.length,
      cardFiles: cardsBundle.fileCount,
      cardsTruncated: cardsBundle.truncated,
      bookletTruncated: bookletBundle.truncated,
    };
  }
}
