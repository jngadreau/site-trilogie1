# IncludedChecklist

Section **contenu du jeu** : liste à puces avec **cases cochées** (style checklist), idéale pour énumérer cartes, livret, étui, dimensions.

## Props JSON

| Champ | Type | Notes |
|-------|------|--------|
| `sectionTitle` | string | H2 |
| `introMarkdown` | string | optionnel |
| `items` | array | ≥ 3 `{ "title", "detailMarkdown?" }` |

## Slots médias

**`media` : `[]`** — pas d’image dédiée ; texte uniquement.
