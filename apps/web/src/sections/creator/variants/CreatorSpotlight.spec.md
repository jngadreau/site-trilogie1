# CreatorSpotlight

Section **créateur·rice** : portrait texte (optionnellement **photo** à gauche ou au-dessus sur mobile), nom, rôle, biographie markdown, CTA optionnel.

## Props JSON

| Champ | Type | Notes |
|-------|------|--------|
| `sectionTitle` | string | H2 (ex. « La créatrice ») |
| `name` | string | Nom affiché |
| `roleLabel` | string | Une ligne (ex. créatrice, canalisatrice) |
| `bodyMarkdown` | string | Bio / parcours |
| `imageUrl` | string | optionnel — `/ai/generated-images/…` si slot média |
| `imageAlt` | string | si `imageUrl` |
| `ctaLabel` | string | optionnel |
| `ctaHref` | string | optionnel |

## Slots médias

Si une **photo** est souhaitée : un slot `creator` en `4:3` ou `1:1` ; sinon **`media` : `[]`** et pas d’`imageUrl` dans les props.
