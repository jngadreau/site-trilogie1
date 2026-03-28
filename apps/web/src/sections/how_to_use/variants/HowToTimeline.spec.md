# HowToTimeline

## Rôle et intention

Même objectif que **HowToNumbered** mais avec une métaphore **temporelle** ou de **parcours** : phases, jalons, « avant / pendant / après » — rendu visuel **ligne du temps** verticale avec points d’ancrage.

## Description visuelle détaillée

- **Ligne verticale** à gauche du contenu, couleur dérivée de **`accent`** (semi-transparente) ; **points** (cercles pleins) marquent chaque étape sur la ligne.
- **Label** : court texte mis en avant (souvent **gras** ou `fontHeading`), peut inclure un préfixe type « 0 — », « 1 — » dans la chaîne elle-même.
- **Détail** : `detailMarkdown` sous le label, typiquement 1–2 paragraphes ou liste courte.
- **Intro** : `introMarkdown` sous le titre de section, avant la timeline.
- **Fond** : page standard ; la timeline **ne** nécessite pas de bandeau contrasté.

## Données attendues

| Champ | Type | Obligatoire | Notes |
| --- | --- | --- | --- |
| `title` | string | oui | Titre de section |
| `introMarkdown` | string (Markdown) | oui | Contexte |
| `steps` | array | oui | ≥ 3 `{ "label", "detailMarkdown" }` — `label` court (ex. « 1 — … ») |

## Assets

- **Aucune image** requise.

## Contraintes éditoriales et ton

- Les **`label`** doivent être **distincts** les uns des autres (pas trois fois « Étape 1 ») ; inclure un **indice temporel** ou de phase si pertinent (Silence, Choix, Lecture…).
- `detailMarkdown` : instructions **concrètes** ; éviter le ton encyclopédique.
- Cohérence narrative : la timeline doit se lire comme un **flux** (du général au particulier, ou du préparation à l’action).

## Consignes pour l’IA (génération)

- Ne pas dupliquer la même structure que **HowToNumbered** sur la même landing : si les deux variantes coexistent (cas rare), différencier **nettement** (timeline = arc narratif, numbered = checklist).
- Utiliser **`label`** pour porter le **fil conducteur** (numéro + mot-clé) et **`detailMarkdown`** pour la **chair**.
- S’inspirer des **rituels** ou **protocoles** décrits dans le contexte deck sans les figer légalement (formulations souples).
- Longueur : **3 à 5 steps** ; aligner le vocabulaire sur le **registre** du deck (poétique vs pragmatique).
