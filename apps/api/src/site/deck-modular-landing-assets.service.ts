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
import type {
  DeckModularLandingV1,
  LandingImageHistoryEntryV1,
} from './deck-modular-landing.types';
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
    const outputSlug = `${this.assembly.resolveOutputSlug(slug, sectionId, slotId)}-t${Date.now()}`;

    this.logger.log(`Imagine slot ${slug}/${sectionId}/${slotId}`);

    const { path: imagePath, model } = await this.ai.generateImageToFile({
      prompt,
      outputSlug,
      aspectRatio,
    });

    const fileName = path.basename(imagePath);
    const imageUrl = `/ai/generated-images/${fileName}`;

    await this.jsonPatch.applySlotImage(slug, sectionId, slot, imageUrl, { prompt, model });

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
   * `overridePrompt` force le texte envoyé à Imagine (enregistré aussi dans `imagePrompts.hero`).
   */
  async generateHeroImage(
    slug: string,
    opts?: { overridePrompt?: string },
  ): Promise<{
    imagePath: string;
    imageUrl: string;
    model: string;
    promptSource: 'media-slot' | 'json' | 'synthesized' | 'manual';
    promptPreview: string;
  }> {
    const doc = await this.deckModular.loadDeckLanding(slug);
    const hero = doc.sections.find((s) => s.id === 'hero');
    if (!hero) {
      throw new NotFoundException('Section hero absente');
    }
    if (!HERO_VARIANTS_WITH_IMAGE.has(hero.variant)) {
      throw new InternalServerErrorException(
        `Variante hero « ${hero.variant} » : pas d’Imagine hero (cartes = fichiers /cards/… dans le JSON ; sinon HeroSplitImageRight / HeroFullBleed)`,
      );
    }

    const heroSlot = hero.media?.find((m) => m.slotId === 'hero');
    let prompt: string;
    let aspectRatio = '16:9';
    let baseSlug = `deck-hero-${slug.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    let promptSource: 'media-slot' | 'json' | 'synthesized' | 'manual';

    if (opts?.overridePrompt?.trim()) {
      prompt = opts.overridePrompt.trim();
      promptSource = 'manual';
    } else if (heroSlot) {
      prompt = this.assembly.buildImaginePrompt(heroSlot, doc.globals);
      aspectRatio = this.assembly.resolveAspectRatio(heroSlot);
      baseSlug = this.assembly.resolveOutputSlug(slug, 'hero', 'hero');
      promptSource = 'media-slot';
    } else if (doc.imagePrompts?.hero?.trim()) {
      prompt = doc.imagePrompts.hero.trim();
      promptSource = 'json';
    } else {
      prompt = await this.synthesizeHeroImaginePrompt(doc, hero.variant, hero.props as Record<string, unknown>);
      promptSource = 'synthesized';
    }

    const outputSlug = `${baseSlug}-t${Date.now()}`;

    this.logger.log(`Imagine hero slug=${slug} source=${promptSource}`);

    const { path: imagePath, model } = await this.ai.generateImageToFile({
      prompt,
      outputSlug,
      aspectRatio,
    });

    const fileName = path.basename(imagePath);
    const imageUrl = `/ai/generated-images/${fileName}`;

    if (heroSlot) {
      await this.jsonPatch.applySlotImage(slug, 'hero', heroSlot, imageUrl, { prompt, model });
    } else {
      await this.jsonPatch.applySlotImage(
        slug,
        'hero',
        {
          slotId: 'hero',
          aspectRatio,
          sceneDescription: prompt,
        },
        imageUrl,
        { prompt, model },
      );
    }

    if (promptSource === 'synthesized' || promptSource === 'manual') {
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

  /** État hero + historique PNG pour l’admin (position `hero:hero` seule pour l’instant). */
  async getImageStudioState(slug: string): Promise<{
    slug: string;
    positions: Array<{
      positionKey: string;
      label: string;
      currentImageUrl: string | null;
      promptInJson: string | null;
      versions: LandingImageHistoryEntryV1[];
    }>;
  }> {
    const doc = await this.deckModular.loadDeckLanding(slug);
    const hero = doc.sections.find((s) => s.id === 'hero');
    const url = hero?.props && typeof (hero.props as Record<string, unknown>).imageUrl === 'string'
      ? ((hero.props as Record<string, unknown>).imageUrl as string)
      : null;
    const key = 'hero:hero';
    return {
      slug,
      positions: [
        {
          positionKey: key,
          label: 'Bannière hero',
          currentImageUrl: url,
          promptInJson: doc.imagePrompts?.hero ?? null,
          versions: [...(doc.imageHistory?.[key] ?? [])].reverse(),
        },
      ],
    };
  }

  /** Grok : une variante de prompt **différente** (anglais) pour regénérer le hero. */
  async suggestAlternateHeroPrompt(slug: string): Promise<{
    baseline: string;
    suggestedPrompt: string;
    model: string;
  }> {
    const doc = await this.deckModular.loadDeckLanding(slug);
    const hero = doc.sections.find((s) => s.id === 'hero');
    if (!hero) throw new NotFoundException('Section hero absente');
    if (!HERO_VARIANTS_WITH_IMAGE.has(hero.variant)) {
      throw new InternalServerErrorException(`Hero sans Imagine : ${hero.variant}`);
    }

    const heroSlot = hero.media?.find((m) => m.slotId === 'hero');
    let baseline: string;
    if (heroSlot) {
      baseline = this.assembly.buildImaginePrompt(heroSlot, doc.globals);
    } else if (doc.imagePrompts?.hero?.trim()) {
      baseline = doc.imagePrompts.hero.trim();
    } else {
      baseline = await this.synthesizeHeroImaginePrompt(doc, hero.variant, hero.props as Record<string, unknown>);
    }

    const apiKey = this.config.get<string>('GROK_API_KEY') ?? '';
    const baseUrl = this.config.get<string>('GROK_API_URL') ?? 'https://api.x.ai/v1';
    const model =
      this.config.get<string>('GROK_DECK_LANDING_MODEL')?.trim() ||
      this.config.get<string>('GROK_TEXT_MODEL')?.trim() ||
      'grok-3-mini';

    if (!apiKey) {
      throw new InternalServerErrorException('GROK_API_KEY is not configured');
    }

    const system = `You propose alternative hero banner image prompts for a calm, nature-inspired oracle deck website.
Rules: output ONE English paragraph only — the full new image generation prompt. No quotes, no markdown.
Must be clearly different in mood, composition, or lighting from the baseline, but still coherent for the same product.
No readable text, logos, or UI in the scene. No medical imagery.`;

    const client = new OpenAI({ apiKey, baseURL: baseUrl });
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.75,
      max_tokens: 500,
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: `Landing slug: ${doc.slug}\n\nBaseline prompt:\n${baseline}\n\nProduce one alternative prompt.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      throw new InternalServerErrorException('Pas de prompt alternatif depuis Grok');
    }
    const suggestedPrompt = raw.replace(/^["“”']|["“”']$/g, '').trim();

    return { baseline, suggestedPrompt, model };
  }
}
