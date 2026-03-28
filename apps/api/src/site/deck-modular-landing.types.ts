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

export interface DeckLandingSection {
  id: 'hero' | 'deck_identity' | 'for_who' | 'how_to_use';
  variant: string;
  props: Record<string, unknown>;
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
