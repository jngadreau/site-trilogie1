import type {
  DeckLandingImagePurpose,
  DeckLandingImageSlotDefinition,
  DeckSectionMediaSlotV1,
} from '../site/deck-modular-landing.types';
import { HERO_VARIANTS_WITH_IMAGINE_BANNER } from './deck-landing-mongo-media-slot-patch';

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

    sec.imageSlots = imageSlots;
  }
}
