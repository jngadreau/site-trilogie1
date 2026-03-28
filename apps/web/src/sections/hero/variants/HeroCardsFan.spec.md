# HeroCardsFan

Hero avec **éventail de cartes réelles** du jeu : 3 à 7 visuels en rotation autour d’un pivot bas, chevauchement, ombres. Texte à gauche (ou au-dessus sur mobile).

## Props JSON (Grok)

| Champ | Type | Notes |
|-------|------|--------|
| `title` | string | H1 |
| `kicker` | string | Ligne courte au-dessus |
| `bodyMarkdown` | string | |
| `ctaLabel` | string | |
| `ctaHref` | string | |
| `cards` | array | **3 à 7** objets `{ "imageUrl", "alt", "caption?" }` |

Chaque `imageUrl` : **`/cards/arbre-de-vie/<fichier>`** (liste : `GET /cards/arbre-de-vie`). `alt` en français (nom ou thème de la carte).

## Slots médias

**`media` : `[]`** — pas de slot Imagine pour ce hero ; les visuels viennent uniquement de `cards`.
