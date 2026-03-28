# RelatedDecksGrid

**Jeux liés** (trilogie, même maison) : grille de cartes (2 colonnes), chaque carte = nom, accroche, texte court, lien.

## Props JSON

| Champ | Type | Notes |
|-------|------|--------|
| `sectionTitle` | string | H2 |
| `introMarkdown` | string | optionnel |
| `decks` | array | 2 à 4 `{ "deckName", "tagline", "bodyMarkdown", "href", "ctaLabel?" }` |

## Slots médias

**`media` : `[]`** sauf brief pour vignettes futures (rare) — par défaut vide.
