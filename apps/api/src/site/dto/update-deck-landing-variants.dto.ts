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
const DECK_ID = ['IdentityPanel', 'IdentityMinimal'] as const;
const FOR_WHO = ['ForWhoTwoColumns', 'ForWhoPillars'] as const;
const OUTCOMES = ['OutcomesBentoGrid', 'OutcomesSignalStrip'] as const;
const HOW = ['HowToNumbered', 'HowToTimeline'] as const;
const IN_BOX = ['IncludedChecklist', 'IncludedHighlightGrid'] as const;
const CARD_GALLERY = ['CardGalleryGrid', 'CardGalleryScroll'] as const;
const PHOTO_GALLERY = ['PhotoSpotlightGrid', 'PhotoFilmstripRow'] as const;
const FAQ = ['FaqAccordion', 'FaqTwoColumn'] as const;
const CREATOR = ['CreatorSpotlight', 'CreatorQuoteBand'] as const;
const RELATED = ['RelatedDecksGrid', 'RelatedDecksInline'] as const;
const CTA = ['CtaMarqueeRibbon', 'CtaSplitAction'] as const;

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
  @IsIn([...RELATED])
  related_decks?: string;

  @IsOptional()
  @IsString()
  @IsIn([...CTA])
  cta_band?: string;
}
