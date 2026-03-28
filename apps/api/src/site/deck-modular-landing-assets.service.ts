import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as path from 'path';
import { readFile, writeFile } from 'fs/promises';
import { AiService } from '../ai/ai.service';
import { getDeckLandingsDir, getDeckModularLandingPromptsDir } from '../paths';
import type { DeckModularLandingV1 } from './deck-modular-landing.types';
import { DeckModularLandingService } from './deck-modular-landing.service';

const HERO_VARIANTS_WITH_IMAGE = new Set(['HeroSplitImageRight', 'HeroFullBleed']);

@Injectable()
export class DeckModularLandingAssetsService {
  private readonly logger = new Logger(DeckModularLandingAssetsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly ai: AiService,
    private readonly deckModular: DeckModularLandingService,
  ) {}

  /**
   * Grok Imagine → PNG dans `content/generated/.../images/`, puis mise à jour de
   * `hero.props.imageUrl` dans le JSON landing (`/ai/generated-images/<fichier>.png`).
   */
  async generateHeroImage(slug: string): Promise<{
    imagePath: string;
    imageUrl: string;
    model: string;
    promptSource: 'json' | 'synthesized';
    promptPreview: string;
  }> {
    const doc = await this.deckModular.loadDeckLanding(slug);
    const hero = doc.sections.find((s) => s.id === 'hero');
    if (!hero) {
      throw new NotFoundException('Section hero absente');
    }
    if (!HERO_VARIANTS_WITH_IMAGE.has(hero.variant)) {
      throw new InternalServerErrorException(
        `Variante hero « ${hero.variant} » sans image attendue`,
      );
    }

    const props = hero.props as Record<string, unknown>;
    let prompt = doc.imagePrompts?.hero?.trim();
    let promptSource: 'json' | 'synthesized' = 'json';

    if (!prompt) {
      prompt = await this.synthesizeHeroImaginePrompt(doc, hero.variant, props);
      promptSource = 'synthesized';
    }

    const outputSlug = `deck-hero-${slug.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    this.logger.log(`Imagine hero slug=${slug} source=${promptSource} file=${outputSlug}.png`);

    const { path: imagePath, model } = await this.ai.generateImageToFile({
      prompt,
      outputSlug,
      aspectRatio: '16:9',
    });

    const fileName = path.basename(imagePath);
    const imageUrl = `/ai/generated-images/${fileName}`;

    props.imageUrl = imageUrl;
    if (promptSource === 'synthesized' && !doc.imagePrompts) {
      doc.imagePrompts = {};
    }
    if (promptSource === 'synthesized') {
      doc.imagePrompts = { ...doc.imagePrompts, hero: prompt };
    }

    const outJson = path.join(getDeckLandingsDir(), `${slug}.json`);
    await writeFile(outJson, JSON.stringify(doc, null, 2), 'utf8');
    this.logger.log(`Mis à jour ${outJson} → imageUrl=${imageUrl}`);

    const promptPreview =
      prompt.length > 280 ? `${prompt.slice(0, 280)}…` : prompt;

    return {
      imagePath,
      imageUrl,
      model,
      promptSource,
      promptPreview,
    };
  }

  private async synthesizeHeroImaginePrompt(
    doc: DeckModularLandingV1,
    heroVariant: string,
    props: Record<string, unknown>,
  ): Promise<string> {
    const apiKey = this.config.get<string>('GROK_API_KEY') ?? '';
    const baseUrl = this.config.get<string>('GROK_API_URL') ?? 'https://api.x.ai/v1';
    const model =
      this.config.get<string>('GROK_DECK_LANDING_MODEL')?.trim() ||
      this.config.get<string>('GROK_TEXT_MODEL')?.trim() ||
      'grok-3-mini';

    if (!apiKey) {
      throw new InternalServerErrorException('GROK_API_KEY is not configured');
    }

    const system = await readFile(
      path.join(getDeckModularLandingPromptsDir(), '03-hero-imagine-prompt.md'),
      'utf8',
    );

    const payload = {
      landingSlug: doc.slug,
      heroVariant,
      globals: {
        accent: doc.globals.accent,
        background: doc.globals.background,
        surface: doc.globals.surface,
        text: doc.globals.text,
      },
      heroProps: {
        title: props.title,
        subtitle: props.subtitle,
        tagline: props.tagline,
        imageAlt: props.imageAlt,
        bodyMarkdown:
          typeof props.bodyMarkdown === 'string'
            ? props.bodyMarkdown.slice(0, 600)
            : undefined,
      },
    };

    const client = new OpenAI({ apiKey, baseURL: baseUrl });
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.55,
      max_tokens: 600,
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: `Produce the English image prompt from this JSON:\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      throw new InternalServerErrorException('Pas de prompt image depuis Grok (chat)');
    }
    return raw.replace(/^["“”']|["“”']$/g, '').trim();
  }
}
