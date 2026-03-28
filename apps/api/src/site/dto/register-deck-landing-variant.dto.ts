import { IsIn, IsString, Matches } from 'class-validator';

const HERO = [
  'HeroSplitImageRight',
  'HeroFullBleed',
  'HeroGlowVault',
  'HeroParallaxLayers',
] as const;
const DECK_ID = ['IdentityPanel', 'IdentityMinimal'] as const;
const FOR_WHO = ['ForWhoTwoColumns', 'ForWhoPillars'] as const;
const OUTCOMES = ['OutcomesBentoGrid', 'OutcomesSignalStrip'] as const;
const HOW = ['HowToNumbered', 'HowToTimeline'] as const;
const CTA = ['CtaMarqueeRibbon', 'CtaSplitAction'] as const;

export class RegisterDeckLandingVariantDto {
  @IsString()
  @Matches(/^arbre-de-vie-[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must look like arbre-de-vie-x or arbre-de-vie-x-y',
  })
  slug!: string;

  @IsString()
  @IsIn([...HERO])
  hero!: string;

  @IsString()
  @IsIn([...DECK_ID])
  deck_identity!: string;

  @IsString()
  @IsIn([...FOR_WHO])
  for_who!: string;

  @IsString()
  @IsIn([...OUTCOMES])
  outcomes!: string;

  @IsString()
  @IsIn([...HOW])
  how_to_use!: string;

  @IsString()
  @IsIn([...CTA])
  cta_band!: string;
}
