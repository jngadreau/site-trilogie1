/** Item affiché après résolution (URLs + accessibilité). */
export type CardGalleryItem = {
  imageUrl: string
  alt: string
  captionMarkdown?: string
}

/** Une carte choisie par numéro + légende / alt optionnels. */
export type CardGallerySlot = {
  cardNumber: number
  captionMarkdown?: string
  alt?: string
}

export type CardGalleryItemsSource = {
  /**
   * Liste explicite (URLs complètes) — prioritaire si non vide.
   * Utile pour fichiers non standard ou previews.
   */
  cards?: CardGalleryItem[]
  /**
   * Numéros de cartes du deck (souvent 1–64) → `card_{n}_front.png` sous `deckCardsBasePath`.
   */
  cardNumbers?: number[]
  /**
   * Même chose que `cardNumbers` mais avec légende ou alt par carte.
   */
  cardSlots?: CardGallerySlot[]
  /** Dossier des PNG cartes, sans slash final. Défaut : `/ai/generated-images/deck-cards`. */
  deckCardsBasePath?: string
}

export function resolveCardGalleryItems(input: CardGalleryItemsSource): CardGalleryItem[] {
  const base = (input.deckCardsBasePath ?? '/ai/generated-images/deck-cards').replace(/\/$/, '')

  if (input.cards?.length) {
    return input.cards
  }
  if (input.cardSlots?.length) {
    return input.cardSlots.map((s) => ({
      imageUrl: `${base}/card_${s.cardNumber}_front.png`,
      alt: s.alt ?? `Carte oracle ${s.cardNumber}`,
      captionMarkdown: s.captionMarkdown,
    }))
  }
  if (input.cardNumbers?.length) {
    return input.cardNumbers.map((n) => ({
      imageUrl: `${base}/card_${n}_front.png`,
      alt: `Carte oracle ${n}`,
    }))
  }
  return []
}
