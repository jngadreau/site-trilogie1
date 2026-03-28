# HeroParallaxLayers

Hero **cinématographique** : la même image est composée en **trois plans** (échelle et opacité différentes) pour un effet de profondeur ; bandeau sombre + typographie large. Option **`spineLabel`** : texte vertical décoratif sur le bord.

## Props JSON (Grok)

| Champ | Type | Notes |
|-------|------|--------|
| `eyebrow` | string | Petite majuscule / label. |
| `title` | string | H1 percutant. |
| `strapline` | string | Une phrase d’accroche sous le titre. |
| `bodyMarkdown` | string | Court. |
| `ctaLabel` | string | |
| `ctaHref` | string | |
| `imageUrl` | string | |
| `imageAlt` | string | FR. |
| `spineLabel` | string optionnel | Ex. nom du deck, vertical. |

## Slots médias

| `slotId` | `aspectRatio` |
|----------|-----------------|
| `hero` | `20:9` ou `16:9` — image riche en profondeur (forêt, arbres, perspective). |
