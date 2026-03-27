# Preview — contenu Markdown généré

Petit front **Vite** (vanilla + **marked**) pour lire les `.md` produits par l’API.

## Prérequis

1. API démarrée : `cd apps/api && npm run start:dev` (port **3040**).
2. Le proxy Vite redirige `/ai/*` vers cette API.

## Lancer

```bash
cd apps/preview
npm install
npm run dev
```

Ouvre l’URL affichée (souvent **http://localhost:5175**). La liste reprend les fichiers renvoyés par `GET /ai/generated`.

## Build statique (optionnel)

```bash
npm run build
npm run preview
```

Pour la prod, il faudra soit servir l’API et le `dist/` derrière le même domaine, soit ajuster le proxy / CORS.
