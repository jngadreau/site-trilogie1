import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { mkdir, readFile, writeFile } from 'fs/promises';
import * as path from 'path';
import {
  getDeckLandingsDir,
  getDeckLandingVariantsPath,
  getDeckModularLandingPromptsDir,
  getGameContextPath,
} from '../paths';
import type { DeckModularLandingV1 } from './deck-modular-landing.types';
import { extractFirstJsonObject } from './json-extract.util';

const ALLOWED_SLUGS = new Set(['arbre-de-vie-a', 'arbre-de-vie-b']);

@Injectable()
export class DeckModularLandingService {
  private readonly logger = new Logger(DeckModularLandingService.name);

  constructor(private readonly config: ConfigService) {}

  private assertSlug(slug: string): void {
    if (!ALLOWED_SLUGS.has(slug)) {
      throw new NotFoundException(`Slug landing inconnu: ${slug}`);
    }
  }

  async loadDeckLanding(slug: string): Promise<DeckModularLandingV1> {
    this.assertSlug(slug);
    const p = path.join(getDeckLandingsDir(), `${slug}.json`);
    let raw: string;
    try {
      raw = await readFile(p, 'utf8');
    } catch {
      throw new NotFoundException(
        `${slug}.json absent — POST /site/generate-deck-landing/${slug}`,
      );
    }
    try {
      return JSON.parse(raw) as DeckModularLandingV1;
    } catch {
      throw new NotFoundException(`${slug}.json invalide`);
    }
  }

  async generateAndSave(slug: string): Promise<{
    path: string;
    model: string;
    sections: number;
  }> {
    this.assertSlug(slug);
    const apiKey = this.config.get<string>('GROK_API_KEY') ?? '';
    const baseUrl = this.config.get<string>('GROK_API_URL') ?? 'https://api.x.ai/v1';
    const model =
      this.config.get<string>('GROK_DECK_LANDING_MODEL')?.trim() ||
      this.config.get<string>('GROK_TEXT_MODEL')?.trim() ||
      'grok-3-mini';

    if (!apiKey) {
      throw new InternalServerErrorException('GROK_API_KEY is not configured');
    }

    let deckContext = '';
    try {
      deckContext = await readFile(getGameContextPath(), 'utf8');
    } catch {
      deckContext =
        '(game-context.md absent — lance POST /site/generate-game-context pour un meilleur résultat)';
    }
    const ctxSlice = deckContext.slice(0, 60_000);

    const variantsRaw = await readFile(getDeckLandingVariantsPath(), 'utf8');
    const variantsMap = JSON.parse(variantsRaw) as Record<string, Record<string, string>>;
    const variantEntry = variantsMap[slug];
    if (!variantEntry) {
      throw new InternalServerErrorException(`Pas d'entrée variants pour ${slug}`);
    }

    const system = await readFile(
      path.join(getDeckModularLandingPromptsDir(), '01-system.md'),
      'utf8',
    );
    let userTpl = await readFile(
      path.join(getDeckModularLandingPromptsDir(), '02-user-template.md'),
      'utf8',
    );

    userTpl = userTpl
      .replace('{{DECK_CONTEXT}}', ctxSlice)
      .replace(/\{\{LANDING_SLUG\}\}/g, slug)
      .replace('{{VARIANT_MAP_JSON}}', JSON.stringify(variantEntry, null, 2));

    const client = new OpenAI({ apiKey, baseURL: baseUrl });
    this.logger.log(`Grok deck-modular landing slug=${slug} model=${model}`);

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.45,
      max_tokens: 12_000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userTpl },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent?.trim()) {
      throw new InternalServerErrorException('No content from Grok API');
    }

    let doc: DeckModularLandingV1;
    try {
      doc = JSON.parse(extractFirstJsonObject(rawContent)) as DeckModularLandingV1;
    } catch (e) {
      this.logger.error(`JSON parse: ${(e as Error).message}`);
      throw new InternalServerErrorException(
        'Réponse Grok non JSON valide — voir les logs serveur',
      );
    }

    if (doc.version !== 1) {
      throw new InternalServerErrorException('version !== 1');
    }
    if (doc.slug !== slug) {
      doc.slug = slug;
    }
    const ids = doc.sections?.map((s) => s.id) ?? [];
    const expected = ['hero', 'deck_identity', 'for_who', 'how_to_use'];
    if (ids.length !== 4 || expected.some((id, i) => ids[i] !== id)) {
      throw new InternalServerErrorException(
        `Sections invalides (attendu ordre ${expected.join(',')}, reçu ${ids.join(',')})`,
      );
    }

    const outDir = getDeckLandingsDir();
    await mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, `${slug}.json`);
    await writeFile(outPath, JSON.stringify(doc, null, 2), 'utf8');
    this.logger.log(`Saved ${outPath}`);

    return {
      path: outPath,
      model,
      sections: doc.sections.length,
    };
  }
}
