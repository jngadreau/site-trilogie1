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
}
