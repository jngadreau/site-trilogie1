import type { ComponentType } from 'react'
import type { DeckLandingSection } from '../types/deckLanding'
import { CtaMarqueeRibbon } from './cta_band/CtaMarqueeRibbon'
import type { CtaMarqueeRibbonProps } from './cta_band/CtaMarqueeRibbon'
import { CtaSplitAction } from './cta_band/CtaSplitAction'
import type { CtaSplitActionProps } from './cta_band/CtaSplitAction'
import { HeroCardsFan } from './hero/HeroCardsFan'
import type { HeroCardsFanProps } from './hero/HeroCardsFan'
import { HeroCardsMosaic } from './hero/HeroCardsMosaic'
import type { HeroCardsMosaicProps } from './hero/HeroCardsMosaic'
import { HeroCardsStrip } from './hero/HeroCardsStrip'
import type { HeroCardsStripProps } from './hero/HeroCardsStrip'
import { HeroFullBleed } from './hero/HeroFullBleed'
import type { HeroFullBleedProps } from './hero/HeroFullBleed'
import { HeroGlowVault } from './hero/HeroGlowVault'
import type { HeroGlowVaultProps } from './hero/HeroGlowVault'
import { HeroParallaxLayers } from './hero/HeroParallaxLayers'
import type { HeroParallaxLayersProps } from './hero/HeroParallaxLayers'
import { HeroSplitImageRight } from './hero/HeroSplitImageRight'
import type { HeroSplitImageRightProps } from './hero/HeroSplitImageRight'
import { IdentityMinimal } from './deck_identity/IdentityMinimal'
import type { IdentityMinimalProps } from './deck_identity/IdentityMinimal'
import { IdentityPanel } from './deck_identity/IdentityPanel'
import type { IdentityPanelProps } from './deck_identity/IdentityPanel'
import { ForWhoPillars } from './for_who/ForWhoPillars'
import type { ForWhoPillarsProps } from './for_who/ForWhoPillars'
import { ForWhoTwoColumns } from './for_who/ForWhoTwoColumns'
import type { ForWhoTwoColumnsProps } from './for_who/ForWhoTwoColumns'
import { OutcomesBentoGrid } from './outcomes/OutcomesBentoGrid'
import type { OutcomesBentoGridProps } from './outcomes/OutcomesBentoGrid'
import { OutcomesSignalStrip } from './outcomes/OutcomesSignalStrip'
import type { OutcomesSignalStripProps } from './outcomes/OutcomesSignalStrip'
import { HowToNumbered } from './how_to_use/HowToNumbered'
import type { HowToNumberedProps } from './how_to_use/HowToNumbered'
import { HowToTimeline } from './how_to_use/HowToTimeline'
import type { HowToTimelineProps } from './how_to_use/HowToTimeline'
import { IncludedChecklist } from './in_the_box/IncludedChecklist'
import { IncludedHighlightGrid } from './in_the_box/IncludedHighlightGrid'
import { FaqAccordion } from './faq/FaqAccordion'
import { FaqTwoColumn } from './faq/FaqTwoColumn'
import { CreatorSpotlight } from './creator/CreatorSpotlight'
import { CreatorQuoteBand } from './creator/CreatorQuoteBand'
import { RelatedDecksGrid } from './related_decks/RelatedDecksGrid'
import { RelatedDecksInline } from './related_decks/RelatedDecksInline'

type AnyProps =
  | HeroSplitImageRightProps
  | HeroFullBleedProps
  | HeroGlowVaultProps
  | HeroParallaxLayersProps
  | HeroCardsFanProps
  | HeroCardsStripProps
  | HeroCardsMosaicProps
  | IdentityPanelProps
  | IdentityMinimalProps
  | ForWhoTwoColumnsProps
  | ForWhoPillarsProps
  | OutcomesBentoGridProps
  | OutcomesSignalStripProps
  | HowToNumberedProps
  | HowToTimelineProps
  | CtaMarqueeRibbonProps
  | CtaSplitActionProps

const registry: Record<string, ComponentType<AnyProps>> = {
  HeroSplitImageRight: HeroSplitImageRight as ComponentType<AnyProps>,
  HeroFullBleed: HeroFullBleed as ComponentType<AnyProps>,
  HeroGlowVault: HeroGlowVault as ComponentType<AnyProps>,
  HeroParallaxLayers: HeroParallaxLayers as ComponentType<AnyProps>,
  HeroCardsFan: HeroCardsFan as unknown as ComponentType<AnyProps>,
  HeroCardsStrip: HeroCardsStrip as unknown as ComponentType<AnyProps>,
  HeroCardsMosaic: HeroCardsMosaic as unknown as ComponentType<AnyProps>,
  IdentityPanel: IdentityPanel as ComponentType<AnyProps>,
  IdentityMinimal: IdentityMinimal as ComponentType<AnyProps>,
  ForWhoTwoColumns: ForWhoTwoColumns as ComponentType<AnyProps>,
  ForWhoPillars: ForWhoPillars as ComponentType<AnyProps>,
  OutcomesBentoGrid: OutcomesBentoGrid as ComponentType<AnyProps>,
  OutcomesSignalStrip: OutcomesSignalStrip as ComponentType<AnyProps>,
  HowToNumbered: HowToNumbered as ComponentType<AnyProps>,
  HowToTimeline: HowToTimeline as ComponentType<AnyProps>,
  CtaMarqueeRibbon: CtaMarqueeRibbon as ComponentType<AnyProps>,
  CtaSplitAction: CtaSplitAction as ComponentType<AnyProps>,
  IncludedChecklist: IncludedChecklist as unknown as ComponentType<AnyProps>,
  IncludedHighlightGrid: IncludedHighlightGrid as unknown as ComponentType<AnyProps>,
  FaqAccordion: FaqAccordion as unknown as ComponentType<AnyProps>,
  FaqTwoColumn: FaqTwoColumn as unknown as ComponentType<AnyProps>,
  CreatorSpotlight: CreatorSpotlight as unknown as ComponentType<AnyProps>,
  CreatorQuoteBand: CreatorQuoteBand as unknown as ComponentType<AnyProps>,
  RelatedDecksGrid: RelatedDecksGrid as unknown as ComponentType<AnyProps>,
  RelatedDecksInline: RelatedDecksInline as unknown as ComponentType<AnyProps>,
}

export function renderDeckSection(section: DeckLandingSection) {
  const Cmp = registry[section.variant]
  if (!Cmp) {
    return (
      <section key={section.id} className="dl-missing">
        <p>Variante inconnue : {section.variant}</p>
      </section>
    )
  }
  return <Cmp key={section.id} {...(section.props as AnyProps)} />
}
