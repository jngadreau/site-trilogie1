export interface DeckLandingVariantPlanV1 {
  version: 1;
  slug: string;
  variants: {
    hero: string;
    deck_identity: string;
    for_who: string;
    how_to_use: string;
  };
  /** Justification éditoriale et visuelle (Markdown). */
  rationaleMarkdown: string;
}
