# HowToNumbered

## Rôle et intention

Expliquer **comment utiliser** le deck de façon **simple et ordonnée** : étapes numérotées (1, 2, 3…), ton mode d’emploi sans remplacer le livret.

## Description visuelle détaillée

- **Liste ordonnée** native (`<ol>`) : les **numéros** sont visibles et stylés (couleur **`accent`** sur le marqueur ou la puce).
- **Chaque étape** : titre de l’étape (`fontHeading` / taille intermédiaire) puis paragraphe(s) Markdown.
- **Intro optionnelle** : si `introMarkdown` est présent, placée **sous** le titre de section, avant la liste ; couleur atténuée possible.
- **Espacement** : marge claire entre les étapes pour la lecture au scroll mobile.

## Données attendues

| Champ | Type | Obligatoire | Notes |
| --- | --- | --- | --- |
| `title` | string | oui | Titre de section |
| `introMarkdown` | string (Markdown) | non | Paragraphe d’intro |
| `steps` | array | oui | ≥ 3 `{ "title", "bodyMarkdown" }` |

## Assets

- **Aucune image** requise.

## Contraintes éditoriales et ton

- **Ordre logique** : installation du moment → tirage → interprétation (ou équivalent adapté au deck).
- Titres d’étapes : **verbes** ou **noms d’action** courts (« Installer le moment », « Tirer les cartes »).
- Ne pas **copier** des pages du livret : résumer en **3–5 étapes** grand public.
- Ton rassurant, **jamais prescriptif médical** ; « tu peux », « une façon de… ».

## Consignes pour l’IA (génération)

- Croiser le contexte deck avec les **usages** mentionnés dans le livret (tirages suggérés, durée) pour proposer des étapes **plausibles**.
- Si le jeu impose une **mécanique** (mélange, coupe, etc.), l’intégrer sans sur-spécialiser (rester compréhensible pour un·e néophyte).
- **`introMarkdown`** : une phrase de **cadrage** (« en trois minutes ou trente ») si les sources le permettent.
- Nombre d’étapes : **3 à 5** idéal ; au-delà, fusionner ou renvoyer au livret dans le dernier `bodyMarkdown`.
