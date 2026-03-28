# Génération landing modulaire (4 sections × variantes React)

Utilisé par `POST /site/generate-deck-landing/:slug` avec `slug` ∈ `arbre-de-vie-a` | `arbre-de-vie-b`.

| Fichier | Rôle |
|---------|------|
| [01-system.md](./01-system.md) | Rôle, règles, cohérence `globals`. |
| [02-user-template.md](./02-user-template.md) | `{{DECK_CONTEXT}}`, `{{LANDING_SLUG}}`, `{{VARIANT_MAP_JSON}}`. |

Carte des variantes par landing : [deck-landing-variants.json](../deck-landing-variants.json).  
Composants React : `apps/web/src/sections/`.  
Processus cible : [processus-landing-deck-multi-etapes.md](../../../docs/processus-landing-deck-multi-etapes.md).
