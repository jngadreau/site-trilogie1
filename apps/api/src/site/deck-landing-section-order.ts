/** Ordre fixe des sections pour pipeline BullMQ, Grok et validation JSON. */
export const DECK_LANDING_SECTION_ORDER = [
  'hero',
  'deck_identity',
  'for_who',
  'outcomes',
  'how_to_use',
  'in_the_box',
  'card_gallery',
  'photo_gallery',
  'faq',
  'creator',
  'related_decks',
  'cta_band',
] as const;

export type DeckLandingSectionId = (typeof DECK_LANDING_SECTION_ORDER)[number];
