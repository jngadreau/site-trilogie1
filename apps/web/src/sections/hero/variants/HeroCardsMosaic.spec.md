# HeroCardsMosaic

Hero **mosaïque** : une carte **mise en avant** (grande) + les autres en **grille compacte** à côté ; texte sur la droite (en dessous sur mobile).

## Props JSON

| Champ | Type | Notes |
|-------|------|--------|
| `title` | string | H1 |
| `tagline` | string | Une ligne sous le titre visuel |
| `bodyMarkdown` | string | |
| `ctaLabel` | string | |
| `ctaHref` | string | |
| `cards` | array | **4 à 6** objets — `imageUrl` = **`/ai/generated-images/deck-cards/…`** ; le **premier** = carte vedette |

## Slots médias

**`media` : `[]`**
