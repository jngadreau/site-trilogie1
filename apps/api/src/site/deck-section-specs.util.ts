import { readFile } from 'fs/promises';
import * as path from 'path';
import { VARIANT_TO_SPEC_REL } from './deck-variant-spec-paths';

/** Ordre stable : par type de section puis par nom de variante. */
const SPEC_REL_PATHS = [
  'creator/variants/CreatorQuoteBand.spec.md',
  'creator/variants/CreatorSpotlight.spec.md',
  'cta_band/variants/CtaMarqueeRibbon.spec.md',
  'cta_band/variants/CtaSplitAction.spec.md',
  'card_gallery/variants/CardGalleryGrid.spec.md',
  'card_gallery/variants/CardGalleryScroll.spec.md',
  'deck_identity/variants/IdentityMinimal.spec.md',
  'deck_identity/variants/IdentityPanel.spec.md',
  'faq/variants/FaqAccordion.spec.md',
  'faq/variants/FaqTwoColumn.spec.md',
  'for_who/variants/ForWhoPillars.spec.md',
  'for_who/variants/ForWhoTwoColumns.spec.md',
  'hero/variants/HeroCardsFan.spec.md',
  'hero/variants/HeroCardsMosaic.spec.md',
  'hero/variants/HeroCardsStrip.spec.md',
  'hero/variants/HeroFullBleed.spec.md',
  'hero/variants/HeroGlowVault.spec.md',
  'hero/variants/HeroParallaxLayers.spec.md',
  'hero/variants/HeroSplitImageRight.spec.md',
  'how_to_use/variants/HowToNumbered.spec.md',
  'how_to_use/variants/HowToTimeline.spec.md',
  'in_the_box/variants/IncludedChecklist.spec.md',
  'in_the_box/variants/IncludedHighlightGrid.spec.md',
  'outcomes/variants/OutcomesBentoGrid.spec.md',
  'outcomes/variants/OutcomesSignalStrip.spec.md',
  'photo_gallery/variants/PhotoCinematicCollage.spec.md',
  'photo_gallery/variants/PhotoFilmstripRow.spec.md',
  'photo_gallery/variants/PhotoMasonryCascade.spec.md',
  'photo_gallery/variants/PhotoSpotlightGrid.spec.md',
  'newsletter_cta/variants/NewsletterInline.spec.md',
  'newsletter_cta/variants/NewsletterSplit.spec.md',
  'related_decks/variants/RelatedDecksGrid.spec.md',
  'related_decks/variants/RelatedDecksInline.spec.md',
  'testimonials/variants/TestimonialStrip.spec.md',
  'testimonials/variants/TestimonialSpotlight.spec.md',
] as const;

const ALIAS_VARIANT_TO_SPEC_REL: Record<string, string> = {
  IdentityPanelFramed: 'deck_identity/variants/IdentityPanel.spec.md',
  IdentityPanelStory: 'deck_identity/variants/IdentityPanel.spec.md',
  IdentityMinimalCalm: 'deck_identity/variants/IdentityMinimal.spec.md',
  IdentityMinimalEditorial: 'deck_identity/variants/IdentityMinimal.spec.md',

  ForWhoTwoColumnsGuide: 'for_who/variants/ForWhoTwoColumns.spec.md',
  ForWhoTwoColumnsStory: 'for_who/variants/ForWhoTwoColumns.spec.md',
  ForWhoPillarsInsight: 'for_who/variants/ForWhoPillars.spec.md',
  ForWhoPillarsCompass: 'for_who/variants/ForWhoPillars.spec.md',

  OutcomesBentoGridAura: 'outcomes/variants/OutcomesBentoGrid.spec.md',
  OutcomesBentoGridFocus: 'outcomes/variants/OutcomesBentoGrid.spec.md',
  OutcomesSignalStripFlow: 'outcomes/variants/OutcomesSignalStrip.spec.md',
  OutcomesSignalStripCalm: 'outcomes/variants/OutcomesSignalStrip.spec.md',

  HowToNumberedQuickstart: 'how_to_use/variants/HowToNumbered.spec.md',
  HowToNumberedRitual: 'how_to_use/variants/HowToNumbered.spec.md',
  HowToTimelineFlow: 'how_to_use/variants/HowToTimeline.spec.md',
  HowToTimelineCompass: 'how_to_use/variants/HowToTimeline.spec.md',

  IncludedChecklistEssentials: 'in_the_box/variants/IncludedChecklist.spec.md',
  IncludedChecklistPremium: 'in_the_box/variants/IncludedChecklist.spec.md',
  IncludedHighlightGridTiles: 'in_the_box/variants/IncludedHighlightGrid.spec.md',
  IncludedHighlightGridShowcase: 'in_the_box/variants/IncludedHighlightGrid.spec.md',

  CardGalleryGridCurated: 'card_gallery/variants/CardGalleryGrid.spec.md',
  CardGalleryGridDense: 'card_gallery/variants/CardGalleryGrid.spec.md',
  CardGalleryScrollSnap: 'card_gallery/variants/CardGalleryScroll.spec.md',
  CardGalleryScrollMomentum: 'card_gallery/variants/CardGalleryScroll.spec.md',

  PhotoSpotlightGridEditorial: 'photo_gallery/variants/PhotoSpotlightGrid.spec.md',
  PhotoFilmstripRowStory: 'photo_gallery/variants/PhotoFilmstripRow.spec.md',
  PhotoCinematicCollageNarrative: 'photo_gallery/variants/PhotoCinematicCollage.spec.md',
  PhotoMasonryCascadeAmbient: 'photo_gallery/variants/PhotoMasonryCascade.spec.md',

  FaqAccordionCalm: 'faq/variants/FaqAccordion.spec.md',
  FaqAccordionDeep: 'faq/variants/FaqAccordion.spec.md',
  FaqTwoColumnGuide: 'faq/variants/FaqTwoColumn.spec.md',
  FaqTwoColumnBalanced: 'faq/variants/FaqTwoColumn.spec.md',

  CreatorSpotlightNarrative: 'creator/variants/CreatorSpotlight.spec.md',
  CreatorSpotlightPortrait: 'creator/variants/CreatorSpotlight.spec.md',
  CreatorQuoteBandManifesto: 'creator/variants/CreatorQuoteBand.spec.md',
  CreatorQuoteBandSignature: 'creator/variants/CreatorQuoteBand.spec.md',

  TestimonialStripVoices: 'testimonials/variants/TestimonialStrip.spec.md',
  TestimonialStripMomentum: 'testimonials/variants/TestimonialStrip.spec.md',
  TestimonialSpotlightHuman: 'testimonials/variants/TestimonialSpotlight.spec.md',
  TestimonialSpotlightImmersive: 'testimonials/variants/TestimonialSpotlight.spec.md',

  NewsletterInlineCalm: 'newsletter_cta/variants/NewsletterInline.spec.md',
  NewsletterInlinePulse: 'newsletter_cta/variants/NewsletterInline.spec.md',
  NewsletterSplitEditorial: 'newsletter_cta/variants/NewsletterSplit.spec.md',
  NewsletterSplitMinimal: 'newsletter_cta/variants/NewsletterSplit.spec.md',

  RelatedDecksGridShowcase: 'related_decks/variants/RelatedDecksGrid.spec.md',
  RelatedDecksGridCurated: 'related_decks/variants/RelatedDecksGrid.spec.md',
  RelatedDecksInlineJourney: 'related_decks/variants/RelatedDecksInline.spec.md',
  RelatedDecksInlineSimple: 'related_decks/variants/RelatedDecksInline.spec.md',

  CtaMarqueeRibbonGlow: 'cta_band/variants/CtaMarqueeRibbon.spec.md',
  CtaMarqueeRibbonCalm: 'cta_band/variants/CtaMarqueeRibbon.spec.md',
  CtaSplitActionFocus: 'cta_band/variants/CtaSplitAction.spec.md',
  CtaSplitActionDual: 'cta_band/variants/CtaSplitAction.spec.md',
};

export async function readDeckSectionSpecsBundle(sectionsRoot: string): Promise<string> {
  const chunks: string[] = [];
  for (const rel of SPEC_REL_PATHS) {
    const filePath = path.join(sectionsRoot, rel);
    const body = await readFile(filePath, 'utf8');
    chunks.push(`## Spécification — \`${rel}\`\n\n${body.trim()}`);
  }
  return chunks.join('\n\n---\n\n');
}

export async function readDeckSectionSpecByVariant(
  sectionsRoot: string,
  variant: string,
): Promise<string> {
  const rel = VARIANT_TO_SPEC_REL[variant] ?? ALIAS_VARIANT_TO_SPEC_REL[variant];
  if (!rel) {
    throw new Error(`Variante sans spec MD enregistrée: ${variant}`);
  }
  const filePath = path.join(sectionsRoot, rel);
  return readFile(filePath, 'utf8');
}
