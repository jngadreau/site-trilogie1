# FaqTwoColumn

**FAQ** en **deux colonnes** (questions toujours visibles + réponse markdown), pour regrouper par thème (ex. « Avant d’acheter » / « Tirages »).

## Props JSON

| Champ | Type | Notes |
|-------|------|--------|
| `sectionTitle` | string | H2 |
| `introMarkdown` | string | optionnel |
| `leftColumnTitle` | string | optionnel |
| `rightColumnTitle` | string | optionnel |
| `leftItems` | array | ≥ 2 `{ "question", "answerMarkdown" }` |
| `rightItems` | array | ≥ 2 mêmes objets |

## Slots médias

**`media` : `[]`**
