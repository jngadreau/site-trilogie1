# Processus — prototype « L’Arbre de Vie » (court terme)

Ce document **affine** la vision globale ([projet-sites-jeux-cartes.md](./projet-sites-jeux-cartes.md)) pour la **première itération** : un seul jeu pilote (**L’Arbre de Vie**), avec **serveur IA tôt** et un **rendu du site sans imposer React** — le but est d’**itérer sur le contenu** et sur le **processus de création** (génération, validation, assemblage) avant de généraliser à la trilogie et au front définitif.

---

## 1. Objectifs du prototype

| Objectif | Critère de réussite (prototype) |
|----------|----------------------------------|
| Contenu | Textes marketing / sections site générés ou assistés par IA, **relus et ajustables**, stockés en fichiers (ex. Markdown ou JSON + MD). |
| Images | Au moins un flux **Grok (image)** ou équivalent pour **médias promo** (bannière, composition type éventail), avec fichiers sortants versionnables ou enregistrés côté serveur. |
| Processus | Jobs **asynchrones** (file d’attente) pour ne pas bloquer l’UI ou le CLI ; possibilité de **relancer** une génération avec un autre prompt. |
| Rendu | Un **site lisible** (HTML statique ou serveur de prévisualisation minimal) qui **illustre** le rendu final — **pas** l’exigence React dans cette phase. |
| Périmètre | **Uniquement L’Arbre de Vie** ; les deux autres jeux et le hub trilogie viennent après validation du flux. |

---

## 2. Référentiels de code utiles (workspace local)

Ces projets vivent dans **`card-sites-examples`** (à côté du clone de **`site-trilogie1`**). Ils sert de **référence** pour copier/adapter des patterns, pas forcément de dépendance Git immédiate.

| Projet | Emplacement (typique) | Intérêt pour site-trilogie1 |
|--------|----------------------|------------------------------|
| **gnova-cv-app** | `../gnova-cv-app/` — backend décrit dans le README du repo : `server/` (**NestJS**, **MongoDB**, **Grok**, jobs) | Exemple d’intégration **Grok** + **BullMQ** + structure **NestJS** pour tâches IA. *Note : un clone partiel peut ne pas contenir `server/` ; se référer au dépôt complet si besoin.* |
| **jng-fwk** | `../jng-fwk/` — package **`packages/server-core`** | **Config**, **Mongoose**, **BullMQ** (`getBullMQConnectionOptions`), **auth** Keycloak/JWT — à réutiliser **plus tard** quand l’auth créateur et le multi-projet seront nécessaires ; pour le **tout premier prototype**, un serveur NestJS **minimal** sans tout le framework peut aller plus vite. |

**Stratégie recommandée**

- **Phase A (très court terme)** : petit **`apps/api`** NestJS avec Grok + Redis/BullMQ, peu ou pas de `jng-fwk`, pour valider génération MD + image et stockage fichier/FS ou S3 plus tard.
- **Phase B** : migration ou ajout de **`@jng/fwk-server-core`** (ou équivalent publié) pour aligner auth, utilisateurs et files d’attente avec vos autres applis.

---

## 3. Architecture cible du prototype (mono-repo)

```text
site-trilogie1/
├── apps/
│   ├── api/                 # NestJS — génération IA (texte MD, image), jobs BullMQ
│   └── preview/             # Rendu léger : ex. templates HTML + assets, ou mini serveur statique
├── content/
│   ├── sources/             # (optionnel) copie ou lien doc vers inputs « Arbre de Vie »
│   ├── generated/           # sorties IA : md, yaml, chemins images — revues avant « figement »
│   └── arbre-de-vie/        # contenu public figé pour le premier site (structure à définir)
├── packages/                # (plus tard) schémas manifeste, clients API partagés
└── docs/
```

- **`apps/preview`** peut être : HTML/CSS/JS statique généré par un script qui injecte le contenu de `content/generated`, ou un générateur type **Vite en mode vanilla**, ou **eleventy** — l’important est la **boucle courte** « contenu → page visible ».
- **React** reste **planifié** pour la vitrine définitive ; il remplacera ou absorbera `preview` quand le manifeste et le process IA seront stables.

---

## 4. Flux de travail (contenu + IA)

### 4.1 Entrées

- Textes : **`oseunpasverstoi-jeux1/Arbre de vie/`** (livret, `contexts/cards/*.md`, JSON si présents).
- Visuels : **`images-jeux/`** (dossier `arbre_de_vie/` ou exports zip) — pour **composite** ou référence dans prompts image, pas pour tout publier en ligne.

### 4.2 Types de jobs IA (premiers à implémenter)

| Type | Sortie | Notes |
|------|--------|------|
| `copy.section` | Fichier **.md** (hero, « À propos », extrait tirage, etc.) | Prompt = extrait livret + consignes éditoriales (ton, longueur, pas de spoil total). |
| `copy.card_teaser` | MD ou JSON | 1–2 phrases par carte **échantillon** seulement si besoin. |
| `image.promo` | PNG/WebP (stockage disque ou S3) | Brief = palette Arbre de Vie + contrainte « éventail partiel » ; API Grok image en priorité. |
| (optionnel) `image.prompt_midjourney` | Fichier **.txt** | Export prompt pour outil externe. |

### 4.3 Orchestration

1. **POST** (ou CLI) « lancer génération » pour un type + paramètres → enregistrement d’un **job** BullMQ.
2. **Worker** appelle **Grok** (texte ou image), écrit dans `content/generated/...` + métadonnées (prompt, modèle, date).
3. Humain **relit** ; édition manuelle ou **nouvelle génération** avec prompt affiné (historique des versions : même idée que dans la doc principale, implémentation simple d’abord : fichiers datés ou champ `revision`).

### 4.4 Figement vers « site »

- Dossier **`content/arbre-de-vie/public`** (nom indicatif) : copies ou symlinks des MD/images **validés**.
- Script **`apps/preview`** ou tâche npm **build:preview** : assemble HTML dans `apps/preview/dist` ou équivalent.
- **Pas besoin** de boutique intégrée : une liste de **liens CTA** en dur ou dans un petit `config.json`.

---

## 5. Jalons (ordre suggéré)

| # | Jalon | Livrable |
|---|--------|----------|
| J1 | Cartographie | Liste des **sections** du site pilote + champs requis dans `content/` (ce document + mise à jour [projet-sites-jeux-cartes.md](./projet-sites-jeux-cartes.md) si besoin). |
| J2 | **apps/api** minimal | NestJS + **Grok** (1 route « generate copy ») + healthcheck. |
| J3 | BullMQ | Même route asynchrone + worker qui écrit un `.md` dans `content/generated`. |
| J4 | Image | 1 route ou job **Grok image** → fichier image + référence dans un manifeste JSON. |
| J5 | **apps/preview** | 2–3 pages HTML qui consomment le contenu figé (accueil jeu, teaser cartes, CTA). |
| J6 | Itération contenu | 2–3 cycles prompt → relecture → figement pour affiner le **processus** documenté ici. |

Après J6 : dupliquer le modèle pour **Ganesh** / **Voix chamaniques**, puis page **groupe trilogie** ; ensuite **React** pour la vitrine prod et intégration **jng-fwk** si pertinent.

---

## 6. Variables d’environnement (extrait — à compléter dans `apps/api`)

Les noms exacts suivront le choix du module Grok (alignement possible sur `gnova-cv-app` : `GROK_API_KEY`, URL modèle).

- `GROK_API_KEY`, `GROK_API_URL` (ou équivalent fournisseur)
- `REDIS_URL` pour BullMQ
- (Phase B) `MONGODB_URI`, secrets Keycloak — lorsque persistance comptes / historique riche sera requise

---

## 7. Lien avec la documentation globale

- Vision long terme, RGPD, trilogie : [projet-sites-jeux-cartes.md](./projet-sites-jeux-cartes.md).
- Ce fichier est la **source de vérité** pour la **première onde de livraison** (prototype Arbre de Vie + serveur IA + preview non-React).

---

*Document vivant — mis à jour au fil des itérations du prototype.*
