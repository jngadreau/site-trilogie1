import type { DeckLandingSectionId } from './deck-landing-section-order';

export interface DeckLandingVariantPlanV1 {
  version: 1;
  slug: string;
  variants: Record<DeckLandingSectionId, string>;
  /** Justification éditoriale et visuelle (Markdown). */
  rationaleMarkdown: string;
}
