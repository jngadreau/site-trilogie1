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
import { DeckLandingImageAssemblyService } from './deck-landing-image-assembly.service';
import { DeckLandingJsonPatchService } from './deck-landing-json-patch.service';

const HERO_VARIANTS_WITH_IMAGE = new Set(['HeroSplitImageRight', 'HeroFullBleed']);

@Injectable()
export class DeckModularLandingAssetsService {
  private readonly logger = new Logger(DeckModularLandingAssetsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly ai: AiService,
    private readonly deckModular: DeckModularLandingService,
    private readonly assembly: DeckLandingImageAssemblyService,
    private readonly jsonPatch: DeckLandingJsonPatchService,
  ) {}

  /**
   * Point d’entrée **commun** : lit `media[]` dans le JSON pour `sectionId` + `slotId`.
   */
  async generateImageFromSlot(
    slug: string,
    sectionId: string,
    slotId: string,
  ): Promise<{
    imagePath: string;
    imageUrl: string;
    model: string;
    promptPreview: string;
    promptSource: 'media-slot';
  }> {
    const doc = await this.deckModular.loadDeckLanding(slug);
    const sec = doc.sections.find((s) => s.id === sectionId);
    if (!sec) {
      throw new NotFoundException(`Section ${sectionId} absente`);
    }
    const slot = sec.media?.find((m) => m.slotId === slotId);
    if (!slot) {
      throw new NotFoundException(
        `Slot média « ${slotId} » absent pour ${sectionId} — régénère le JSON (pipeline ou Grok)`,
      );
    }

    const prompt = this.assembly.buildImaginePrompt(slot, doc.globals);
    const aspectRatio = this.assembly.resolveAspectRatio(slot);
    const outputSlug = this.assembly.resolveOutputSlug(slug, sectionId, slotId);

    this.logger.log(`Imagine slot ${slug}/${sectionId}/${slotId}`);

    const { path: imagePath, model } = await this.ai.generateImageToFile({
      prompt,
      outputSlug,
      aspectRatio,
    });

    const fileName = path.basename(imagePath);
    const imageUrl = `/ai/generated-images/${fileName}`;

    await this.jsonPatch.applySlotImage(slug, sectionId, slot, imageUrl);

    return {
      imagePath,
      imageUrl,
      model,
      promptPreview: prompt.length > 280 ? `${prompt.slice(0, 280)}…` : prompt,
      promptSource: 'media-slot',
    };
  }

  /**
   * Hero : préfère `sections[hero].media` (`slotId` `hero`), sinon `imagePrompts.hero`, sinon synthèse Grok.
   */
  async generateHeroImage(slug: string): Promise<{
    imagePath: string;
    imageUrl: string;
    model: string;
    promptSource: 'media-slot' | 'json' | 'synthesized';
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

    const heroSlot = hero.media?.find((m) => m.slotId === 'hero');
    let prompt: string;
    let aspectRatio = '16:9';
    let outputSlug = `deck-hero-${slug.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    let promptSource: 'media-slot' | 'json' | 'synthesized';

    if (heroSlot) {
      prompt = this.assembly.buildImaginePrompt(heroSlot, doc.globals);
      aspectRatio = this.assembly.resolveAspectRatio(heroSlot);
      outputSlug = this.assembly.resolveOutputSlug(slug, 'hero', 'hero');
      promptSource = 'media-slot';
    } else if (doc.imagePrompts?.hero?.trim()) {
      prompt = doc.imagePrompts.hero.trim();
      promptSource = 'json';
    } else {
      prompt = await this.synthesizeHeroImaginePrompt(doc, hero.variant, hero.props as Record<string, unknown>);
      promptSource = 'synthesized';
    }

    this.logger.log(`Imagine hero slug=${slug} source=${promptSource}`);

    const { path: imagePath, model } = await this.ai.generateImageToFile({
      prompt,
      outputSlug,
      aspectRatio,
    });

    const fileName = path.basename(imagePath);
    const imageUrl = `/ai/generated-images/${fileName}`;

    if (heroSlot) {
      await this.jsonPatch.applySlotImage(slug, 'hero', heroSlot, imageUrl);
    } else {
      await this.jsonPatch.applySlotImage(slug, 'hero', {
        slotId: 'hero',
        aspectRatio,
        sceneDescription: prompt,
      }, imageUrl);
    }

    if (promptSource === 'synthesized') {
      const out = await this.deckModular.loadDeckLanding(slug);
      out.imagePrompts = { ...out.imagePrompts, hero: prompt };
      const p = path.join(getDeckLandingsDir(), `${slug}.json`);
      await writeFile(p, JSON.stringify(out, null, 2), 'utf8');
    }

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
