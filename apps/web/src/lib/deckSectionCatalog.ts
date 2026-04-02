/** Ordre des sections landing deck (aligné API + prompts). */
export const DECK_SECTION_ORDER = [
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
  'testimonials',
  'newsletter_cta',
  'related_decks',
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
  in_the_box: ['IncludedChecklist', 'IncludedHighlightGrid'],
  card_gallery: ['CardGalleryGrid', 'CardGalleryScroll'],
  photo_gallery: [
    'PhotoSpotlightGrid',
    'PhotoFilmstripRow',
    'PhotoCinematicCollage',
    'PhotoMasonryCascade',
  ],
  faq: ['FaqAccordion', 'FaqTwoColumn'],
  creator: ['CreatorSpotlight', 'CreatorQuoteBand'],
  testimonials: ['TestimonialStrip', 'TestimonialSpotlight'],
  newsletter_cta: ['NewsletterInline', 'NewsletterSplit'],
  related_decks: ['RelatedDecksGrid', 'RelatedDecksInline'],
  cta_band: ['CtaMarqueeRibbon', 'CtaSplitAction'],
}

export const SECTION_LABELS_FR: Record<DeckSectionKey, string> = {
  hero: 'Hero',
  deck_identity: 'Identité deck',
  for_who: 'Pour qui',
  outcomes: 'Bienfaits (outcomes)',
  how_to_use: 'Comment utiliser',
  in_the_box: 'Contenu du jeu',
  card_gallery: 'Galerie cartes',
  photo_gallery: 'Photos & ambiance',
  faq: 'FAQ',
  creator: 'Créatrice / ligne éditoriale',
  testimonials: 'Témoignages',
  newsletter_cta: 'Newsletter / inscription',
  related_decks: 'Jeux liés (trilogie)',
  cta_band: 'Bandeau CTA',
}

/** Rôles éditoriaux (FR) — alignés API `DECK_SECTION_CATALOG_FR` pour la suggestion Grok. */
export const SECTION_ROLE_HINTS_FR: Record<DeckSectionKey, string> = {
  hero: 'Accroche principale : titre, texte, CTA, image pleine largeur ou cartes en vedette.',
  deck_identity: 'Nom du jeu, promesse en une phrase, badge ou ton minimal.',
  for_who: 'Public cible : profils, besoins, niveau (débutant / avancé).',
  outcomes: 'Bénéfices ressentis : grille bento ou bandeau de « signaux ».',
  how_to_use: 'Comment tirer les cartes : étapes numérotées ou frise temporelle.',
  in_the_box: 'Contenu physique : cartes, livret, étui, format.',
  card_gallery: 'Grille ou défilement de faces de cartes (choix des numéros).',
  photo_gallery: 'Photos ambiance, coffret, lifestyle (hors simples faces cartes).',
  faq: 'Questions fréquentes : accordéon ou deux colonnes.',
  creator: 'Créatrice ou ligne éditoriale : portrait / citation.',
  testimonials: 'Avis ou citations : plusieurs courts ou un témoignage mis en avant.',
  newsletter_cta: 'Inscription e-mail : bloc centré ou colonnes texte + formulaire.',
  related_decks: 'Autres jeux de la même famille / trilogie.',
  cta_band: 'Dernière incitation à l’action : bandeau ou double bouton.',
}
