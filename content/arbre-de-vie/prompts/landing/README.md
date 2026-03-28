# Génération landing détaillée (reproductible)

## Flux en deux étapes (recommandé)

1. **`POST /site/generate-game-context`** — agrège les `.md` des cartes, tout le livret (dossier `booklet/`), `metadata.json`, [trilogy-context.md](../../../shared/trilogy-context.md) ; produit **`game-context.md`** (synthèse réutilisable).
2. **`POST /site/generate-landing`** — consomme `game-context.md` en priorité dans le gabarit, plus extraits livret / JSON / trilogie pour cohérence.

Les prompts sont **génériques** (pas de nom de jeu figé) : l’univers vient des sources et du manifeste `site.manifest.json` (titre / sous-titre pour le libellé jeu).

**Vision processus** (sélection de sections, layouts, génération par section, UI d’édition) : [processus-landing-deck-multi-etapes.md](../../../../docs/processus-landing-deck-multi-etapes.md).

| Dossier / fichier | Rôle |
|-------------------|------|
| [01-system.md](./01-system.md) | Message **système** pour la **landing JSON** (rôle, contraintes, sortie unique JSON). |
| [02-user-template.md](./02-user-template.md) | Gabarit **utilisateur** : `{{GAME_CONTEXT}}`, `{{BOOKLET_EXCERPT}}`, `{{GAME_META_JSON}}`, `{{TRILOGY_CONTEXT}}`. |
| [game-context/](./game-context/) | Prompts de l’**étape 1** (sortie Markdown synthèse uniquement). |

Chemins sources par défaut (surcharge via `.env` : `GAME_CARDS_CONTEXT_DIR`, `GAME_BOOKLET_DIR`) : dossier `contexts/cards/` et `booklet/` sous le dépôt source du jeu Arbre de Vie. Livret landing : extrait de `debut.md` comme complément dans `02-user-template`.

## Sortie produite

Fichiers sous `content/generated/arbre-de-vie/` :

- `game-context.md` — synthèse jeu (étape 1).
- `landing-spec.json` — spec structurée (sections, thème, CSS de base, HTML coquille) (étape 2).
- `landing-shell.html`, `landing-base.css` — copie des propositions modèle (étape 2).

Le preview **Landing détaillée** consomme `landing-spec.json` via `GET /site/landing-spec`.

Après génération de la spec, **`POST /site/generate-landing-assets`** produit une bannière (`images/landing-hero-from-spec.png`) à partir de `imagePrompts.heroBanner` et un éventail (`landing-fan-from-cards.png`) avec les cartes du dossier jeu.

## Images cartes

Les fichiers PNG/JPG doivent être présents dans `images-jeux/arbre_de_vie/` (à la racine du workspace `card-sites-examples`). Ils sont servis par l’API sous `/cards/arbre-de-vie/:filename`.

## Éventail (Sharp)

`POST /site/compose-fan` — voir README API dans `apps/api/README.md`.
