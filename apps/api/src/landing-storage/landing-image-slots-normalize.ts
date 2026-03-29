import type {
  DeckLandingImagePurpose,
  DeckLandingImageSlotDefinition,
  DeckLandingResolvedImageRef,
  DeckSectionMediaSlotV1,
} from '../site/deck-modular-landing.types';
import { HERO_VARIANTS_WITH_IMAGINE_BANNER } from './deck-landing-mongo-media-slot-patch';
import {
  SECTION_BACKGROUND_DEFAULT_SCENE_EN,
  SECTION_BACKGROUND_SLOT_ID,
} from './section-background-slot.constants';

function isRecord(x: unknown): x is Record<string, unknown> {
  return Boolean(x) && typeof x === 'object' && !Array.isArray(x);
}

function coerceMediaSlot(raw: unknown): DeckSectionMediaSlotV1 | null {
  if (!isRecord(raw)) return null;
  const slotId = typeof raw.slotId === 'string' ? raw.slotId.trim() : '';
  const sceneDescription =
    typeof raw.sceneDescription === 'string' ? raw.sceneDescription.trim() : '';
  const aspectRatio = typeof raw.aspectRatio === 'string' ? raw.aspectRatio.trim() : '16:9';
  if (!slotId || !sceneDescription) return null;
  return {
    slotId,
    aspectRatio,
    sceneDescription,
    ...(typeof raw.mood === 'string' ? { mood: raw.mood } : {}),
    ...(typeof raw.styleVisual === 'string' ? { styleVisual: raw.styleVisual } : {}),
    ...(typeof raw.colorContext === 'string' ? { colorContext: raw.colorContext } : {}),
    ...(typeof raw.constraints === 'string' ? { constraints: raw.constraints } : {}),
    ...(typeof raw.altHintFr === 'string' ? { altHintFr: raw.altHintFr } : {}),
  };
}

/**
 * Déduit le `purpose` plan image-management à partir du contexte section + slot.
 */
export function inferImageSlotPurpose(
  sectionId: string,
  variant: string,
  slotId: string,
): DeckLandingImagePurpose {
  if (sectionId === 'hero' && slotId === 'hero') {
    if (HERO_VARIANTS_WITH_IMAGINE_BANNER.has(variant)) {
      return 'hero_banner';
    }
    return 'other';
  }
  if (sectionId === 'creator' && slotId === 'creator') {
    return 'lifestyle';
  }
  if (sectionId === 'testimonials') {
    return 'lifestyle';
  }
  if (sectionId === 'photo_gallery') {
    if (/^photo-\d+$/i.test(slotId) || /^item-\d+$/i.test(slotId)) {
      return 'lifestyle';
    }
  }
  if (slotId === sectionId) {
    return 'decoration';
  }
  return 'other';
}

/**
 * Remplit `sections[].imageSlots` à partir de `media[]` (sans supprimer `media`).
 * Réutilise `generation` / `resolved` / `deckAssetRef` existants par `slotId` si présents.
 */
export function normalizeImageSlotsInLandingDoc(doc: Record<string, unknown>): void {
  const sections = doc.sections;
  if (!Array.isArray(sections)) return;

  for (const sec of sections) {
    if (!isRecord(sec)) continue;
    const sectionId = typeof sec.id === 'string' ? sec.id : '';
    const variant = typeof sec.variant === 'string' ? sec.variant : '';
    const media = Array.isArray(sec.media) ? sec.media : [];

    const prevBySlot = new Map<string, DeckLandingImageSlotDefinition>();
    const prevSlots = sec.imageSlots;
    if (Array.isArray(prevSlots)) {
      for (const p of prevSlots) {
        if (isRecord(p) && typeof p.slotId === 'string') {
          prevBySlot.set(p.slotId, p as unknown as DeckLandingImageSlotDefinition);
        }
      }
    }

    const imageSlots: DeckLandingImageSlotDefinition[] = [];
    for (const raw of media) {
      const slot = coerceMediaSlot(raw);
      if (!slot) continue;

      const purpose = inferImageSlotPurpose(sectionId, variant, slot.slotId);
      const prev = prevBySlot.get(slot.slotId);

      const gen = prev?.generation;
      imageSlots.push({
        slotId: slot.slotId,
        purpose,
        aspectRatio: slot.aspectRatio,
        sceneDescription: slot.sceneDescription,
        ...(slot.mood ? { mood: slot.mood } : {}),
        ...(slot.styleVisual ? { styleVisual: slot.styleVisual } : {}),
        ...(slot.colorContext ? { colorContext: slot.colorContext } : {}),
        ...(slot.constraints ? { constraints: slot.constraints } : {}),
        ...(slot.altHintFr ? { altHintFr: slot.altHintFr } : {}),
        ...(prev?.deckAssetRef ? { deckAssetRef: prev.deckAssetRef } : {}),
        ...(prev?.resolved ? { resolved: prev.resolved } : {}),
        generation: {
          autoGenerate: gen?.autoGenerate !== false,
          primaryModel: gen?.primaryModel ?? 'grok_imagine',
          ...(gen?.assembledPromptEn ? { assembledPromptEn: gen.assembledPromptEn } : {}),
          ...(gen?.promptAlternativesEn?.length ? { promptAlternativesEn: gen.promptAlternativesEn } : {}),
          ...(gen?.originalIndicationFingerprint
            ? { originalIndicationFingerprint: gen.originalIndicationFingerprint }
            : {}),
          ...(gen?.lastGeneratedAt ? { lastGeneratedAt: gen.lastGeneratedAt } : {}),
        },
      });
    }

    const slotIdsFromMedia = new Set(imageSlots.map((s) => s.slotId));
    if (!slotIdsFromMedia.has(SECTION_BACKGROUND_SLOT_ID)) {
      const prevBg = prevBySlot.get(SECTION_BACKGROUND_SLOT_ID);
      if (prevBg) {
        imageSlots.push(JSON.parse(JSON.stringify(prevBg)) as DeckLandingImageSlotDefinition);
      }
    }

    const rawBg = sec.backgroundImage;
    const bgUrlFromField =
      rawBg && typeof rawBg === 'object' && !Array.isArray(rawBg)
        ? typeof (rawBg as Record<string, unknown>).imageUrl === 'string'
          ? String((rawBg as Record<string, unknown>).imageUrl).trim()
          : ''
        : '';
    const bgAltFromField =
      rawBg && typeof rawBg === 'object' && !Array.isArray(rawBg)
        ? typeof (rawBg as Record<string, unknown>).imageAlt === 'string'
          ? String((rawBg as Record<string, unknown>).imageAlt).trim()
          : ''
        : '';
    const rawSrc =
      rawBg && typeof rawBg === 'object' && !Array.isArray(rawBg)
        ? (rawBg as Record<string, unknown>).source
        : undefined;
    const bgSourceFromField: DeckLandingResolvedImageRef['source'] | undefined =
      rawSrc === 'grok_imagine' ||
      rawSrc === 'midjourney' ||
      rawSrc === 'upload' ||
      rawSrc === 'deck_mirror' ||
      rawSrc === 'external'
        ? rawSrc
        : undefined;

    let bgIdx = imageSlots.findIndex((s) => s.slotId === SECTION_BACKGROUND_SLOT_ID);

    if (bgUrlFromField) {
      if (bgIdx < 0) {
        const prev = prevBySlot.get(SECTION_BACKGROUND_SLOT_ID);
        const gen = prev?.generation;
        imageSlots.unshift({
          slotId: SECTION_BACKGROUND_SLOT_ID,
          purpose: 'section_background',
          aspectRatio:
            typeof prev?.aspectRatio === 'string' && prev.aspectRatio.trim()
              ? prev.aspectRatio.trim()
              : '16:9',
          sceneDescription:
            typeof prev?.sceneDescription === 'string' && prev.sceneDescription.trim()
              ? prev.sceneDescription.trim()
              : SECTION_BACKGROUND_DEFAULT_SCENE_EN,
          ...(prev?.mood ? { mood: prev.mood } : {}),
          ...(prev?.styleVisual ? { styleVisual: prev.styleVisual } : {}),
          ...(prev?.colorContext ? { colorContext: prev.colorContext } : {}),
          ...(prev?.constraints ? { constraints: prev.constraints } : {}),
          ...(prev?.altHintFr ? { altHintFr: prev.altHintFr } : {}),
          ...(prev?.deckAssetRef ? { deckAssetRef: prev.deckAssetRef } : {}),
          resolved: {
            imageUrl: bgUrlFromField,
            ...(bgAltFromField ? { imageAlt: bgAltFromField } : {}),
            ...(bgSourceFromField ? { source: bgSourceFromField } : {}),
          },
          generation: {
            autoGenerate: gen?.autoGenerate !== false,
            primaryModel: gen?.primaryModel ?? 'grok_imagine',
            ...(gen?.assembledPromptEn ? { assembledPromptEn: gen.assembledPromptEn } : {}),
            ...(gen?.promptAlternativesEn?.length ? { promptAlternativesEn: gen.promptAlternativesEn } : {}),
            ...(gen?.originalIndicationFingerprint
              ? { originalIndicationFingerprint: gen.originalIndicationFingerprint }
              : {}),
            ...(gen?.lastGeneratedAt ? { lastGeneratedAt: gen.lastGeneratedAt } : {}),
          },
        });
      } else {
        const cur = imageSlots[bgIdx];
        cur.purpose = 'section_background';
        cur.resolved = {
          imageUrl: bgUrlFromField,
          ...(bgAltFromField ? { imageAlt: bgAltFromField } : {}),
          ...(bgSourceFromField ? { source: bgSourceFromField } : {}),
        };
      }
    } else if (bgIdx >= 0) {
      const cur = imageSlots[bgIdx];
      cur.purpose = 'section_background';
      const slotUrl =
        cur.resolved && typeof cur.resolved.imageUrl === 'string'
          ? cur.resolved.imageUrl.trim()
          : '';
      if (slotUrl) {
        sec.backgroundImage = {
          imageUrl: slotUrl,
          ...(cur.resolved?.imageAlt ? { imageAlt: String(cur.resolved.imageAlt) } : {}),
          ...(cur.resolved?.source ? { source: cur.resolved.source } : {}),
        };
      } else {
        delete sec.backgroundImage;
        if (!slotIdsFromMedia.has(SECTION_BACKGROUND_SLOT_ID)) {
          const gen =
            cur.generation && typeof cur.generation === 'object' && !Array.isArray(cur.generation)
              ? (cur.generation as Record<string, unknown>)
              : null;
          const rawAlts = gen?.promptAlternativesEn;
          const hasAlternatives = Array.isArray(rawAlts) && rawAlts.length > 0;
          const assembled =
            typeof gen?.assembledPromptEn === 'string' ? gen.assembledPromptEn.trim() : '';
          const hasAssembled = assembled.length > 0;
          const scene = typeof cur.sceneDescription === 'string' ? cur.sceneDescription.trim() : '';
          const hasCustomScene =
            scene.length > 0 && scene !== SECTION_BACKGROUND_DEFAULT_SCENE_EN;
          if (!hasAlternatives && !hasAssembled && !hasCustomScene) {
            imageSlots.splice(bgIdx, 1);
          }
        }
      }
    } else {
      delete sec.backgroundImage;
    }

    bgIdx = imageSlots.findIndex((s) => s.slotId === SECTION_BACKGROUND_SLOT_ID);
    if (bgIdx > 0) {
      const [row] = imageSlots.splice(bgIdx, 1);
      imageSlots.unshift(row);
    }

    sec.imageSlots = imageSlots;
  }
}
