export interface DeckLandingGlobals {
  accent: string
  background: string
  surface: string
  text: string
  textMuted?: string
  fontHeading: string
  fontBody: string
  radius?: string
  fontImportNote?: string
  fontImportHref?: string
}

export type SectionId =
  | 'hero'
  | 'deck_identity'
  | 'for_who'
  | 'outcomes'
  | 'how_to_use'
  | 'in_the_box'
  | 'card_gallery'
  | 'photo_gallery'
  | 'faq'
  | 'creator'
  | 'related_decks'
  | 'cta_band'

export interface DeckSectionMediaSlotV1 {
  slotId: string
  aspectRatio: string
  sceneDescription: string
  mood?: string
  styleVisual?: string
  colorContext?: string
  constraints?: string
  altHintFr?: string
}

export interface DeckLandingSection {
  /** Identifiant stable dans le JSON landing ; les démos utilisent des clés synthétiques uniques. */
  id: SectionId | string
  variant: string
  props: Record<string, unknown>
  media?: DeckSectionMediaSlotV1[]
}

export interface DeckModularLandingV1 {
  version: 1
  slug: string
  globals: DeckLandingGlobals
  sections: DeckLandingSection[]
  /** Prompt anglais optionnel pour générer la bannière hero (Grok Imagine). */
  imagePrompts?: {
    hero?: string
  }
}
