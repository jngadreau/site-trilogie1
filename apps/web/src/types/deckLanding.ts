/** @see site-trilogie1/docs/landing-image-management-plan.md */
export type DeckLandingImagePurpose =
  | 'hero_banner'
  | 'page_background'
  | 'section_background'
  | 'deck_card_front'
  | 'deck_card_back'
  | 'booklet_cover_front'
  | 'booklet_cover_back'
  | 'box'
  | 'lifestyle'
  | 'decoration'
  | 'other'

export type DeckImageGenerationModelPreference = 'grok_imagine' | 'midjourney' | 'none'

export interface DeckLandingDeckAssetRef {
  kind: 'deck_card' | 'booklet' | 'box'
  side?: 'front' | 'back' | 'spine'
  selector: { type: 'filename' | 'ordinal' | 'slug'; value: string | number }
}

export interface DeckLandingResolvedImageRef {
  imageUrl: string
  imageAlt?: string
  s3Key?: string
  source?: 'upload' | 'grok_imagine' | 'midjourney' | 'deck_mirror' | 'external'
}

export interface DeckLandingImageSlotGeneration {
  autoGenerate?: boolean
  primaryModel?: DeckImageGenerationModelPreference
  assembledPromptEn?: string
  promptAlternativesEn?: string[]
  originalIndicationFingerprint?: string
  lastGeneratedAt?: string
}

export interface DeckLandingImageSlotDefinition {
  slotId: string
  purpose: DeckLandingImagePurpose
  aspectRatio: string
  sizeHint?: string
  sceneDescription: string
  mood?: string
  styleVisual?: string
  colorContext?: string
  constraints?: string
  altHintFr?: string
  deckAssetRef?: DeckLandingDeckAssetRef
  generation?: DeckLandingImageSlotGeneration
  resolved?: DeckLandingResolvedImageRef
}

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
  visualBrief?: string
  visualBriefMarkdown?: string
  backgroundImage?: DeckLandingResolvedImageRef
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
  | 'testimonials'
  | 'newsletter_cta'
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
  /** Contrôles de layout optionnels (ex: section en pleine largeur). */
  layout?: {
    fullWidth?: boolean
  }
  media?: DeckSectionMediaSlotV1[]
  backgroundImage?: DeckLandingResolvedImageRef
  imageSlots?: DeckLandingImageSlotDefinition[]
}

export interface LandingImageHistoryEntryV1 {
  id: string
  imageUrl: string
  prompt: string
  model?: string
  createdAt: string
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
  imageHistory?: Record<string, LandingImageHistoryEntryV1[]>
}
