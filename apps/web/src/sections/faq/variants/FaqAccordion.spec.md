# FaqAccordion

**FAQ** repliable : chaque entrée est un `<details>` / `<summary>` (accessible, sans JS).

## Props JSON

| Champ | Type | Notes |
|-------|------|--------|
| `sectionTitle` | string | H2 |
| `introMarkdown` | string | optionnel |
| `items` | array | ≥ 3 `{ "question", "answerMarkdown" }` |

## Slots médias

**`media` : `[]`**
