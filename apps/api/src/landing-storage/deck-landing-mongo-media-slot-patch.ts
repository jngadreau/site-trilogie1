import type { DeckSectionMediaSlotV1 } from '../site/deck-modular-landing.types';

/** Hero avec bannière Imagine (pas les variantes « cartes seules »). */
export const HERO_VARIANTS_WITH_IMAGINE_BANNER = new Set([
  'HeroSplitImageRight',
  'HeroFullBleed',
  'HeroGlowVault',
  'HeroParallaxLayers',
]);

const TESTIMONIAL_PORTRAIT_SLOT_IDS = new Set([
  'author',
  'portrait',
  'photo',
  'testimonial',
  'spotlight',
]);

function ensureProps(section: Record<string, unknown>): Record<string, unknown> {
  const p = section.props;
  if (p && typeof p === 'object' && !Array.isArray(p)) {
    return p as Record<string, unknown>;
  }
  const next: Record<string, unknown> = {};
  section.props = next;
  return next;
}

/**
 * Écrit l’URL image dans `props` (ou sous-objet) selon section / slot.
 * Retourne `false` si ce couple n’est pas pris en charge (pas d’Imagine côté JSON).
 */
export function applySlotImageUrlToSectionContent(
  section: Record<string, unknown>,
  sectionId: string,
  variant: string,
  slot: DeckSectionMediaSlotV1,
  imageUrl: string,
): boolean {
  const props = ensureProps(section);
  const alt = slot.altHintFr?.trim();

  if (sectionId === 'hero' && slot.slotId === 'hero') {
    if (!HERO_VARIANTS_WITH_IMAGINE_BANNER.has(variant)) {
      return false;
    }
    props.imageUrl = imageUrl;
    if (alt) props.imageAlt = alt;
    return true;
  }

  if (sectionId === 'creator' && slot.slotId === 'creator') {
    props.imageUrl = imageUrl;
    if (alt) props.imageAlt = alt;
    return true;
  }

  if (sectionId === 'testimonials') {
    const media = Array.isArray(section.media) ? section.media : [];
    const singleSlot =
      media.length === 1 &&
      media[0] &&
      typeof media[0] === 'object' &&
      (media[0] as DeckSectionMediaSlotV1).slotId === slot.slotId;
    if (TESTIMONIAL_PORTRAIT_SLOT_IDS.has(slot.slotId) || singleSlot) {
      props.imageUrl = imageUrl;
      if (alt) props.imageAlt = alt;
      return true;
    }
  }

  const photoIdx = /^photo-(\d+)$/i.exec(slot.slotId);
  if (photoIdx && sectionId === 'photo_gallery') {
    const idx = Number.parseInt(photoIdx[1], 10);
    for (const key of ['photos', 'items'] as const) {
      const arr = props[key];
      if (Array.isArray(arr) && arr[idx] && typeof arr[idx] === 'object') {
        const cell = arr[idx] as Record<string, unknown>;
        cell.imageUrl = imageUrl;
        if (alt) cell.imageAlt = alt;
        return true;
      }
    }
  }

  const itemIdx = /^item-(\d+)$/i.exec(slot.slotId);
  if (itemIdx && sectionId === 'photo_gallery') {
    const idx = Number.parseInt(itemIdx[1], 10);
    const arr = props.items;
    if (Array.isArray(arr) && arr[idx] && typeof arr[idx] === 'object') {
      const cell = arr[idx] as Record<string, unknown>;
      cell.imageUrl = imageUrl;
      if (alt) cell.imageAlt = alt;
      return true;
    }
  }

  if (slot.slotId === sectionId) {
    props.imageUrl = imageUrl;
    if (alt) props.imageAlt = alt;
    return true;
  }

  return false;
}
