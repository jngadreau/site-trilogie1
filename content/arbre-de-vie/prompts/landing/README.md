# Génération landing détaillée (reproductible)

Ce dossier contient les **prompts figés** utilisés par `POST /site/generate-landing` dans l’API. Toute évolution de copy ou de structure JSON attendue doit passer par ces fichiers (et un commit).

| Fichier | Rôle |
|---------|------|
| [01-system.md](./01-system.md) | Message **système** Grok (rôle, contraintes, format de sortie). |
| [02-user-template.md](./02-user-template.md) | Gabarit **utilisateur** : placeholders `{{BOOKLET_EXCERPT}}`, `{{GAME_META_JSON}}`, `{{TRILOGY_CONTEXT}}`, etc. |

L’API injecte le contenu du livret (`oseunpasverstoi-jeux1/Arbre de vie/booklet/debut.md` par défaut), les métadonnées `images-jeux/arbre_de_vie/metadata.json`, et le fichier [trilogy-context.md](../../../shared/trilogy-context.md).

## Sortie produite

Fichiers écrits sous `content/generated/arbre-de-vie/` :

- `landing-spec.json` — spec structurée (sections, thème, CSS de base, HTML coquille).
- `landing-shell.html` — copie du gabarit HTML proposé par le modèle (audit / reprise manuelle).
- `landing-base.css` — feuille de base associée.

Le preview **Landing détaillée** consomme `landing-spec.json` via `GET /site/landing-spec`.

## Images cartes

Les fichiers PNG/JPG doivent être présents dans `images-jeux/arbre_de_vie/` (à la racine du workspace `card-sites-examples`). Ils sont servis par l’API sous `/cards/arbre-de-vie/:filename`.

## Éventail (Sharp)

`POST /site/compose-fan` — voir README API dans `apps/api/README.md`.
