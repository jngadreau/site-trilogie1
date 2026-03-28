# IdentityPanel

## Rôle et intention

Après le hero, **ancrer l’identité du jeu** : nom officiel, promesse courte, texte un peu plus riche qui dit **ce que c’est** (oracle, outil, expérience) sans refaire tout le livret.

## Description visuelle détaillée

- **Carte / panneau** : bloc contenu dans une **surface** distincte (`globals.surface`), bordure très légère ou ombre douce, **coins arrondis** (`globals.radius`), padding généreux — effet « fiche produit » ou « encadré éditorial ».
- **Badge** (optionnel) : petite **pastille** en haut (catégorie : oracle, tarot, jeu d’accompagnement…), couleur liée à **`accent`** en version atténuée.
- **Typo** : `deckName` en **`fontHeading`**, taille marquante ; `tagline` en dessous, couleur **`textMuted`** ; corps en **`fontBody`** avec paragraphes standards.
- **Pas d’image obligatoire** : le contraste vient du **fond page** vs **surface** ; la section doit rester lisible sur mobile (une colonne).

## Données attendues

| Champ | Type | Obligatoire | Notes |
| --- | --- | --- | --- |
| `deckName` | string | oui | Nom du jeu |
| `tagline` | string | oui | Court slogan |
| `bodyMarkdown` | string (Markdown) | oui | Présentation du deck |
| `badge` | string | non | Pastille (ex. type de jeu) |

## Assets

- **Aucune image requise** dans le JSON ; le rendu repose sur le **design system** (`globals`).
- **Optionnel** : si une future variante ajoute une vignette, prévoir un champ `imageUrl` dans une évolution de schéma — pour l’instant, ne pas en générer sauf demande explicite du pipeline.

## Contraintes éditoriales et ton

- `bodyMarkdown` : 2–4 paragraphes ou équivalent ; peut inclure **gras** pour 2–3 notions clés ; pas de jargon ésotérique opaque — **invitant**.
- `tagline` : éviter la répétition mot à mot du hero ; ici on peut être plus **factuel** (nombre de cartes, esprit) si ce n’est pas déjà dit au-dessus.
- `badge` : 2–4 mots max.

## Consignes pour l’IA (génération)

- S’appuyer sur le **contexte deck** (positionnement, public, usage) pour remplir `bodyMarkdown` sans inventer de **matériel** non présent dans les sources (cartes, livret, langues).
- Harmoniser **`deckName`** avec le manifeste / les sources officielles du jeu.
- Si `globals` sont **clairs** (fond crème), garder un ton **lumineux** ; si **sombres**, tonalité plus **intime** — sans changer les faits.
