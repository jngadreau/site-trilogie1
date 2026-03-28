import type { ComponentType } from 'react'
import type { DeckLandingSection } from '../types/deckLanding'
import { HeroFullBleed } from './hero/HeroFullBleed'
import type { HeroFullBleedProps } from './hero/HeroFullBleed'
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
import { HowToNumbered } from './how_to_use/HowToNumbered'
import type { HowToNumberedProps } from './how_to_use/HowToNumbered'
import { HowToTimeline } from './how_to_use/HowToTimeline'
import type { HowToTimelineProps } from './how_to_use/HowToTimeline'

type AnyProps =
  | HeroSplitImageRightProps
  | HeroFullBleedProps
  | IdentityPanelProps
  | IdentityMinimalProps
  | ForWhoTwoColumnsProps
  | ForWhoPillarsProps
  | HowToNumberedProps
  | HowToTimelineProps

const registry: Record<string, ComponentType<AnyProps>> = {
  HeroSplitImageRight: HeroSplitImageRight as ComponentType<AnyProps>,
  HeroFullBleed: HeroFullBleed as ComponentType<AnyProps>,
  IdentityPanel: IdentityPanel as ComponentType<AnyProps>,
  IdentityMinimal: IdentityMinimal as ComponentType<AnyProps>,
  ForWhoTwoColumns: ForWhoTwoColumns as ComponentType<AnyProps>,
  ForWhoPillars: ForWhoPillars as ComponentType<AnyProps>,
  HowToNumbered: HowToNumbered as ComponentType<AnyProps>,
  HowToTimeline: HowToTimeline as ComponentType<AnyProps>,
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
