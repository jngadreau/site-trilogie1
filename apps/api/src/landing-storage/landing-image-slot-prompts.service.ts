import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DeckLandingImageAssemblyService } from '../site/deck-landing-image-assembly.service';
import { extractFirstJsonArray } from '../site/json-extract.util';
import type { DeckLandingGlobals } from '../site/deck-modular-landing.types';
import type { DeckSectionMediaSlotV1 } from '../site/deck-modular-landing.types';
import { DeckLandingStorageService } from './deck-landing-storage.service';
import { normalizeImageSlotsInLandingDoc } from './landing-image-slots-normalize';

function isRecord(x: unknown): x is Record<string, unknown> {
  return Boolean(x) && typeof x === 'object' && !Array.isArray(x);
}

function coercePromptAlternatives(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x === 'string') {
      const t = x.trim();
      if (t.length > 0) out.push(t);
      continue;
    }
    if (isRecord(x) && typeof x.prompt === 'string') {
      const t = x.prompt.trim();
      if (t.length > 0) out.push(t);
    }
  }
  return out;
}

@Injectable()
export class LandingImageSlotPromptsService {
  private readonly logger = new Logger(LandingImageSlotPromptsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly storage: DeckLandingStorageService,
    private readonly assembly: DeckLandingImageAssemblyService,
  ) {}

  async suggestPromptAlternatives(
    projectId: string,
    versionId: string,
    dto: { sectionId: string; slotId: string; count?: number },
  ): Promise<{ model: string; promptAlternativesEn: string[] }> {
    await this.storage.assertVersionBelongsToProject(projectId, versionId);

    const want = dto.count ?? 6;
    if (want < 5 || want > 12) {
      throw new BadRequestException('count doit être entre 5 et 12');
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

    const v = await this.storage.getVersion(versionId);
    const content = JSON.parse(JSON.stringify(v.content ?? {})) as Record<string, unknown>;
    normalizeImageSlotsInLandingDoc(content);

    const sections = content.sections;
    if (!Array.isArray(sections)) {
      throw new BadRequestException('content.sections manquant');
    }

    const globalsRaw = content.globals;
    if (!globalsRaw || typeof globalsRaw !== 'object' || Array.isArray(globalsRaw)) {
      throw new BadRequestException('content.globals manquant');
    }
    const globals = globalsRaw as DeckLandingGlobals;

    const sec = sections.find((s) => isRecord(s) && s.id === dto.sectionId);
    if (!sec || !isRecord(sec)) {
      throw new BadRequestException(`Section inconnue : ${dto.sectionId}`);
    }

    const slots = Array.isArray(sec.imageSlots) ? sec.imageSlots : [];
    const slotIdx = slots.findIndex(
      (x) => isRecord(x) && (x as { slotId?: string }).slotId === dto.slotId,
    );
    if (slotIdx < 0) {
      throw new BadRequestException(`Slot inconnu : ${dto.sectionId} / ${dto.slotId}`);
    }

    const slotDef = slots[slotIdx] as Record<string, unknown>;
    const mediaList = Array.isArray(sec.media) ? sec.media : [];
    const fromMedia = mediaList.find(
      (m): m is Record<string, unknown> => isRecord(m) && m.slotId === dto.slotId,
    );

    const scene =
      typeof slotDef.sceneDescription === 'string' && slotDef.sceneDescription.trim()
        ? slotDef.sceneDescription.trim()
        : typeof fromMedia?.sceneDescription === 'string' && String(fromMedia.sceneDescription).trim()
          ? String(fromMedia.sceneDescription).trim()
          : '';
    if (!scene) {
      throw new BadRequestException(
        'sceneDescription vide pour ce slot — remplis la scène avant de demander des variantes',
      );
    }

    const mediaSlot: DeckSectionMediaSlotV1 = {
      slotId: dto.slotId,
      aspectRatio:
        typeof fromMedia?.aspectRatio === 'string' && fromMedia.aspectRatio.trim()
          ? fromMedia.aspectRatio.trim()
          : typeof slotDef.aspectRatio === 'string' && String(slotDef.aspectRatio).trim()
            ? String(slotDef.aspectRatio).trim()
            : '16:9',
      sceneDescription: scene,
      ...(typeof fromMedia?.mood === 'string' ? { mood: fromMedia.mood } : {}),
      ...(typeof fromMedia?.styleVisual === 'string' ? { styleVisual: fromMedia.styleVisual } : {}),
      ...(typeof fromMedia?.colorContext === 'string' ? { colorContext: fromMedia.colorContext } : {}),
      ...(typeof fromMedia?.constraints === 'string' ? { constraints: fromMedia.constraints } : {}),
      ...(typeof slotDef.altHintFr === 'string'
        ? { altHintFr: slotDef.altHintFr }
        : typeof fromMedia?.altHintFr === 'string'
          ? { altHintFr: fromMedia.altHintFr as string }
          : {}),
    };

    const baselineEn = this.assembly.buildImaginePrompt(mediaSlot, globals);
    const purpose = typeof slotDef.purpose === 'string' ? slotDef.purpose : 'other';

    const system = `You write image-generation prompts in English for a deck-game landing page.
Respond with ONLY valid JSON: a JSON array of exactly ${want} strings.
Each string must be one full standalone prompt (not a fragment), suitable for an image model.
Vary composition, lighting, and emphasis while staying on-brand with the brief; do not contradict the global visual direction.
No markdown, no keys, no explanation — only the array.`;

    const user = `Section: ${dto.sectionId}
Slot: ${dto.slotId}
Purpose: ${purpose}
Aspect ratio hint: ${mediaSlot.aspectRatio}

Baseline prompt (improve / diversify; do not copy verbatim — create ${want} distinct alternatives):
---
${baselineEn}
---

Output: JSON array of ${want} English prompt strings.`;

    const client = new OpenAI({ apiKey, baseURL: baseUrl });
    this.logger.log(`suggest-prompt-alternatives version=${versionId} ${dto.sectionId}/${dto.slotId} n=${want}`);

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.65,
      max_tokens: 8000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      throw new InternalServerErrorException('Pas de réponse Grok (variantes prompt)');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractFirstJsonArray(raw));
    } catch (e) {
      this.logger.warn(`JSON variantes: ${(e as Error).message}`);
      throw new InternalServerErrorException('Réponse Grok : JSON tableau invalide');
    }

    const alternatives = coercePromptAlternatives(parsed);
    if (alternatives.length < 5) {
      throw new InternalServerErrorException(
        `Grok a renvoyé trop peu de variantes (${alternatives.length}), minimum 5`,
      );
    }

    const finalAlts = alternatives.slice(0, want);

    const prevGen =
      slotDef.generation && typeof slotDef.generation === 'object' && !Array.isArray(slotDef.generation)
        ? { ...(slotDef.generation as Record<string, unknown>) }
        : {};
    slotDef.generation = {
      ...prevGen,
      promptAlternativesEn: finalAlts,
    };

    await this.storage.persistVersionContent(versionId, content);

    return { model, promptAlternativesEn: finalAlts };
  }
}
