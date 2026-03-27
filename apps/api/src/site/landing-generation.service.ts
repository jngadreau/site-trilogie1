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
  getBookletDebutArbreDeViePath,
  getCardMetadataArbreDeViePath,
  getContentGeneratedArbreDeVieDir,
  getLandingPromptsDir,
  getLandingSpecPath,
  getTrilogyContextPath,
} from '../paths';
import type { LandingSpecV1 } from './landing-spec.types';
import { extractFirstJsonObject } from './json-extract.util';

@Injectable()
export class LandingGenerationService {
  private readonly logger = new Logger(LandingGenerationService.name);

  constructor(private readonly config: ConfigService) {}

  async loadLandingSpec(): Promise<LandingSpecV1> {
    const p = getLandingSpecPath();
    let raw: string;
    try {
      raw = await readFile(p, 'utf8');
    } catch {
      throw new NotFoundException(
        'landing-spec.json absent — exécute POST /site/generate-landing',
      );
    }
    try {
      return JSON.parse(raw) as LandingSpecV1;
    } catch {
      throw new NotFoundException('landing-spec.json invalide');
    }
  }

  async generateAndSave(): Promise<{
    path: string;
    model: string;
    sections: number;
  }> {
    const apiKey = this.config.get<string>('GROK_API_KEY') ?? '';
    const baseUrl = this.config.get<string>('GROK_API_URL') ?? 'https://api.x.ai/v1';
    const model =
      this.config.get<string>('GROK_LANDING_MODEL')?.trim() ||
      this.config.get<string>('GROK_TEXT_MODEL')?.trim() ||
      'grok-3-mini';

    if (!apiKey) {
      throw new InternalServerErrorException('GROK_API_KEY is not configured');
    }

    const system = await readFile(
      path.join(getLandingPromptsDir(), '01-system.md'),
      'utf8',
    );
    let userTpl = await readFile(
      path.join(getLandingPromptsDir(), '02-user-template.md'),
      'utf8',
    );

    let booklet = '';
    try {
      booklet = await readFile(getBookletDebutArbreDeViePath(), 'utf8');
    } catch (e) {
      this.logger.warn(`Livret introuvable: ${(e as Error).message}`);
      booklet = '(livret non trouvé — renseigner BOOKLET_DEBUT_PATH ou déposer le fichier)';
    }
    const excerpt = booklet.slice(0, 14_000);

    let metaJson = '{}';
    try {
      metaJson = await readFile(getCardMetadataArbreDeViePath(), 'utf8');
    } catch {
      metaJson = '{"note":"metadata.json absent dans images-jeux/arbre_de_vie"}';
    }

    let trilogy = '';
    try {
      trilogy = await readFile(getTrilogyContextPath(), 'utf8');
    } catch {
      trilogy = '(trilogy-context.md absent)';
    }

    userTpl = userTpl
      .replace('{{BOOKLET_EXCERPT}}', excerpt)
      .replace('{{GAME_META_JSON}}', metaJson)
      .replace('{{TRILOGY_CONTEXT}}', trilogy);

    const client = new OpenAI({ apiKey, baseURL: baseUrl });

    this.logger.log(`Grok landing spec model=${model}`);

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
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

    let spec: LandingSpecV1;
    try {
      spec = JSON.parse(extractFirstJsonObject(rawContent)) as LandingSpecV1;
    } catch (e) {
      this.logger.error(`JSON parse: ${(e as Error).message}`);
      throw new InternalServerErrorException(
        'Réponse Grok non JSON valide — voir les logs serveur',
      );
    }

    if (spec.version !== 1) {
      throw new InternalServerErrorException('version !== 1 dans landing-spec');
    }

    const outDir = getContentGeneratedArbreDeVieDir();
    await mkdir(outDir, { recursive: true });

    const specPath = getLandingSpecPath();
    await writeFile(specPath, JSON.stringify(spec, null, 2), 'utf8');

    const shellPath = path.join(outDir, 'landing-shell.html');
    await writeFile(shellPath, spec.htmlShell ?? '<!-- empty -->', 'utf8');

    const cssPath = path.join(outDir, 'landing-base.css');
    await writeFile(cssPath, spec.cssBase ?? '/* empty */', 'utf8');

    this.logger.log(`Saved landing-spec.json + landing-shell.html + landing-base.css`);

    return {
      path: specPath,
      model,
      sections: spec.sections?.length ?? 0,
    };
  }
}
