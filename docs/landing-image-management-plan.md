# Gestion des images landings — plan produit & technique

Ce document décrit l’évolution souhaitée au-delà du modèle actuel (`media[]` + Imagine → S3). Il complète [landing-editor-vision.md](./landing-editor-vision.md).

Objectifs principaux :

1. **Descriptions riches** par image requise (ratio, scène, contraintes, **type d’asset** : carte, livret, boîte, décor IA, fond de page / section).
2. **Cohérence visuelle globale** injectée dans tous les prompts.
3. **Build** avec **génération automatique** des images (flag, défaut `true`).
4. **Métadonnées** par fichier (pourquoi, à partir de quelle indication, quel modèle).
5. **Éditeur** : liste par section, remplacement par upload, prompts (voir / modifier / **plusieurs propositions** IA), choix **Grok Imagine** vs **Midjourney**, génération liée au prompt.
6. **Arrière-plans** au niveau **page** et **section**.

---

## 1. Modèle de données (évolution du JSON landing)

### 1.1 Globals — brief visuel page

Ajouter sur `globals` (rétrocompatible, tous champs optionnels sauf adoption progressive) :

| Champ | Rôle |
|--------|------|
| `visualBrief` | Texte rédactionnel court : ton, ambiance, références de style, cohérence avec la marque / le jeu ; **doit être repris** lors de l’assemblage des prompts image. |
| `visualBriefMarkdown?` | Variante longue si besoin (même rôle). |
| `backgroundImage?` | Objet **référence d’image** (voir §1.4) pour un fond plein viewport ou « ambiance » derrière toute la page. |
| `backgroundImageSlot?` | Ou lien vers un `slotId` dédié dans un registre d’images global (évite doublon si préféré). |

Le pipeline texte (Grok `populate-content`) doit **toujours** remplir `visualBrief` quand des images sont prévues.

### 1.2 Sections — fonds et trous

Par section, en plus des `props` existants :

| Champ | Rôle |
|--------|------|
| `backgroundImage?` | Référence d’image pour fond de **section** (CSS `background-image` côté web). |
| `imageSlots?` | **Nouveau tableau canonique** (évolution de / complément à `media[]`) décrivant **chaque** visuel attendu par la variante. |

**Stratégie de migration** : garder `media[]` pour compatibilité avec Imagine actuel ; enrichir progressivement `imageSlots[]` comme source de vérité pour l’éditeur et le build. Un script ou l’API peut **normaliser** `media` → `imageSlots` tant que les deux coexistent.

### 1.3 `ImageSlotDefinition` (ce que l’IA remplit pour chaque image)

Pour chaque entrée de `imageSlots[]` (noms indicatifs — à figer dans les types TS) :

| Champ | Type | Description |
|--------|------|-------------|
| `slotId` | string | Identifiant stable (ex. `hero`, `creator`, `photo-0`, `section-bg`). |
| `purpose` | enum-like string | Rôle sémantique : `hero_banner`, `section_background`, `page_background`, `deck_card_front`, `deck_card_back`, `booklet_cover_front`, `booklet_cover_back`, `box`, `lifestyle`, `decoration`, `other`. |
| `aspectRatio` | string | Ex. `16:9`, `4:3`, `20:9`, `2.5:4` (carte). |
| `sizeHint?` | string | Intention largeur/hauteur ou usage (« full-bleed », « thumb », etc.). |
| `sceneDescription` | string | Cœur du sujet / scène. |
| `mood?`, `styleVisual?`, `colorContext?`, `constraints?`, `altHintFr?` | string | Alignés sur le modèle actuel `DeckSectionMediaSlotV1`. |
| `deckAssetRef?` | object | Si `purpose` est carte / livret / boîte : lien **logique** vers le jeu (voir §2). |
| `generation` | object | Voir §1.5. |
| `resolved?` | object | URL(s) actuelle(s), clé S3, alt — une fois généré ou assigné. |

Les **specs** `.spec.md` des variantes React devront lister : quels `purpose` / `slotId` sont attendus, et si l’image est **obligatoirement** un asset jeu (carte) vs **générée IA**.

### 1.4 Référence d’image résolue (`ResolvedImageRef`)

Champs typiques pour ce qui est affichable dans l’UI :

- `imageUrl`, `imageAlt?`
- `s3Key?`, `width?`, `height?`
- `source`: `upload` | `grok_imagine` | `midjourney` | `deck_mirror` | `external`

### 1.5 Métadonnées de génération (`ImageSlotGeneration`)

| Champ | Rôle |
|--------|------|
| `autoGenerate` | bool | Si `true` (défaut), le build peut lancer la génération sans étape manuelle. |
| `primaryModel` | `'grok_imagine' \| 'midjourney' \| 'none'` | Modèle **préféré** pour cette slot (l’éditeur peut surcharger). |
| `assembledPromptEn?` | string | Dernier prompt anglais **effectivement** envoyé (ou assemblé avec `visualBrief`). |
| `promptAlternativesEn?` | string[] | Jusqu’à **5+** variantes proposées par l’IA pour choix utilisateur. |
| `originalIndicationFingerprint?` | string | Hash ou id de l’indication source au moment de la génération (traçabilité). |
| `lastGeneratedAt?` | ISO string | |
| `history?` | array | Entrées `{ url, model, promptSnippet, createdAt }` pour antécédents. |

### 1.6 Drapeau de build (niveau version Mongo)

Sur `DeckLandingVersion` (schéma Mongoose), ajouter :

- `buildOptions?: { autoGenerateImages?: boolean }` avec défaut **`true`** si absent.

Le `POST populate-content` et le job « finalize » futures lisent ce flag : si `autoGenerateImages !== false`, enchaîner (ou mettre en file) génération + hydratation S3 pour les slots éligibles.

---

## 2. Assets jeu (cartes, livret, boîte)

### 2.1 `deckAssetRef`

Structure indicative :

```json
{
  "kind": "deck_card",
  "side": "front",
  "selector": {
    "type": "filename",
    "value": "card_12_front.png"
  }
}
```

ou

```json
{
  "kind": "deck_card",
  "side": "front",
  "selector": { "type": "ordinal", "value": 12 }
}
```

Futur : `{ "type": "slug", "value": "arbre-vie-carte-12" }` si le catalogue expose des slugs.

### 2.2 Comportement

- **Peu d’Imagine** sur du binaire carte identique au jeu : l’URL finale pointe vers **miroir** `deck-cards` ou **S3** après copie/upload.
- L’éditeur affiche un **sélecteur de carte** (liste depuis `GET /ai/generated-images/deck-cards` ou manifeste jeu) et met à jour `deckAssetRef` + `resolved.imageUrl`.

### 2.3 Specs variantes

Mettre à jour les `.spec.md` pour :

- Distinguer **slots IA** vs **slots « strictement asset jeu »** (obligations sur `purpose` et `deckAssetRef`).
- Documenter le motif de nommage des fichiers cartes et les variantes hero « cartes seules » (déjà partiellement fait).

---

## 3. Assemblage des prompts (cohérence globale)

Fonction unique côté API (`DeckLandingImageAssemblyService`) :

**Préambule** : si `globals.visualBrief` est renseigné, il est **préfixé** au prompt Imagine (déjà implémenté). La suite du pipeline peut encore enrichir (purpose `section_background`, etc.).

**Cas partiels** :

- Fond de page / section : ajouter des contraintes « seamless », « no text », « safe area for overlay ».

Règle : **aucun** appel Imagine / export MJ sans ce préambule (sauf si l’utilisateur force un prompt brut dans l’éditeur).

---

## 4. Choix de modèle : Grok Imagine vs Midjourney

| Aspect | Grok Imagine | Midjourney |
|--------|----------------|------------|
| Intégration | Déjà présente (`AiService.generateImageToFile`). | Pas d’API officielle stable ; options : passerelle tierce, Discord bot maison, ou **mode export** (prompt + paramètres) pour collage manuel. |
| Phase 1 | Bouton « Générer » dans l’éditeur si `primaryModel === 'grok_imagine'`. | Stocker `assembledPromptEn` + bouton « Copier prompt Midjourney » ; champ **optionnel** `midjourneyJobUrl` ou image importée après coup. |
| Phase 2 | — | Intégration API si disponible (env `MIDJOURNEY_*`), sinon inchangé. |

L’éditeur doit persister `primaryModel` par slot (surcharge du défaut version globale possible plus tard).

---

## 5. API — esquisse (à implémenter par étapes)

| Méthode | Rôle |
|---------|------|
| `POST .../versions/:id/suggest-prompt-alternatives` | Body : `{ slotPath, count?: number }` → Grok renvoie **≥5** variantes EN à choisir + mise à jour `promptAlternativesEn`. |
| `PATCH .../versions/:id/image-slot` | Mettre à jour slot (prompt, model, `deckAssetRef`, `resolved`). |
| `POST .../versions/:id/generate-slot` | Body `{ slotPath, model: 'grok_imagine' \| 'midjourney' }` — Imagine synchronis ou file ; MJ = phase 1 export seulement. |
| `POST .../versions/:id/assign-upload` | Déjà proche de `assets` + PATCH pour lier `resolved` + S3 key. |

`slotPath` : ex. `sections[3].imageSlots[id=hero]` ou `globals.backgroundImage`.

---

## 6. Éditeur — UI par section

1. **Liste des images** : dérivée des `imageSlots` (+ entrées globales `globals.backgroundImage` et fonds section).
2. **Par ligne** : aperçu, `purpose`, ratio, modèle choisi, lien « voir prompt », « 5 variantes », champ prompt éditable.
3. **Actions** : Upload → enregistrer asset → assigner au slot ; Régénérer (Grok) ; Copier (MJ).
4. **Build** : toggle « Générer automatiquement les images au build » (bind `buildOptions.autoGenerateImages`).

---

## 7. Arrière-plans

- **Page** : `globals.backgroundImage` + styles dans `DeckLandingView` (couche `::before` ou div dédiée, `background-size: cover`, contraste texte).
- **Section** : `section.backgroundImage` + classe sur le wrapper de section dans `sectionRegistry` / chaque variante.

Les specs et le prompt Grok doivent autoriser explicitement `purpose: section_background` et `page_background`.

---

## 8. Phases d’implémentation recommandées

| Phase | Livrables |
|-------|------------|
| **P0** | Types TS + schéma JSON documenté ; `visualBrief` dans prompt `07-editor-subset-system.md` et populate ; champ `buildOptions.autoGenerateImages` sur version ; **normaliseur `media` → `imageSlots`** après populate ; **Imagine→S3 auto** après populate si flag + S3 (sauf `skipAutoImagine`). |
| **P1** | Éditeur liste `imageSlots` + … ; **split preview** + fonds page/section en rendu — **fait** ; fond section éditable JSON / UI ciblée : optionnel. |
| **P2** | `POST suggest-prompt-alternatives` + UI ; `GET assembled-image-prompt` + copie presse-papiers ; `primaryModel` en PATCH + sélecteur UI — **fait** (MJ = export prompt seulement). |
| **P3** | Sélecteur carte (`deckAssetRef`) ; spécifications variantes ; intégration MJ réelle si disponible. |

---

## 9. Fichiers impactés (référence)

- Prompts : `content/arbre-de-vie/prompts/deck-modular-landing/07-editor-subset-system.md`, futures itérations par variante.
- Types : `apps/api/src/site/deck-modular-landing.types.ts`, `apps/web/src/types/deckLanding.ts`.
- Services : `landing-version-media-s3.service.ts`, `DeckLandingImageAssemblyService`, `LandingContentPopulateService`.
- Schéma : `apps/api/src/landing-storage/schemas/deck-landing-version.schema.ts`.
- Web : nouveaux composants sous `LandingEditorProjectPage` ou route `…/images`.

---

## 10. Notes

- Les chemins **`/site/landing-storage/…/assets/file/…`** ne expirent pas côté client ; le serveur lit toujours l’objet S3 à la volée. Pour `resolved.s3Key` réservé au backend si besoin de migrations.
- **Midjourney** : documenter clairement la limite « export prompt » tant que l’API n’est pas branchée, pour ne pas promettre un bouton identique à Grok.
