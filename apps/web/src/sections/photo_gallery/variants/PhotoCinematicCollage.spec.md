# PhotoCinematicCollage

Mise en scène **cinématographique** : un visuel principal large, un bloc éditorial (headline + texte + CTA) et des vignettes de soutien.

## Props

- `sectionTitle`, `introMarkdown?`
- `headline?`, `bodyMarkdown?`, `ctaLabel?`, `ctaHref?`
- `photos` : **2 à 6** objets `{ imageUrl, alt?, imageAlt?, title?, captionMarkdown? }`
  - le premier élément sert d’image principale,
  - les suivants alimentent la grille secondaire.

## Slots médias

`media` : `[]` ou slots si génération Imagine ultérieure.
