# HeroFullBleed

## Rôle et intention

Impact **cinématographique** : le visuel occupe toute la largeur et une **grande hauteur** d’écran ; le texte est **superposé** (en bas ou zone lisible), pour une entrée immersive (univers du deck, atmosphère).

## Description visuelle détaillée

- **Image de fond** : **pleine largeur** (`full bleed`), hauteur généreuse (souvent ~70 % de la hauteur viewport), **couvre** toute la zone (`object-fit: cover`).
- **Overlay** : calque semi-transparent **sombre** (ou parfois clair selon image) dont l’intensité est pilotée par **`overlayOpacity`** (typiquement 0.35–0.65) pour garantir le **contraste** du texte sur l’image.
- **Texte** : couleurs **clair sur foncé** (titres et corps adaptés) ; **tagline** au-dessus du titre, plus petite ; titre très visible ; corps puis CTA avec bouton **clair** sur fond sombre pour se détacher.
- **Hiérarchie** : le bloc texte est **contenu dans une colonne** (max ~640px) pour la lisibilité, pas étalé sur toute la largeur.
- **Accessibilité** : l’image porte un **`imageAlt`** descriptif ; l’overlay est décoratif (non lu seul).

## Données attendues

| Champ | Type | Obligatoire | Notes |
| --- | --- | --- | --- |
| `title` | string | oui | Titre |
| `tagline` | string | oui | Une ligne d’accroche |
| `bodyMarkdown` | string (Markdown) | oui | Corps sous le titre |
| `ctaLabel` | string | oui | Bouton |
| `ctaHref` | string | oui | Lien ou ancre |
| `imageUrl` | string | oui | Image de fond pleine largeur |
| `imageAlt` | string | oui | Accessibilité |
| `overlayOpacity` | number | oui | 0.35–0.65, assombrit l’image pour la lisibilité |

## Assets

- **Image** : **grande définition**, **paysage** fort (16:9 ou plus large), zone de **détails** ou de **vide** utilisable sous le texte (bas ou tiers) pour ne pas masquer le sujet principal.
- Ajuster mentalement **`overlayOpacity`** : image très sombre → valeur plus basse ; image claire → plus haute pour garder le contraste du texte blanc.

## Contraintes éditoriales et ton

- **`tagline`** : une phrase **sensorielle** ou **évocative**, pas un sous-titre produit répétitif du `title`.
- **`bodyMarkdown`** : 1–2 paragraphes max en hero (le détail viendra plus bas) ; éviter les listes longues ici.
- Cohérence avec **`globals`** : sur fond sombre global, ce hero s’intègre naturellement ; sur fond clair de page, le bloc hero forme un **ilot sombre** contrasté (acceptable si voulu).

## Consignes pour l’IA (génération)

- Choisir **`overlayOpacity`** en fonction de la **luminosité** décrite ou supposée de l’image : viser **WCAG** approximatif pour le texte blanc sur overlay+image.
- Rédiger **`imageAlt`** comme pour une **affiche** : ambiance + éléments principaux, sans keyword stuffing.
- Si le contexte deck insiste sur la **nature**, la **nuit**, le **rituel**, refléter cela dans tagline + brief visuel implicite (pour génération d’image ultérieure).
- **`ctaHref`** : même logique que HeroSplitImageRight (ancre interne ou URL boutique si fournie dans le contexte).
