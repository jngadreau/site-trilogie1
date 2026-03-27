# Sites web de présentation — jeux de cartes Oracles

## 1. Contexte

### 1.1 Jeux concernés (trilogie actuelle)

Trois jeux d’oracle composent la première série (marque **Ose Un Pas Vers Toi**, Hélène Durand). D’après les livrets dans `oseunpasverstoi-jeux1/`, chaque jeu comporte **64 cartes au total** (32 visuelles + 32 messages longs), format marque-page :

| Jeu | Positionnement dans la trilogie (résumé éditorial) |
|-----|-----------------------------------------------------|
| **Ganesh** | Sagesse bienveillante, lever les obstacles, clarté et transformation ; ton « compagnon » pour avancer avec confiance. |
| **L’Arbre de Vie** | Racines et élévation, cycles de la nature, croissance intérieure, force tranquille et harmonie (terre ↔ ciel). |
| **Les Voix Chamaniques** | Ancêtres, totems, chant du vivant ; ancrage chamanique et profondeur, en dialogue avec la sagesse des autres deux oracles. |

Les livrets décrivent explicitement cette **complémentarité** : jeux utilisables seuls ou combinés pour enrichir les tirages.

### 1.2 Trilogie comme « groupe de jeux »

La trilogie est modélisée comme un **groupe de jeux** : entité de contenu distincte où l’on peut :

- publier une **page dédiée** avec une vision d’ensemble plus courte que les pages jeu ;
- lier vers chaque jeu pour le détail ;
- proposer un achat **pack trilogie** (lien vers la boutique externe en V1) en parallèle des liens jeu par jeu ;
- **générer des contenus IA** qui parlent des **trois jeux ensemble** (complémentarité, parcours, usage combiné), en plus des contenus par jeu.

### 1.3 Sources de données dans ce dépôt

- **`oseunpasverstoi-jeux1/`** — Textes décrivant les jeux et les cartes, structure par jeu (ex. `Ganesh/`, `Arbre de vie/`, `Les Voix Chamaniques/`), fichiers Markdown dans `contexts/cards/`, livrets dans `booklet/`, JSON de deck quand présents (`card-deck.json`, `cards-data.json`, etc.). **Les images présentes dans ce dépôt ne sont pas les cartes finales.**
- **`images-jeux/`** — Export des visuels finaux (par jeu, ex. `ganesh/`, `arbre_de_vie/`, `voix_chamaniques/`) avec des fichiers comme `metadata.json` décrivant le nombre de cartes, résolution, fonds perdus, etc. Des archives (ex. zip d’export) peuvent aussi être présentes.

### 1.4 Modèle de contenu (rappel)

Pour chaque jeu : **32 cartes image** et **32 cartes messages**, appariées par **titre identique**. Le site de présentation s’appuie sur cette dualité sans exposer tout le livret en ligne.

### 1.5 Politique d’affichage des visuels et messages sur le site public

| Élément | Politique retenue |
|---------|-------------------|
| **Faces des cartes (visuels)** | **Échantillon** uniquement sur le site, **sans obligation de pleine résolution** (dérivés web optimisés : vignettes, médiane définition, etc.). |
| **Mise en avant « globale » des cartes** | En complément, **images ou vidéos promotionnelles** (souvent générées ou compositées) qui peuvent **suggérer l’ensemble du jeu** sans montrer chaque carte en grand format — par exemple un **éventail** de cartes où seules certaines faces sont visibles ou lisibles, le reste partiellement masqué ou en profondeur de champ. |
| **Cartes messages** | **Un ou deux extraits** de type **marketing** par jeu (ou par mise en avant), pas l’intégralité des textes longs. |

Cette politique protège l’expérience d’achat tout en donnant une **lecture visuelle** forte du produit.

---

## 2. Objectifs produit

1. **Promouvoir** chaque jeu avec une identité visuelle et verbale cohérente avec son univers.
2. **Montrer** visuellement ce que donnent les cartes (échantillon + médias promo éventail / scènes), sans tout dévoiler.
3. **Relier** les jeux entre eux via le **groupe** (trilogie), les liens croisés et les contenus « ensemble ».
4. **Convertir** principalement en dirigeant le visiteur vers la **boutique externe** (V1) ; le produit Creaticards devra **laisser le créateur configurer** l’URL ou le mode de conversion (un ou plusieurs liens, pack, etc.) lorsque c’est pertinent.
5. **Mesurer** l’intention d’achat via des **CTA** traçables (voir §6.3 et §11).
6. **Servir de gabarit** pour d’autres créateurs / autres jeux : même architecture, données différentes.
7. **Préfigurer** dans Creaticards un flux guidé : génération IA, historique, évolutions par prompts, publication vers site statique ou pipeline de déploiement.

### 2.1 Première version commerce (hors site)

Pour aller vite, la **vente et le paiement** ne font pas partie du périmètre de la première version du site vitrine ou de la V1 complète e-commerce interne. Les achats se font sur **un site externe** (boutique du créateur, plateforme tiers, etc.).

En revanche, il faut dès la V1 :

- des **éléments de conversion clairs** : boutons « Acheter », liens pack trilogie, ancres réutilisables ;
- la possibilité de **compter les clics** (et idéalement d’attribuer les clics à un CTA / une campagne) pour des **stats** — implémentation détaillée : analytics avec événements, ou lien instrumenté, ou endpoint léger derrière le site (voir contraintes RGPD §11).

---

## 3. Stack technique cible

### 3.1 Frontend (site public / vitrine)

- **React + TypeScript**
- **Build** : Vite (ou équivalent) — à figer au bootstrap du dépôt applicatif vitrine
- **Contenu publié** : fichiers versionnés (JSON, YAML, Markdown) générés ou édités après validation dans Creaticards, puis build statique

### 3.2 Backend (plateforme Creaticards — orchestration, IA, créateurs)

Stack actuellement visée :

| Couche | Technologie |
|--------|-------------|
| Langage | **TypeScript** |
| Framework API | **NestJS** |
| Données | **MongoDB** + **Mongoose** |
| Files d’attente / jobs async | **BullMQ** (générations IA, traitements images, pipelines publication) |
| LLM | **API Grok** en point d’entrée principal ; **architecture modulaire** pour pouvoir brancher d’autres fournisseurs si besoin |
| Images IA | **Grok** (image) en premier ; possibilité de produire des **prompts optimisés Midjourney** (texte exporté pour usage dans un autre outil) en complément |
| Authentification | **Keycloak** |
| Transversal | Framework **maison** pour les briques communes (conventions, guards, helpers) sur les parties « de base » |
| Fichiers | **S3** (ou compatible) pour stockage des assets générés, exports, médias |

Le site vitrine **statique** n’embarque pas nécessairement ce runtime : le backend sert surtout aux **créateurs** (workspaces, génération, historique, déploiement).

### 3.3 Séparation des responsabilités (rappel)

- **Sans serveur côté visiteur** : pages marketing, assets, liens boutique — déployables sur CDN/pages statiques.
- **Avec backend** : comptes créateurs, jobs IA, stockage des brouillons et historiques, webhooks éventuels, et tout ce qui exige des secrets ou un consentement structuré côté serveur.

---

## 4. Site statique (sans serveur) vs rôle du backend

### 4.1 Ce qu’un site 100 % statique permet (côté visiteur)

- Hébergement simple : GitHub Pages, Cloudflare Pages, Netlify, S3 + CloudFront, etc.
- Performances, coût réduit, pas de serveur à scaler publiquement pour la lecture des pages.
- Adapté à : storytelling, galerie d’échantillons, médias promo (images/vidéos hébergées sur CDN ou S3), liens sortants vers la boutique.

### 4.2 Limites du tout-statique

- Pas de tunnel d’achat intégré en V1 (choix explicite).
- Formulaires newsletter / contact : souvent **services tiers** ou **petites API** derrière le backend Creaticards si un jour tout est unifié.
- **Mesure des clics** : en pratique, **balises analytics** (avec consentement cookies — §11), ou liens avec paramètres UTM, ou requêtes vers une API de tracking **après consentement** ; le backend peut centraliser des agrégats si besoin.

### 4.3 Rôle du backend (NestJS, etc.)

| Besoin | Rôle |
|--------|------|
| Génération IA (texte, prompts image, orchestration) | Appels **Grok** (et autres), **BullMQ** pour la robustesse |
| Historique des versions d’un bloc de contenu | Persistance **MongoDB**, politique de **taille limite** ou fenêtre glissante |
| Fichiers générés / composités | **S3**, URLs signées ou publication vers bucket statique |
| Auth créateurs | **Keycloak** + couche maison |
| Prévisualisation avant publication | Pipeline brouillon → validé → export vers le repo ou le build statique |

---

## 5. Processus de création des sites (IA + validation humaine)

### 5.1 Vue d’ensemble des phases

```mermaid
flowchart LR
  A[Sources brutes MD JSON images] --> B[Bundle de contexte pour IA]
  B --> C[Première version IA pour tous les types d'éléments]
  C --> D[Historique versionne]
  D --> E[Validation / édition manuelle ou prompt d'évolution]
  E --> F[Assets figés copy + médias]
  F --> G[Données site React]
  G --> H[Build statique et déploiement]
```

### 5.2 Stratégie IA : première passe globale, puis itération

1. **Inventaire des types d’éléments** à produire (hero, FAQ, SEO, textes groupe/trilogie, légendes médias, extraits messages, briefs visuels, etc.).
2. **Une première génération IA** couvre **tous** ces types (cohérence globale du ton et des promesses).
3. **Historique** : chaque élément (ou document) conserve un **historique de versions** avec une **limite de taille** (nombre de versions ou rétention temporelle) à définir en implémentation.
4. **Évolution** : pour un type d’élément donné, l’utilisateur peut demander une **révision par prompt** (« raccourcis », « plus poétique », « insiste sur le pack ») ; le système enregistre la nouvelle version dans l’historique.
5. **Édition manuelle** toujours possible (éditeur texte / champs structurés) en parallèle ou après génération.
6. Cette logique d’**historique + prompt d’évolution + édition** doit être **générique** : applicable à **plusieurs types d’éléments** (paragraphes, titres, meta, champs JSON, éventuellement références à des chemins d’assets).

### 5.3 Rôle de l’IA par type de livrable

| Livrable | Rôle typique de l’IA | Validation humaine |
|----------|----------------------|-------------------|
| Textes **groupe / trilogie** | Synthèse complémentarité, pack, parcours | Vérifier promesses et cohérence avec chaque jeu |
| Accroches, story par jeu, FAQ | Première rédaction à partir du livret | Voix, précision spirituelle/factuelle |
| Extraits **messages** (1–2 max visibles publiquement) | Formulations courts extraits marketing | Aucun contresens, respect du positionnement |
| SEO / meta | Variantes | Choix final |
| Briefs / prompts pour images & vidéo | Mise en scène, style, cadrage | Alignement marque ; pour Midjourney, export du prompt |
| Accessibilité | Suggestions `alt`, contrastes | Décision et tests |

### 5.4 Boucle opérationnelle

1. **Ingestion** : jeux + assets officiels (cartes échantillon, couvertures livret/boîte si disponibles en numérique).
2. **Prompt pack** : contrat éditorial (public, tonalité, ce qui reste payant).
3. **Génération batch** : jeux + page groupe trilogie.
4. **Revue** : titres, cohérence image/message, pas de claims abusifs.
5. **Figement** pour le web : export vers données du site + build.

### 5.5 Images et médias promotionnels : clarification

**Sens de la question « images promo » (documentation initiale)**  
Il s’agissait de distinguer : (a) les **visuels produit officiels** (illustrations des cartes) de (b) les **créations purement IA** (bannières abstraites, personnages imaginaires, etc.) qui pourraient **ne pas reprendre** les vraies cartes. La question visait à savoir dans quelle mesure vous acceptiez ce **décalage** pour des campagnes.

**Position retenue et enrichissement**  
Les promos peuvent et **doivent souvent** combiner :

- **Éléments réels du jeu** : images de cartes (échantillon), **couverture du livret**, **couverture de boîte**, etc. ;
- **Mise en scène** : par exemple un **éventail** de cartes (aperçu partiel), puis **composition** sur un fond, une table, une scène générée ou photographique ;
- **Vidéo** : mêmes principes (animation d’éventail, transitions).

Piste **ultérieure** : génération de **fichiers 3D + textures** (cartes, boîte) pour des **scènes 3D** (ex. **Three.js** dans le navigateur pour une expérience, ou rendu offline pour **vidéos 3D** promotionnelles).

---

## 6. Fonctionnalités possibles pour le site (backlog inspiration)

### 6.1 Présentation & narration

- Page **groupe / trilogie** : texte relativement **succinct**, liens vers chaque jeu, mise en avant du **pack** si applicable.
- **Page par jeu** : hero, récit, extraits livret, autrice.
- Fil conducteur entre jeux.

### 6.2 Découverte des cartes

- **Galerie d’échantillon** (pas l’intégralité en haute définition).
- **Médias hero** : photo / vidéo type éventail, mockup table, etc.
- Fiche « teaser » éventuelle avec **1–2 extraits messages** marketing.
- (Option plus tard) tirage démo, carte du jour — **hors périmètre fixé** tant que non priorisé.

### 6.3 Conversion, CTA et mesure

- **CTA** vers la boutique externe (par jeu, pack trilogie, configurables par le créateur).
- **Statistiques de clics** : événements analytics, UTM, ou endpoint dédié — **voir §11** pour consentement et données personnelles.
- Newsletter / contact : intégration tierce ou lien mailto selon choix du créateur.

### 6.4 Qualité, légal et international

- Accessibilité (WCAG), mentions légales, crédits illustrateurs.
- **Multilingue** si besoin.

### 6.5 Technique & généricité

- Manifeste **jeu** + manifeste **groupe** (liste de jeux, offre pack, textes groupe).
- Thèmes par jeu ; composants React génériques (`GameLayout`, `CardSampleGrid`, `GameGroupHub`).

---

## 7. Réplication pour d’autres jeux de cartes

1. **Contrat de données** : `GameManifest` + `GameGroupManifest` (trilogie ou toute autre collection).
2. **Dossiers de contenu** par jeu et par groupe.
3. **Pas de noms codés en dur** dans les composants : slugs et i18n.
4. Scripts de validation et de build statique.

---

## 8. Pistes d’identité visuelle (creative direction)

*(Pistes non figées — chaque jeu garde son atmosphere ; UI partage une grille commune.)*

- **Ganesh** : or chaud, indigo profond ; serif humaniste possible pour les titres.
- **Arbre de Vie** : verts minéraux, bois, organique / géométrie.
- **Voix Chamaniques** : textures naturelles, brumes, feu / nuit.

---

## 9. Jalons de planification (squelette)

| Phase | Livrable |
|-------|----------|
| P0 | `GameManifest` / `GameGroupManifest` TypeScript + import des 3 jeux |
| P1 | Site statique : hub **groupe** + pages jeu ; galerie **échantillon** ; CTA boutique + base de tracking **conforme consentement** |
| P2 | Médias promo (composite éventail + fond) intégrés au hero ; premières vidéos courtes si disponibles |
| P3 | Backend Creaticards : jobs **BullMQ**, Grok, historique versionné (limite), prompts Midjourney exportables |
| P4 | Scènes 3D / pipeline textures (recherche & PoC), intégration Three ou rendu vidéo selon choix |

---

## 10. Questions ouvertes (à compléter au fil des itérations)

- **Langues** cibles pour la V1 (FR seul, FR+EN) ?
- **Nombre exact de cartes** en échantillon public par jeu (fixe vs configurable par créateur) ?
- Fournisseur précis pour **analytics / comptage de clics** (plausible, Matomo auto-hébergé, GA4 avec CMP, etc.) compte tenu du **§11** ?
- **Pack trilogie** : une URL unique boutique ou paramètre URL unique depuis le site ?
- Les métadonnées `images-jeux/*/metadata.json` + fichiers exportés restent-elles la **source de vérité** pour l’ordre et le décompte des cartes côté site ?

---

## 11. Conformité RGPD et cookies

Le site vise un public européen et des créateurs : il faut **anticiper** :

- **Base légale** et transparence pour toute collecte (newsletter, analytics, tracking de clics si identifiant ou profilage).
- **Bannière / CMP** (gestion du consentement) avant dépôt de cookies non essentiels ou trackers tiers.
- **Politique de confidentialité** : finalités, durées, destinataires, transferts hors UE si applicable.
- **Minimisation** : préférer des mesures **agrégées** et, lorsque possible, des solutions **sans cookie** ou **first-party** avec consentement explicite pour les mesures marketing fines.
- **Droits** : accès, effacement, rectification — process côté backend si comptes créateurs ou données stockées.

Les choix techniques (analytics, Keycloak, S3, régions) devront être documentés dans une annexe **registre de traitements** pour le produit Creaticards.

---

*Document vivant — dernière mise à jour : mars 2026.*
