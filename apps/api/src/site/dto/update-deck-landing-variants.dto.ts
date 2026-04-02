import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

const HERO = [
  'HeroSplitImageRight',
  'HeroFullBleed',
  'HeroGlowVault',
  'HeroParallaxLayers',
  'HeroCardsFan',
  'HeroCardsStrip',
  'HeroCardsMosaic',
] as const;
const DECK_ID = [
  'IdentityPanel',
  'IdentityMinimal',
  'IdentityPanelFramed',
  'IdentityPanelStory',
  'IdentityMinimalCalm',
  'IdentityMinimalEditorial',
] as const;
const FOR_WHO = [
  'ForWhoTwoColumns',
  'ForWhoPillars',
  'ForWhoTwoColumnsGuide',
  'ForWhoTwoColumnsStory',
  'ForWhoPillarsInsight',
  'ForWhoPillarsCompass',
] as const;
const OUTCOMES = [
  'OutcomesBentoGrid',
  'OutcomesSignalStrip',
  'OutcomesBentoGridAura',
  'OutcomesBentoGridFocus',
  'OutcomesSignalStripFlow',
  'OutcomesSignalStripCalm',
] as const;
const HOW = [
  'HowToNumbered',
  'HowToTimeline',
  'HowToNumberedQuickstart',
  'HowToNumberedRitual',
  'HowToTimelineFlow',
  'HowToTimelineCompass',
] as const;
const IN_BOX = [
  'IncludedChecklist',
  'IncludedHighlightGrid',
  'IncludedChecklistEssentials',
  'IncludedChecklistPremium',
  'IncludedHighlightGridTiles',
  'IncludedHighlightGridShowcase',
] as const;
const CARD_GALLERY = [
  'CardGalleryGrid',
  'CardGalleryScroll',
  'CardGalleryGridCurated',
  'CardGalleryGridDense',
  'CardGalleryScrollSnap',
  'CardGalleryScrollMomentum',
] as const;
const PHOTO_GALLERY = [
  'PhotoSpotlightGrid',
  'PhotoFilmstripRow',
  'PhotoCinematicCollage',
  'PhotoMasonryCascade',
  'PhotoSpotlightGridEditorial',
  'PhotoFilmstripRowStory',
  'PhotoCinematicCollageNarrative',
  'PhotoMasonryCascadeAmbient',
] as const;
const FAQ = [
  'FaqAccordion',
  'FaqTwoColumn',
  'FaqAccordionCalm',
  'FaqAccordionDeep',
  'FaqTwoColumnGuide',
  'FaqTwoColumnBalanced',
] as const;
const CREATOR = [
  'CreatorSpotlight',
  'CreatorQuoteBand',
  'CreatorSpotlightNarrative',
  'CreatorSpotlightPortrait',
  'CreatorQuoteBandManifesto',
  'CreatorQuoteBandSignature',
] as const;
const TESTIMONIALS = [
  'TestimonialStrip',
  'TestimonialSpotlight',
  'TestimonialStripVoices',
  'TestimonialStripMomentum',
  'TestimonialSpotlightHuman',
  'TestimonialSpotlightImmersive',
] as const;
const NEWSLETTER = [
  'NewsletterInline',
  'NewsletterSplit',
  'NewsletterInlineCalm',
  'NewsletterInlinePulse',
  'NewsletterSplitEditorial',
  'NewsletterSplitMinimal',
] as const;
const RELATED = [
  'RelatedDecksGrid',
  'RelatedDecksInline',
  'RelatedDecksGridShowcase',
  'RelatedDecksGridCurated',
  'RelatedDecksInlineJourney',
  'RelatedDecksInlineSimple',
] as const;
const CTA = [
  'CtaMarqueeRibbon',
  'CtaSplitAction',
  'CtaMarqueeRibbonGlow',
  'CtaMarqueeRibbonCalm',
  'CtaSplitActionFocus',
  'CtaSplitActionDual',
] as const;

/**
 * Mise à jour partielle : fournir au moins une section.
 * Les champs omis ou undefined ne modifient pas l’entrée existante.
 */
export class UpdateDeckLandingVariantsDto {
  @IsString()
  @Matches(/^arbre-de-vie-[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must look like arbre-de-vie-x or arbre-de-vie-x-y',
  })
  slug!: string;

  @IsOptional()
  @IsString()
  @IsIn([...HERO])
  hero?: string;

  @IsOptional()
  @IsString()
  @IsIn([...DECK_ID])
  deck_identity?: string;

  @IsOptional()
  @IsString()
  @IsIn([...FOR_WHO])
  for_who?: string;

  @IsOptional()
  @IsString()
  @IsIn([...OUTCOMES])
  outcomes?: string;

  @IsOptional()
  @IsString()
  @IsIn([...HOW])
  how_to_use?: string;

  @IsOptional()
  @IsString()
  @IsIn([...IN_BOX])
  in_the_box?: string;

  @IsOptional()
  @IsString()
  @IsIn([...CARD_GALLERY])
  card_gallery?: string;

  @IsOptional()
  @IsString()
  @IsIn([...PHOTO_GALLERY])
  photo_gallery?: string;

  @IsOptional()
  @IsString()
  @IsIn([...FAQ])
  faq?: string;

  @IsOptional()
  @IsString()
  @IsIn([...CREATOR])
  creator?: string;

  @IsOptional()
  @IsString()
  @IsIn([...TESTIMONIALS])
  testimonials?: string;

  @IsOptional()
  @IsString()
  @IsIn([...NEWSLETTER])
  newsletter_cta?: string;

  @IsOptional()
  @IsString()
  @IsIn([...RELATED])
  related_decks?: string;

  @IsOptional()
  @IsString()
  @IsIn([...CTA])
  cta_band?: string;
}
