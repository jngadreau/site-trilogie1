# Éditeur de landings jeux de cartes — vision produit & technique

Ce document fixe la cible pour remplacer l’admin « monolithique » actuel par un **éditeur dédié** (wizard, IA, prévisualisation) et décrit le **stockage MongoDB + S3** introduit en amont.

Il complète [processus-landing-deck-multi-etapes.md](./processus-landing-deck-multi-etapes.md).

---

## 1. Stockage des données

### 1.1 MongoDB (Mongoose)

- **URI** : `MONGODB_URI` (ex. `mongodb://localhost:27017/gnova-cv`) — même base que gnova-cv possible pour mutualiser l’infra en dev.
- **Contenu** :
  - **Projet de landing** (`DeckLandingProject`) : jeu cible (`gameKey`), identifiant éditorial (`slug`), titre, **description de la page**, **descriptions par section** (clé = type de section, ex. `hero`, `faq`).
  - **Versions** (`DeckLandingVersion`) : plusieurs snapshots par projet — numéro de version, statut (`draft` | `published` | `archived`), ordre souple des sections, variantes par section, **document JSON complet** de la landing (équivalent actuel `deck-landings/*.json`, évolutif).
- Les workflows fichiers JSON sous `content/generated/…` restent utilisables en parallèle pendant la transition ([route legacy admin](../apps/web/src/pages/AdminDeckLandingLegacyPage.tsx)).

### 1.2 S3 (OVH, conventions gnova-cv-app)

Variables alignées sur **gnova-cv-app** :

- `S3_BUCKET_NAME`, `S3_REGION`, `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- `ENV_ID_FOR_STORAGE` (ex. `dev`) — préfixe d’isolation multi-env.

**Préfixe des clés objets** (même logique que les assets CV : `cvapp/<ENV_ID_FOR_STORAGE>/…`) :

```text
cvapp/<ENV_ID_FOR_STORAGE>/deck-landings/<projectId>/<versionId>/assets/<filename>
```

Images générées par l’IA et autres fichiers binaires y sont déposés ; le document Mongo référence les clés ou URLs signées selon les besoins du front.

---

## 2. Page `/admin` (générale)

Ne conserve que des **actions transverses** : par ex. synchronisation des images cartes depuis le dossier jeu, statut Mongo/S3, liens vers l’éditeur (quand disponible) et vers le **workflow legacy** fichiers.

Tout le travail fin sur une landing se fera dans l’éditeur dédié (routes dédiées, hors scope de cette page).

---

## 3. Wizard de création de landing

### 3.1 Étape « Jeu » (formalisée, contenu actuel figé)

- Première étape du wizard : sélection / confirmation du **jeu deck** concerné.
- **Pour l’instant** : une seule option effective, **Arbre de vie** (`gameKey` = `arbre-de-vie`), mais l’UI et le modèle de données doivent **nommer explicitement** cette étape pour ajouter d’autres jeux plus tard.

### 3.2 Structure de la page (deux modes)

1. **Mode automatique** : appel à **Grok** pour proposer une **structure** de landing — **pas** l’obligation d’inclure toutes les sections du catalogue, **pas** d’ordre figé à l’avance ; liste ordonnée de types de sections + variantes suggérées.
2. **Mode manuel** : l’utilisateur **coche** les types de sections souhaités (et éventuellement l’ordre), parmi le catalogue autorisé.

### 3.3 Génération du contenu

- Ensuite : **Grok** remplit **chaque section** retenue ainsi que les **globals** (couleurs, typos, etc.).
- Les **images** produites sont **uploadées vers S3** ; les références sont stockées dans le document de version (et/ou métadonnées projet).

### 3.4 Persistance

- Chaque passage majeur crée ou met à jour une **version** MongoDB (brouillon), jusqu’à publication éventuelle.

---

## 4. Modes après la première version

### 4.1 Mode édition

- **Prévisualisation** du site (rendu proche de la prod) **à côté** d’une **colonne** (ou panneau) pour modifier textes, variantes, médias, etc.
- La prévisualisation est en mode **éditable** : actions directes sur les blocs (sélection, raccourcis, regénération IA ciblée) en complément du panneau latéral.

### 4.2 Mode visualisation

- Affichage **strictement** tel que vu par les visiteurs finaux (sans chrome d’édition).

---

## 5. Implémentation incrémentale (état actuel du dépôt)

| Étape | Statut |
|-------|--------|
| Schémas Mongoose + API CRUD projets / versions | Fait |
| Service S3 (upload, URL signée, préfixe `cvapp/…`) | Fait |
| `/admin` allégée + route legacy deck landing | Fait |
| Hub éditeur : liste / création projets (`gameKey` = `arbre-de-vie`), fiche projet + version brouillon vide | Fait — `/admin/landing-editor` |
| Wizard étape **structure** : Grok sous-ensemble + ordre libre ; mode manuel cases / variantes ; PATCH + squelette `content.sections` | Fait — API `suggest-structure`, `PATCH …/versions/:id` ; UI sur fiche projet |
| Grok **remplissage contenu** (`globals` + `sections` + `imagePrompts`) sur version Mongo (structure préalable) | Fait — `POST …/populate-content` |
| Imagine → **S3** (hero) + URL signée dans `props.imageUrl` + `imageHistory.hero` | Fait — `POST …/generate-hero-s3` (variantes `HeroSplitImageRight` / `HeroFullBleed`, slot `media` ou `imagePrompts.hero`) |
| **Prévisualisation** Mongo (rendu `DeckLandingView` comme `/deck/:slug`) | Fait — `/admin/landing-editor/:projectId/preview/:versionId` |
| Éditeur split preview / panneau + modes edit / view | À faire |

---

## 6. Références code

- Module API : `apps/api/src/landing-storage/`
- Contrôleur HTTP : préfixe `site/landing-storage` (proxy Vite inchangé).
- Structure : `POST …/projects/:projectId/versions/:versionId/suggest-structure` (body `brief?`) ; `PATCH …/projects/:projectId/versions/:versionId` (`sectionOrder`, `variantsBySection`, `rebuildContentSections?`).
- Contenu : `POST …/projects/:projectId/versions/:versionId/populate-content` (body `brief?`) — prompt `07-editor-subset-system.md` + specs par variante.
- Hero Imagine → S3 : `POST …/projects/:projectId/versions/:versionId/generate-hero-s3` — nécessite S3 configuré ; fusion `mergePopulatedLandingDocument` conserve `imageHistory` envoyé par l’appelant (populate sans `imageHistory` garde l’existant).
- Choix de variantes partagés : `apps/api/src/site/deck-landing-variant-choices.ts`.
