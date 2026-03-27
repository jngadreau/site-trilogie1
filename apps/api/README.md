# API — site-trilogie1

Petit service NestJS pour générer du **Markdown** via **Grok** (SDK OpenAI + `https://api.x.ai/v1`), en vue du prototype **L’Arbre de Vie**.

## Prérequis

- Node 20+
- Clé `GROK_API_KEY` ([xAI](https://docs.x.ai/))

## Configuration

```bash
cp .env.example .env
# Éditer .env — au minimum GROK_API_KEY
```

- **`CONTENT_GENERATED_DIR`** (optionnel) : chemin absolu ou relatif au répertoire courant du process ; par défaut, depuis `apps/api` : `../../content/generated/arbre-de-vie`.
- **`GROK_TEXT_MODEL`** : défaut `grok-3-mini` ; vous pouvez utiliser un autre modèle chat compatible xAI (ex. `grok-4-fast-non-reasoning`).

## Démarrage

```bash
cd apps/api
npm install
npm run start:dev
```

- Santé : `GET http://localhost:3040/health`
- Génération : `POST http://localhost:3040/ai/generate-markdown`  
  Corps JSON :

```json
{
  "instruction": "Rédige un bloc hero (titre + deux paragraphes courts) pour la page d’accueil du jeu L’Arbre de Vie.",
  "contextMarkdown": "# Extrait du livret\n\n...",
  "outputSlug": "hero-v1"
}
```

Réponse : `{ "path": "/.../hero-v1.md", "model": "...", "preview": "..." }`.

## Suite prévue

- File **BullMQ** + worker pour les jobs longs.
- Endpoint **images** (`grok-imagine-image`) aligné sur [la doc xAI](https://docs.x.ai/developers/model-capabilities/images/generation).
