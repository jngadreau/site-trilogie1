# HeroSplitImageRight

## Rôle et intention

Premier écran de la landing : poser **immédiatement** le nom / l’esprit du deck, donner envie de descendre dans la page. Le texte et l’image se **partagent l’attention** (pas d’image décorative seule) : l’image illustre ou prolonge la promesse du copy.

## Description visuelle détaillée

- **Mise en page** : zone en **deux colonnes** sur grand écran — à gauche (ou en premier en mobile) le **bloc texte**, à droite le **visuel** dans un cadre aux coins arrondis (`globals.radius`), avec une **ombre portée** légère pour détacher la carte visuelle du fond de page.
- **Hiérarchie typographique** : d’abord un **sous-titre** discret (petites capitales ou tracking léger, couleur atténuée `textMuted`), puis le **titre** très lisible (grande taille, police `fontHeading`), puis le **corps** en `fontBody` avec paragraphes aérés.
- **CTA** : bouton plein, couleur d’**accent** (`globals.accent`), placé sous le corps de texte ; doit contraster avec le fond `background` de la page.
- **Image** : ratio visé **paysage** (environ 4:3 côté rendu), **rognage centré** (`object-fit: cover`) : prévoir une image dont le sujet important reste lisible au centre.
- **Ambiance** : sobre et **éditorial** ; pas de surcharge graphique dans les données (le style vient surtout des `globals`).

## Données attendues

| Champ | Type | Obligatoire | Notes |
| --- | --- | --- | --- |
| `title` | string | oui | Titre principal |
| `subtitle` | string | oui | Sous-titre court |
| `bodyMarkdown` | string (Markdown) | oui | 1–3 paragraphes |
| `ctaLabel` | string | oui | Texte du bouton |
| `ctaHref` | string | oui | Lien ou ancre (`#…`) |
| `imageUrl` | string | oui | URL absolue ou chemin API (`/ai/generated-images/…`) |
| `imageAlt` | string | oui | Texte alternatif |

## Assets

- **Image hero** : une image forte (bannière, scène symbolique, détail de cartes, nature, etc.), **haute résolution**, **paysage** ; éviter les bords critiques collés au cadre (marge de sécurité pour le crop).
- **Optionnel (hors JSON)** : brief de génération d’image aligné sur `globals` (palette, luminosité) pour cohérence avec le reste de la page.

## Contraintes éditoriales et ton

- Français, **chaleureux**, poétique possible sans mièvrerie ; **aucune** promesse médicale ou thérapeutique normative.
- `title` : court et mémorable ; `subtitle` : une ligne qui précise le **genre** (oracle, jeu d’accompagnement…).
- `bodyMarkdown` : expliquer **en quoi** le deck aide (rituel, question, ressource), pas une liste de fonctionnalités produit.

## Consignes pour l’IA (génération)

- Lire **`globals`** (couleurs, polices) et **aligner le ton** du texte sur l’identité du deck dans le contexte fourni.
- **`imageAlt`** : décrire le **contenu** et l’ambiance (pour accessibilité et cohérence SEO), pas la technique.
- Choisir une **`imageUrl`** cohérente avec le texte ; si fichier fictif, utiliser les chemins API documentés et un **brief** de substitution dans une note de travail si le pipeline image existe.
- **`ctaHref`** : privilégier une ancre vers `#identite` ou la section suivante si la landing est une seule page.
