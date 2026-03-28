# Génération landing modulaire (4 sections × variantes React)

Utilisé par `POST /site/generate-deck-landing/:slug` avec `slug` ∈ `arbre-de-vie-a` \| `b` \| `c`.

| Fichier | Rôle |
|---------|------|
| [01-system.md](./01-system.md) | Rôle, règles, cohérence `globals`. |
| [02-user-template.md](./02-user-template.md) | `{{DECK_CONTEXT}}`, `{{LANDING_SLUG}}`, `{{VARIANT_MAP_JSON}}`, `{{SECTION_SPECS_BUNDLE}}` (8× `.spec.md`). |
| [variant-plan/](./variant-plan/) | Plan **variante C** : Grok choisit les 4 composants à partir des specs + différenciation A/B. |
| [03-hero-imagine-prompt.md](./03-hero-imagine-prompt.md) | Synthèse du prompt **anglais** pour Imagine si `imagePrompts.hero` absent du JSON. |
| [05-composition-user-template.md](./05-composition-user-template.md) | Job BullMQ **composition** : uniquement `globals` (+ `imagePrompts` optionnel). |
| [06-section-elements-user-template.md](./06-section-elements-user-template.md) | Job **section** : `props` + `media[]` par variante (cf. slots dans chaque `*.spec.md`). |

**Images** : les champs structurés dans `sections[].media[]` alimentent `DeckLandingImageAssemblyService` → prompt Imagine + `aspectRatio`. **Pipeline** : `POST /site/generate-deck-landing-pipeline/:slug` (files BullMQ `deck-landing-pipeline`, `deck-landing-image`, Redis requis). **Sync** : `POST /site/generate-deck-landing/:slug` inclut toujours `media` (ou `[]`). **Hero** : `POST /site/generate-deck-landing-hero-image/:slug` utilise le slot `media` si présent.

Carte des variantes par landing : [deck-landing-variants.json](../deck-landing-variants.json).  
Plans (rationale + choix) : [deck-landing-plans/](../deck-landing-plans/) (ex. `arbre-de-vie-c.json`).  
Composants React : `apps/web/src/sections/`.  
UI suivi : `apps/web` → `/admin`.  
Processus cible : [processus-landing-deck-multi-etapes.md](../../../docs/processus-landing-deck-multi-etapes.md).
