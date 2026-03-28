# Prompts — contexte deck (`game-context.md`)

Étape 1 du pipeline landing : synthèse **longue** du produit (cartes + livret + meta) pour éviter de repasser toutes les sources aux appels suivants.

| Fichier | Rôle |
|---------|------|
| [01-system.md](./01-system.md) | Rôle, volume cible (~3–5× une fiche courte), structure attendue. |
| [02-user-template.md](./02-user-template.md) | Sources injectées par l’API (`{{CARDS_MD_BUNDLE}}`, etc.). |

Processus cible (sections, layouts, UI) : [processus-landing-deck-multi-etapes.md](../../../../docs/processus-landing-deck-multi-etapes.md).
