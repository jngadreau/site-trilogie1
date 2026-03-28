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
  | 'how_to_use'

export interface DeckLandingSection {
  id: SectionId
  variant: string
  props: Record<string, unknown>
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
