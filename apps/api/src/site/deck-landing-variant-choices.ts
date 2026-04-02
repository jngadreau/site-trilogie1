import { DECK_LANDING_SECTION_ORDER, type DeckLandingSectionId } from './deck-landing-section-order';

export const DECK_SECTION_ORDER = DECK_LANDING_SECTION_ORDER;

/** Variantes React autorisées par identifiant de section (source unique pour API éditeur + modular landing). */
export const DECK_VARIANT_CHOICES: Record<DeckLandingSectionId, readonly string[]> = {
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
};
