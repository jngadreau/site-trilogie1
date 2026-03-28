# CardGalleryGrid

Section **milieu de page** : grille de faces de cartes au **ratio marque-page** (~**672×1877** px, comme les PNG sync). Largeur d’affichage cadrée (variable CSS `--dl-deck-card-gallery-max-w`), image en **`object-fit: contain`** dans un cadre à ce ratio.

## Choisir les cartes (une seule source, par priorité)

1. **`cards`** : tableau complet `{ imageUrl, alt, captionMarkdown? }[]` si tu dois pointer vers des fichiers non standard.
2. **`cardSlots`** : `{ cardNumber, captionMarkdown?, alt? }[]` — construit `…/card_{n}_front.png` sous `deckCardsBasePath`.
3. **`cardNumbers`** : `number[]` — même fichier, sans légende.

`deckCardsBasePath` (optionnel, défaut `/ai/generated-images/deck-cards`) : dossier sans slash final.

## Autres props

- `sectionTitle` (string)
- `introMarkdown` (optionnel)

## Slots médias

`media` : `[]`.
