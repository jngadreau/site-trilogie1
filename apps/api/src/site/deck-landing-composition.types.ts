import type { DeckLandingGlobals } from './deck-modular-landing.types';

export interface DeckLandingCompositionGrokV1 {
  version: 1;
  globals: DeckLandingGlobals;
  imagePrompts?: {
    hero?: string;
  };
}
