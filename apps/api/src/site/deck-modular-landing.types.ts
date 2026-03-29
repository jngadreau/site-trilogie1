import type { DeckLandingSectionId } from './deck-landing-section-order';

/** JSON servi à `apps/web` pour composer la landing deck modulaire. */

export interface DeckLandingGlobals {
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted?: string;
  fontHeading: string;
  fontBody: string;
  radius?: string;
  fontImportNote?: string;
  /** Lien `<link href>` Google Fonts (ou autre) pour charger les familles citées. */
  fontImportHref?: string;
  /**
   * Brief visuel global (ton, ambiance, cohérence) — réutilisé pour l’assemblage des prompts image.
   * @see docs/landing-image-management-plan.md
   */
  visualBrief?: string;
  visualBriefMarkdown?: string;
  /** Fond plein page (référence résolue ou à résoudre). */
  backgroundImage?: DeckLandingResolvedImageRef;
}

/**
 * Rôle sémantique d’un visuel (plan image management).
 * @see docs/landing-image-management-plan.md
 */
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
  | 'other';

export type DeckImageGenerationModelPreference = 'grok_imagine' | 'midjourney' | 'none';

export interface DeckLandingDeckAssetRef {
  kind: 'deck_card' | 'booklet' | 'box';
  side?: 'front' | 'back' | 'spine';
  selector: { type: 'filename' | 'ordinal' | 'slug'; value: string | number };
}

export interface DeckLandingResolvedImageRef {
  imageUrl: string;
  imageAlt?: string;
  s3Key?: string;
  source?: 'upload' | 'grok_imagine' | 'midjourney' | 'deck_mirror' | 'external';
}

export interface DeckLandingImageSlotGeneration {
  autoGenerate?: boolean;
  primaryModel?: DeckImageGenerationModelPreference;
  assembledPromptEn?: string;
  promptAlternativesEn?: string[];
  originalIndicationFingerprint?: string;
  lastGeneratedAt?: string;
}

/**
 * Définition enrichie d’un slot image (évolution de `media[]`).
 * Optionnel tant que la migration n’est pas faite.
 */
export interface DeckLandingImageSlotDefinition {
  slotId: string;
  purpose: DeckLandingImagePurpose;
  aspectRatio: string;
  sizeHint?: string;
  sceneDescription: string;
  mood?: string;
  styleVisual?: string;
  colorContext?: string;
  constraints?: string;
  altHintFr?: string;
  deckAssetRef?: DeckLandingDeckAssetRef;
  generation?: DeckLandingImageSlotGeneration;
  resolved?: DeckLandingResolvedImageRef;
}

/**
 * Métadonnées pour **un** appel Imagine (point d’entrée commun).
 * Remplies par Grok lors de « section generate elements », consommées par `deck-landing-generate-image`.
 */
export interface DeckSectionMediaSlotV1 {
  slotId: string;
  /** Ex. 16:9, 4:3, 1:1 — transmis à l’API image. */
  aspectRatio: string;
  /** Description de scène / sujet (contenu principal du futur prompt). */
  sceneDescription: string;
  /** Ambiance émotionnelle ou sensorielle. */
  mood?: string;
  /** Style pictural (illustration éditoriale, grain, référence d’art, etc.). */
  styleVisual?: string;
  /** Comment la palette globale (accent / fond) se reflète dans l’image. */
  colorContext?: string;
  /** Contraintes fortes (ex. pas de texte lisible, pas de visages identifiables). */
  constraints?: string;
  /** Texte FR pour aligner `imageAlt` / accessibilité. */
  altHintFr?: string;
}

export interface DeckLandingSection {
  id: DeckLandingSectionId;
  variant: string;
  props: Record<string, unknown>;
  /** Slots image décrits par l’IA ; tableau vide si aucun visuel. */
  media?: DeckSectionMediaSlotV1[];
  /** Fond de section (plan image management). */
  backgroundImage?: DeckLandingResolvedImageRef;
  /** Slots enrichis (purpose, métadonnées génération) — complète `media[]` à terme. */
  imageSlots?: DeckLandingImageSlotDefinition[];
}

/** Entrée d’historique pour une position image `sectionId:slotId` (ex. `hero:hero`). */
export interface LandingImageHistoryEntryV1 {
  id: string;
  imageUrl: string;
  prompt: string;
  model?: string;
  createdAt: string;
}

export interface DeckModularLandingV1 {
  version: 1;
  slug: string;
  globals: DeckLandingGlobals;
  sections: DeckLandingSection[];
  /**
   * Prompt anglais pour Grok Imagine (hero). Si absent, l’API peut le synthétiser
   * (chat) à partir du hero + globals avant `POST …/generate-deck-landing-hero-image/:slug`.
   */
  imagePrompts?: {
    hero?: string;
  };
  /** Versions PNG générées par position, pour comparer / réactiver une variante. */
  imageHistory?: Record<string, LandingImageHistoryEntryV1[]>;
}
