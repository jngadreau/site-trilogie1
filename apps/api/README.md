# API — site-trilogie1

NestJS : **Grok** (chat → Markdown, [Imagine → image](https://docs.x.ai/developers/model-capabilities/images/generation)), **BullMQ** pour la génération Markdown **asynchrone**, lecture des fichiers pour le **preview**.

## Prérequis

- Node 20+
- Clé `GROK_API_KEY` ([xAI](https://docs.x.ai/))
- **Redis** si vous utilisez `generate-markdown-async` (ex. `docker run -p 6379:6379 redis:alpine`)

## Configuration

```bash
cp .env.example .env
```

| Variable | Rôle |
|----------|------|
| `GROK_TEXT_MODEL` | Défaut `grok-3-mini` |
| `GROK_IMAGE_MODEL` | Défaut `grok-imagine-image` |
| `CONTENT_GENERATED_DIR` | Sortie MD / sous-dossier `images/` ; défaut `../../content/generated/arbre-de-vie` depuis `apps/api` |
| `REDIS_HOST` / `REDIS_PORT` ou `REDIS_URL` | Connexion BullMQ |

## Démarrage

```bash
cd apps/api
npm install
npm run start:dev
```

## Endpoints

| Méthode | Chemin | Description |
|---------|--------|-------------|
| `GET` | `/health` | Santé |
| `GET` | `/site/manifest` | JSON `content/arbre-de-vie/site.manifest.json` (landing) |
| `GET` | `/site/landing-spec` | JSON `landing-spec.json` (landing détaillée Grok) — 404 si non généré |
| `POST` | `/site/generate-landing` | Génère `landing-spec.json` + fichiers associés depuis `prompts/landing/` + livret |
| `GET` | `/cards/arbre-de-vie` | Liste des fichiers image dans `images-jeux/arbre_de_vie/` |
| `GET` | `/cards/arbre-de-vie/:filename` | Image carte (PNG / JPEG / WebP) |
| `POST` | `/site/compose-fan` | Corps `{ "files": ["a.png", …], "outputSlug?" }` — composite PNG (Sharp) |
| `POST` | `/ai/generate-markdown` | Génère un `.md` **synchrone** |
| `POST` | `/ai/generate-markdown-async` | Enfile un job BullMQ → `{ jobId }` |
| `GET` | `/ai/jobs/:jobId` | État du job (`state`, `result`, `failedReason`) |
| `POST` | `/ai/generate-image` | Corps `{ "prompt", "outputSlug?", "aspectRatio?" }` → PNG sous `content/generated/arbre-de-vie/images/` |
| `GET` | `/ai/generated` | Liste des fichiers `*.md` |
| `GET` | `/ai/generated/:filename` | JSON `{ filename, body }` (aperçu preview) |
| `GET` | `/ai/generated-images` | Liste des PNG / WebP / JPEG dans `images/` |
| `GET` | `/ai/generated-images/:filename` | Fichier image (`Content-Type` adapté, `inline`) |

**Exemple Markdown sync** — voir historique du README ; **async** :

```bash
curl -s -X POST http://localhost:3040/ai/generate-markdown-async \
  -H 'Content-Type: application/json' \
  -d '{"instruction":"...","contextMarkdown":"..."}'
# puis
curl -s http://localhost:3040/ai/jobs/<jobId>
```

**Exemple image** :

```bash
curl -s -X POST http://localhost:3040/ai/generate-image \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Éventail de cartes oracle style nature, arbre, tons verts doux, flou partiel","outputSlug":"fan-test","aspectRatio":"16:9"}'
```

CORS est activé pour le dev (`apps/preview`).
