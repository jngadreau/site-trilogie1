# OutcomesBentoGrid

Section **`outcomes`** : grille **bento** de promesses / bénéfices (tuiles de tailles variables).

## Props JSON

| Champ | Type | Notes |
|-------|------|--------|
| `sectionTitle` | string | H2. |
| `introMarkdown` | string | 1 paragraphe. |
| `cells` | array | **≥ 4** objets `{ "title", "bodyMarkdown", "span"? }`. |
| `span` | string optionnel | `"wide"` \| `"tall"` \| `"featured"` — au moins une tuile `featured`. |

## Slots médias

Généralement `[]`. Optionnel : une image par cellule si le pipeline évolue — pour l’instant **tableau vide**.
