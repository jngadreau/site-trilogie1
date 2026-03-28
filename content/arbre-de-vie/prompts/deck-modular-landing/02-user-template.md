## Contexte deck (synthèse)

{{DECK_CONTEXT}}

---

## Landing à générer

**Identifiant** : `{{LANDING_SLUG}}`  
**Variantes imposées** (JSON) :

```json
{{VARIANT_MAP_JSON}}
```

---

## Specs détaillées des variantes (Markdown)

S’appuie sur ces descriptions pour rédiger des **props** et des **globals** alignés (ton, longueur, overlay, structure des listes / piliers / étapes).

{{SECTION_SPECS_BUNDLE}}

---

## Schéma JSON exact à produire

Renvoie **uniquement** cet objet (types indicatifs ; adapte le contenu au deck).

**Ordre des sections (obligatoire)** : `hero` → `deck_identity` → `for_who` → `outcomes` → `how_to_use` → `in_the_box` → `faq` → `creator` → `related_decks` → `cta_band`.

```json
{
  "version": 1,
  "slug": "{{LANDING_SLUG}}",
  "imagePrompts": {
    "hero": "string optionnel — UN prompt en anglais pour Grok Imagine (bannière). Si omis, l’API le synthétisera."
  },
  "globals": {
    "accent": "#hex",
    "background": "#hex",
    "surface": "#hex",
    "text": "#hex",
    "textMuted": "#hex",
    "fontHeading": "string (ex: 'Playfair Display', Georgia, serif)",
    "fontBody": "string",
    "radius": "12px",
    "fontImportNote": "string optionnel (ex: lien Google Fonts)",
    "fontImportHref": "string optionnel — URL complète d'une feuille de style (ex. fonts.googleapis.com) pour charger les familles citées"
  },
  "sections": [
    {
      "id": "hero",
      "variant": "selon carte — HeroSplitImageRight | HeroFullBleed | HeroGlowVault | HeroParallaxLayers | HeroCardsFan | HeroCardsStrip | HeroCardsMosaic",
      "props": {},
      "media": [
        {
          "slotId": "hero",
          "aspectRatio": "16:9",
          "sceneDescription": "…",
          "mood": "…",
          "styleVisual": "…",
          "colorContext": "…",
          "constraints": "No readable text or logos in the image.",
          "altHintFr": "…"
        }
      ]
    },
    {
      "id": "deck_identity",
      "variant": "IdentityPanel OU IdentityMinimal",
      "props": {},
      "media": []
    },
    {
      "id": "for_who",
      "variant": "ForWhoTwoColumns OU ForWhoPillars",
      "props": {},
      "media": []
    },
    {
      "id": "outcomes",
      "variant": "OutcomesBentoGrid OU OutcomesSignalStrip",
      "props": {},
      "media": []
    },
    {
      "id": "how_to_use",
      "variant": "HowToNumbered OU HowToTimeline",
      "props": {},
      "media": []
    },
    {
      "id": "in_the_box",
      "variant": "IncludedChecklist OU IncludedHighlightGrid",
      "props": {},
      "media": []
    },
    {
      "id": "faq",
      "variant": "FaqAccordion OU FaqTwoColumn",
      "props": {},
      "media": []
    },
    {
      "id": "creator",
      "variant": "CreatorSpotlight OU CreatorQuoteBand",
      "props": {},
      "media": []
    },
    {
      "id": "related_decks",
      "variant": "RelatedDecksGrid OU RelatedDecksInline",
      "props": {},
      "media": []
    },
    {
      "id": "cta_band",
      "variant": "CtaMarqueeRibbon OU CtaSplitAction",
      "props": {},
      "media": []
    }
  ]
}
```

Chaque section doit inclure **`media`** : tableau d’objets slots (voir specs `.spec.md` « Slots médias ») ou `[]` si aucune image. Pour **`HeroCardsFan`**, **`HeroCardsStrip`**, **`HeroCardsMosaic`** : `media` du hero = **`[]`** (images = `cards[]` uniquement).

### Props par variant (obligatoires)

**HeroSplitImageRight** : `title`, `subtitle`, `bodyMarkdown`, `ctaLabel`, `ctaHref`, `imageUrl`, `imageAlt`

**HeroFullBleed** : `title`, `tagline`, `bodyMarkdown`, `ctaLabel`, `ctaHref`, `imageUrl`, `imageAlt`, `overlayOpacity` (nombre 0.35–0.65)

**HeroGlowVault** : `kicker`, `title`, `bodyMarkdown`, `ctaLabel`, `ctaHref`, `imageUrl`, `imageAlt`, `glowIntensity` (0.35–0.95)

**HeroParallaxLayers** : `eyebrow`, `title`, `strapline`, `bodyMarkdown`, `ctaLabel`, `ctaHref`, `imageUrl`, `imageAlt`, `spineLabel` (optionnel)

**HeroCardsFan** : `title`, `kicker`, `bodyMarkdown`, `ctaLabel`, `ctaHref`, `cards` (tableau **3 à 7** objets `{ "imageUrl", "alt", "caption?" }` — `imageUrl` = **`/ai/generated-images/deck-cards/<fichier.png>`**)

**HeroCardsStrip** : `title`, `subtitle`, `bodyMarkdown`, `ctaLabel`, `ctaHref`, `cards` (**4 à 9** mêmes objets)

**HeroCardsMosaic** : `title`, `tagline`, `bodyMarkdown`, `ctaLabel`, `ctaHref`, `cards` (**4 à 6** mêmes objets)

**IdentityPanel** : `deckName`, `tagline`, `bodyMarkdown`, `badge` (optionnel)

**IdentityMinimal** : `eyebrow`, `title`, `oneLiner`

**ForWhoTwoColumns** : `title`, `leftMarkdown`, `rightMarkdown`

**ForWhoPillars** : `title`, `introMarkdown`, `pillars` (tableau `{ "title", "bodyMarkdown" }`, au moins 3)

**OutcomesBentoGrid** : `sectionTitle`, `introMarkdown`, `cells` (≥ 4 `{ "title", "bodyMarkdown", "span"? }` avec `span` ∈ `wide` | `tall` | `featured`, au moins une `featured`)

**OutcomesSignalStrip** : `sectionTitle`, `introMarkdown`, `signals` (≥ 3 `{ "label", "detailMarkdown" }`)

**HowToNumbered** : `title`, `introMarkdown` (optionnel), `steps` (≥ 3 `{ "title", "bodyMarkdown" }`)

**HowToTimeline** : `title`, `introMarkdown`, `steps` (≥ 3 `{ "label", "detailMarkdown" }`)

**IncludedChecklist** : `sectionTitle`, `introMarkdown` (optionnel), `items` (≥ 3 `{ "title", "detailMarkdown?" }`)

**IncludedHighlightGrid** : `sectionTitle`, `introMarkdown` (optionnel), `highlights` (2 à 6 `{ "title", "bodyMarkdown" }`)

**FaqAccordion** : `sectionTitle`, `introMarkdown` (optionnel), `items` (≥ 3 `{ "question", "answerMarkdown" }`)

**FaqTwoColumn** : `sectionTitle`, `introMarkdown` (optionnel), `leftColumnTitle` / `rightColumnTitle` (optionnels), `leftItems` / `rightItems` (≥ 2 chacune `{ "question", "answerMarkdown" }`)

**CreatorSpotlight** : `sectionTitle`, `name`, `roleLabel`, `bodyMarkdown`, `imageUrl` / `imageAlt` (optionnels), `ctaLabel` / `ctaHref` (optionnels)

**CreatorQuoteBand** : `quoteMarkdown`, `name`, `roleLine`

**RelatedDecksGrid** : `sectionTitle`, `introMarkdown` (optionnel), `decks` (2 à 4 `{ "deckName", "tagline", "bodyMarkdown", "href", "ctaLabel?" }`)

**RelatedDecksInline** : `sectionTitle`, `introMarkdown` (optionnel), `items` (≥ 2 `{ "label", "descriptionMarkdown", "href" }`)

**CtaMarqueeRibbon** : `eyebrow`, `headline`, `subline`, `ctaLabel`, `ctaHref`, `marqueeText`

**CtaSplitAction** : `title`, `bodyMarkdown`, `primaryLabel`, `primaryHref`, `secondaryLabel` (optionnel), `secondaryHref` (optionnel)

---

Remplis `variant` et `props` conformément à la carte des variantes pour **{{LANDING_SLUG}}**.  
**Obligatoire :** pour chaque objet dans `sections`, le champ `variant` doit être **exactement identique** à la valeur correspondante dans le JSON « Variantes imposées » ci-dessus (même chaîne, caractère pour caractère). Réponds **uniquement** avec le JSON.
