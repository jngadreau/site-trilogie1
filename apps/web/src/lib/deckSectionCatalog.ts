/** Ordre des sections landing deck (aligné API + prompts). */
export const DECK_SECTION_ORDER = [
  'hero',
  'deck_identity',
  'for_who',
  'outcomes',
  'how_to_use',
  'cta_band',
] as const

export type DeckSectionKey = (typeof DECK_SECTION_ORDER)[number]

export const VARIANTS_BY_SECTION: Record<DeckSectionKey, readonly string[]> = {
  hero: [
    'HeroSplitImageRight',
    'HeroFullBleed',
    'HeroGlowVault',
    'HeroParallaxLayers',
    'HeroCardsFan',
    'HeroCardsStrip',
    'HeroCardsMosaic',
  ],
  deck_identity: ['IdentityPanel', 'IdentityMinimal'],
  for_who: ['ForWhoTwoColumns', 'ForWhoPillars'],
  outcomes: ['OutcomesBentoGrid', 'OutcomesSignalStrip'],
  how_to_use: ['HowToNumbered', 'HowToTimeline'],
  cta_band: ['CtaMarqueeRibbon', 'CtaSplitAction'],
}

export const SECTION_LABELS_FR: Record<DeckSectionKey, string> = {
  hero: 'Hero',
  deck_identity: 'Identité deck',
  for_who: 'Pour qui',
  outcomes: 'Bienfaits (outcomes)',
  how_to_use: 'Comment utiliser',
  cta_band: 'Bandeau CTA',
}
