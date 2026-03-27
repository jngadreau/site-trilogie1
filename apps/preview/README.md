# Preview — contenu généré (Markdown + images)

Front **Vite** + **marked** pour les textes, affichage direct des **images** Grok Imagine via l’API.

## Prérequis

1. API : `cd apps/api && npm run start:dev` (port **3040**).
2. Redis seulement si tu utilises les jobs async Markdown.

## Lancer

```bash
cd apps/preview
npm install
npm run dev
```

Ouvre **http://localhost:5175** (le proxy envoie `/ai` vers l’API).

## Interface

- Onglets **Textes** / **Images**.
- Navigation par fichiers (pills) ; lien direct possible :
  - `#md:hero-test.md`
  - `#img:banner-1.png`
- Les images sont servies par `GET /ai/generated-images/:filename` (même origine grâce au proxy).

## Build statique

```bash
npm run build
npm run preview
```

Pour un déploiement, il faudra la même origine pour l’API et le `dist/` ou ajuster le proxy / l’URL de l’API.
