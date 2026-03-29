# Processus — landing « deck » multi-étapes (vision cible)

Ce document décrit le **processus de création** visé pour les sites vitrine de **jeux de cartes** (oracles, tarots, jeux d’accompagnement, etc.), au-delà du prototype actuel (monolithique `landing-spec.json`). Il complète [processus-prototype-arbre-de-vie.md](./processus-prototype-arbre-de-vie.md) et [projet-sites-jeux-cartes.md](./projet-sites-jeux-cartes.md).

**Voir aussi** : [landing-editor-vision.md](./landing-editor-vision.md) (éditeur cible, MongoDB, S3, wizard IA).

---

## 1. Vocabulaire : *deck* vs *jeu*

| Contexte | Terme recommandé | Note |
|----------|------------------|------|
| Specs techniques / API / code (anglais) | **Deck** | Désigne clairement le **produit matériel** : cartes (+ livret, boîte, etc.). Évite l’ambiguïté de *game* (règles, multijoueur, « jeu vidéo »). |
| Copy marketing FR | **Jeu**, **oracle**, **jeu de cartes** | Naturel en français. « Deck » reste un anglicisme possible en niche, pas obligatoire. |
| Contexte global généré | **Contexte deck** (ou *jeu* en FR) | Fichier type `deck-context.md` possible plus tard ; aujourd’hui `game-context.md` reste valide tant que le pipeline n’est pas renommé. |

**Synthèse :** en anglais et en conception produit, **deck** est souvent plus adapté que *game* pour un oracle / tarot. En français utilisateur, on garde **jeu / oracle**.

---

## 2. Vue d’ensemble du pipeline cible

```text
Sources détaillées (MD cartes, livret, JSON, marque…)
        │
        ▼
[1] IA — contexte global du deck (document long, réutilisable)
        │
        ▼
[2] IA — choix des sections parmi un catalogue figé (liste autorisée + justification courte)
        │
        ▼
[3] Pour chaque section retenue : choix d’un layout (parmi variantes prédéfinies pour ce type de section)
        │
        ▼
[4] IA — génération des éléments de la section (textes, briefs image, couleurs, CSS optionnel…)
        à partir du contexte deck + spec de section + layout
        │
        ▼
[5] Assemblage page + prévisualisation
        │
        ▼
[6] Interface créateur : édition manuelle des textes + (plus tard) dialogue IA par section pour affiner
```

**État actuel dans le dépôt :** les étapes [1] et une partie de [4] existent sous une forme **monolithique** (`POST /site/generate-game-context`, `POST /site/generate-landing` → `landing-spec.json`). Les étapes [2], [3], [6] sont **à concevoir / implémenter**.

---

## 3. Étape 1 — Contexte global du deck (IA)

- **Entrées :** textes des cartes (MD), livret(s), métadonnées export (JSON), contexte marque / trilogie, etc.
- **Sortie :** un **Markdown long** (cible actuelle : jusqu’à ~**5×** la longueur d’une première synthèse courte), structuré, **sans** recopier les cartes mot à mot.
- **Rôle :** alimenter toutes les étapes suivantes **sans** renvoyer l’intégralité des sources à chaque appel.
- **Fichier actuel :** `content/generated/arbre-de-vie/game-context.md` (nom historique ; renommage possible vers `deck-context.md`).

Contenu attendu enrichi (non exhaustif) : identité et positionnement, public, usages et tirages, matériel, tonalité et registre, thèmes symboliques agrégés, différenciation, contraintes légales / éditoriales, glossaire interne, idées de sections marketing, angles pour visuels, etc.

---

## 4. Étape 2 — Sections retenues (catalogue + Grok)

- **Catalogue :** liste **figée dans le dépôt** des *types* de sections possibles (voir section 7 ci-dessous).
- **Comportement IA :** à partir du contexte deck, le modèle **sélectionne** un sous-ensemble pertinent (ordre + justification légère), sans inventer de types hors liste.
- **Sortie structurée :** JSON (ex. `{ "sections": [ { "id": "...", "rationale": "..." } ] }`) — schéma à définir à l’implémentation.

---

## 5. Étape 3 — Layouts par type de section

- Chaque **type** de section peut avoir **plusieurs layouts** (ex. hero : texte à gauche / image à droite vs image pleine largeur + titre overlay).
- Chaque layout définit **quels éléments** sont requis (champs texte, slots d’image, tokens couleur, blocs CTA, etc.).
- La spec de section = **type** + **layoutId** + paramètres éventuels.

---

## 6. Étape 4 — Génération des éléments par section

Pour une section donnée, l’IA reçoit :

- le **contexte deck** (extrait ou fichier complet selon budget tokens) ;
- la **spec** : type, layout, contraintes (longueur, ton, CTA, etc.).

Elle produit **tous les éléments** prévus par le layout : textes, briefs pour images, palette ou surcouche CSS si le layout l’exige, etc.

---

## 7. Étape 5–6 — Rendu, produit fini, édition et itération

- **Vue finie :** assemblage HTML/CSS (ou composants) à partir des sections générées.
- **Interface créateur (cible) :**
  - modification **rapide des textes** (champs liés à la spec) ;
  - plus tard : **conversation par section** avec l’IA pour régénérer ou affiner un bloc sans tout regénérer.

---

## 8. Catalogue — types de sections envisageables pour une landing « deck »

Liste de **référence** pour l’étape 2 (sélection par l’IA). Les noms sont des identifiants techniques possibles ; le libellé affiché peut différer.

| Id (exemple) | Rôle |
|----------------|------|
| `hero` | Accroche principale, titre, sous-titre, visuel fort, CTA primaire. |
| `deck_identity` | Nom, sous-titre, « une phrase » sur ce qu’est le deck. |
| `for_who` | Public cible, besoins, niveau (débutant / avancé). |
| `how_to_use` | Modes d’usage, tirages suggérés, pas à pas léger (sans recopier tout le livret). |
| `what_inside` | Contenu : nombre / types de cartes, livret, accessoires, langues. |
| `card_preview` | Aperçu visuel des cartes (grille, carrousel, sélection thématique). |
| `symbolic_universe` | Univers symbolique, archétypes, saisons / éléments si pertinent. |
| `differentiators` | Ce qui distingue ce deck des autres (ligne éditoriale, format, expérience). |
| `creator_author` | Créatrice·eur, maison, démarche, chaîne éditoriale. |
| `series_trilogy` | Appartenance à une série, decks complémentaires, packs. |
| `material_quality` | Format physique (mm), finitions, engagement qualité (si infos sourcées). |
| `testimonials` | Témoignages, citations, presse (si matière disponible). |
| `faq` | Questions fréquentes (usage, envoi, retours, esprit du deck). |
| `pricing_cta` | Prix, points de vente, CTA boutique, éditions limitées. |
| `newsletter_community` | Inscription, réseaux, communauté. |
| `free_resources` | PDF, tirage en ligne, extrait du livret légal. |
| `gallery_making_of` | Coulisses, photos atelier, variantes visuelles. |
| `video` | Bloc vidéo (présentation, unboxing). |
| `comparison` | Comparaison courte avec un autre deck de la même ligne (optionnel). |
| `trust_badges` | Paiement sécurisé, envoi, garanties factuelles. |
| `legal_mini` | Mentions légales compactes, lien politique de confidentialité. |

**Remarque :** une landing réelle n’utilisera qu’**un sous-ensemble** (souvent 5–10 sections). L’IA choisit en fonction du contexte deck et des objectifs (conversion, storytelling, SEO…).

### 8.1 Prototype modulaire (quatre premiers types)

- **App React :** `site-trilogie1/apps/web` — `npm run dev` (port **5176**, proxy vers l’API **3040**). Routes : `/deck/arbre-de-vie-a`, `/deck/arbre-de-vie-b`, `/deck/arbre-de-vie-c`, `/admin` (suivi JSON + appels Grok plan / landing).
- **JSON servi :** `content/generated/arbre-de-vie/deck-landings/{slug}.json` — `globals` (couleurs, polices, `fontImportHref` optionnel) + **4 sections** dans l’ordre imposé.
- **API :** `GET /site/deck-landing/:slug`, `POST /site/generate-deck-landing/:slug` ; `GET /site/deck-modular-landing-dashboard`, `GET /site/deck-landing-variant-plan/:slug`, `POST /site/generate-deck-landing-variant-plan/arbre-de-vie-c` (plan + mise à jour `deck-landing-variants.json`). Slugs `a` \| `b` \| `c`.
- **Prompts Grok :** `content/arbre-de-vie/prompts/deck-modular-landing/`.
- **Images (Imagine) :** chaque section peut exposer **`media[]`** (slots avec `sceneDescription`, `aspectRatio`, etc., décrits dans les `*.spec.md`). L’API assemble un prompt via `DeckLandingImageAssemblyService` puis appelle Imagine. **Point d’entrée HTTP** : `POST /site/generate-deck-landing-image/:slug/:sectionId/:slotId` ou job BullMQ `deck-landing-generate-image`. **Hero rapide** : `POST /site/generate-deck-landing-hero-image/:slug` (priorité au slot `media` si présent).
- **Pipeline BullMQ :** `POST /site/generate-deck-landing-pipeline/:slug` — composition (`05-composition-…`) → 4× `deck-landing-section-elements` (`06-section-elements-…`) → `deck-landing-finalize` → jobs image. **Redis** requis. Suivi : `GET /site/deck-landing-pipeline-jobs` et `/admin`.
- **Variantes par landing :** `content/arbre-de-vie/deck-landing-variants.json`. Specs des champs par layout : `apps/web/src/sections/*/variants/*.spec.md`.

---

## 9. Évolutions techniques suggérées (backlog)

- Renommer conceptuellement `game-context` → `deck-context` (chemins + endpoints + rétrocompat).
- Schémas JSON versionnés : `section-catalog.json`, `section-layouts.json`, `deck-plan.json`, `section-instance.json`.
- Endpoints dédiés ou jobs : `generate-deck-context`, `plan-landing-sections`, `generate-section`.
- UI admin / preview avec formulaires par section et historique des prompts.

---

*Dernière mise à jour : mars 2026.*
