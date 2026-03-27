# Référence — `gnova-cv-app` / `server`

Ce fichier résume ce qui est **utile à copier ou à s’inspirer** pour **`site-trilogie1`** (`apps/api`), à partir du dépôt local **`card-sites-examples/gnova-cv-app`** (branche à jour côté utilisateur).

---

## 1. Structure utile

| Chemin | Rôle |
|--------|------|
| `server/package.json` | Dépendances **NestJS 11**, **@nestjs/bullmq**, **bullmq**, **openai**, **`@jngadreau/fwk-server-core`** |
| `server/src/app.module.ts` | Composition des modules API |
| `server/src/worker-extraction.ts` + `worker-extraction-app.module.ts` | **Processus séparé** pour workers BullMQ (pas le même `main` que l’API) |
| `server/src/worker-pdf.ts` + `worker-pdf-app.module.ts` | Autre worker (PDF) — pattern identique : entry file dédié |
| `server/env.example` / `.env.example` | **`GROK_API_URL`**, **`GROK_API_KEY`**, Redis pour BullMQ |

---

## 2. Grok (API xAI) via le client OpenAI

Le projet utilise le package **`openai`** avec `baseURL` pointant vers l’API Grok (compatible style OpenAI).

**Texte (chat / JSON structuré + markdown)** — ex. `server/src/job-postings/job-posting-normalize.processor.ts` :

- `ConfigService` : `GROK_API_KEY`, `GROK_API_URL` (défaut `https://api.x.ai/v1`).
- Client : `new OpenAI({ apiKey, baseURL: grokBaseUrl })`.
- Appel : `client.chat.completions.create({ model, messages: [...], temperature, max_tokens })`.
- Modèle configurable : ex. `GROK_JOB_POSTING_MODEL` → défaut **`grok-4-fast-non-reasoning`**.
- Post-traitement : extraction JSON depuis la réponse (y compris si le modèle entoure le JSON de fences ```).

**Vision (images → texte / JSON)** — ex. `server/src/ai/cv-extraction/cv-extraction.processors.ts` :

- Même client OpenAI + `baseURL` xAI.
- Messages avec **images en base64** (schéma type `image_url` / `url: data:image/...`).
- Modèle type **`grok-4-fast-non-reasoning`** ou **`grok-2-vision-1212`** selon le flux (voir constantes dans `cv-extraction.constants.ts`).

Pour **générer** des images promo (site oracle), il faudra vérifier si le produit expose un endpoint « image generation » distinct ; le code actuel met surtout l’accent sur **chat** et **vision** (image **en** entrée).

---

## 3. BullMQ + NestJS

- **`getBullMQConnectionFromEnv()`** depuis **`@jngadreau/fwk-server-core`** (package npm, pas seulement le repo `jng-fwk` local).
- Enregistrement des queues : `BullModule.registerQueue({ name: '...', connection: getBullMQConnectionFromEnv() })` dans les modules.
- **Processors** : classes `@Processor(QUEUE_NAME, { lockDuration, maxStalledCount })` étendant **`WorkerHost`**, méthode `process(job: Job)`.
- **Flows** : `FlowProducer` + `connection: getBullMQConnectionFromEnv()` dans `cv-extraction-flow.service.ts` pour enchaîner **PDF → images → OCR → Grok vision** (idée réutilisable si un jour pipeline multi-étapes pour le site).

Fichiers d’exemple : `cv-extraction.module.ts`, `job-postings.module.ts`, `batch-import-queue.listener.ts` (écoute **`QueueEvents`** sur complétion / échec).

---

## 4. Ce qui est directement transposable pour `site-trilogie1`

1. **Variables d’environnement** : `GROK_API_KEY`, `GROK_API_URL`, Redis (noms exacts à aligner sur `fwk-server-core` / doc du package).
2. **Un processor BullMQ** « `generate-site-section` » calqué sur **`JobPostingNormalizeProcessor`** : prompt système + utilisateur + écriture du résultat (fichier MD sur disque ou document Mongo plus tard).
3. **Client Grok** : même pattern `OpenAI` + `chat.completions.create` pour produire du **Markdown** ou du JSON manifeste.
4. **Workers** : lancer l’API Nest et un **process** `node dist/worker-*.js` (ou script équivalent) si les jobs ne doivent pas bloquer le thread HTTP.

---

## 5. Écart avec `jng-fwk` local

Le serveur G Nova consomme **`@jngadreau/fwk-server-core`** en version publiée (`^0.5.13`). Le repo **`jng-fwk`** dans `card-sites-examples` est la source / workspace de ce package ; pour **`site-trilogie1`**, même logique : dépendance npm ou `file:` vers `jng-fwk/packages/server-core` en développement.

---

*Dernière lecture du dépôt : mars 2026 — à mettre à jour si les chemins ou modèles Grok changent.*
