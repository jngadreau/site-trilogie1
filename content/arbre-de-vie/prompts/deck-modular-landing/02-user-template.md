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

**Ordre des sections (obligatoire)** : `hero` → `deck_identity` → `for_who` → `outcomes` → `how_to_use` → `in_the_box` → `card_gallery` → `photo_gallery` → `faq` → `creator` → `testimonials` → `newsletter_cta` → `related_decks` → `cta_band`.

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
      "variant": "IdentityPanel OU IdentityMinimal OU IdentityPanelFramed OU IdentityPanelStory OU IdentityMinimalCalm OU IdentityMinimalEditorial",
      "props": {},
      "media": []
    },
    {
      "id": "for_who",
      "variant": "ForWhoTwoColumns OU ForWhoPillars OU ForWhoTwoColumnsGuide OU ForWhoTwoColumnsStory OU ForWhoPillarsInsight OU ForWhoPillarsCompass",
      "props": {},
      "media": []
    },
    {
      "id": "outcomes",
      "variant": "OutcomesBentoGrid OU OutcomesSignalStrip OU OutcomesBentoGridAura OU OutcomesBentoGridFocus OU OutcomesSignalStripFlow OU OutcomesSignalStripCalm",
      "props": {},
      "media": []
    },
    {
      "id": "how_to_use",
      "variant": "HowToNumbered OU HowToTimeline OU HowToNumberedQuickstart OU HowToNumberedRitual OU HowToTimelineFlow OU HowToTimelineCompass",
      "props": {},
      "media": []
    },
    {
      "id": "in_the_box",
      "variant": "IncludedChecklist OU IncludedHighlightGrid OU IncludedChecklistEssentials OU IncludedChecklistPremium OU IncludedHighlightGridTiles OU IncludedHighlightGridShowcase",
      "props": {},
      "media": []
    },
    {
      "id": "card_gallery",
      "variant": "CardGalleryGrid OU CardGalleryScroll OU CardGalleryGridCurated OU CardGalleryGridDense OU CardGalleryScrollSnap OU CardGalleryScrollMomentum",
      "props": {},
      "media": []
    },
    {
      "id": "photo_gallery",
      "variant": "PhotoSpotlightGrid OU PhotoFilmstripRow OU PhotoCinematicCollage OU PhotoMasonryCascade OU PhotoSpotlightGridEditorial OU PhotoFilmstripRowStory OU PhotoCinematicCollageNarrative OU PhotoMasonryCascadeAmbient",
      "props": {},
      "media": []
    },
    {
      "id": "faq",
      "variant": "FaqAccordion OU FaqTwoColumn OU FaqAccordionCalm OU FaqAccordionDeep OU FaqTwoColumnGuide OU FaqTwoColumnBalanced",
      "props": {},
      "media": []
    },
    {
      "id": "creator",
      "variant": "CreatorSpotlight OU CreatorQuoteBand OU CreatorSpotlightNarrative OU CreatorSpotlightPortrait OU CreatorQuoteBandManifesto OU CreatorQuoteBandSignature",
      "props": {},
      "media": []
    },
    {
      "id": "testimonials",
      "variant": "TestimonialStrip OU TestimonialSpotlight OU TestimonialStripVoices OU TestimonialStripMomentum OU TestimonialSpotlightHuman OU TestimonialSpotlightImmersive",
      "props": {},
      "media": []
    },
    {
      "id": "newsletter_cta",
      "variant": "NewsletterInline OU NewsletterSplit OU NewsletterInlineCalm OU NewsletterInlinePulse OU NewsletterSplitEditorial OU NewsletterSplitMinimal",
      "props": {},
      "media": []
    },
    {
      "id": "related_decks",
      "variant": "RelatedDecksGrid OU RelatedDecksInline OU RelatedDecksGridShowcase OU RelatedDecksGridCurated OU RelatedDecksInlineJourney OU RelatedDecksInlineSimple",
      "props": {},
      "media": []
    },
    {
      "id": "cta_band",
      "variant": "CtaMarqueeRibbon OU CtaSplitAction OU CtaMarqueeRibbonGlow OU CtaMarqueeRibbonCalm OU CtaSplitActionFocus OU CtaSplitActionDual",
      "props": {},
      "media": []
    }
  ]
}
```

Chaque section doit inclure **`media`** : tableau d’objets slots (voir specs `.spec.md` « Slots médias ») ou `[]` si aucune image. Pour **`HeroCardsFan`**, **`HeroCardsStrip`**, **`HeroCardsMosaic`**, **`CardGalleryGrid`**, **`CardGalleryScroll`**, **`PhotoSpotlightGrid`**, **`PhotoFilmstripRow`**, **`PhotoCinematicCollage`**, **`PhotoMasonryCascade`**, **`TestimonialStrip`**, **`NewsletterInline`**, **`NewsletterSplit`** : `media` = **`[]`** (images dans `cards[]`, `photos[]`, `items[]`, `quotes[]` ou portrait optionnel `TestimonialSpotlight` selon la variante).

### Props par variant (obligatoires)

**HeroSplitImageRight** : `title`, `subtitle`, `bodyMarkdown`, `ctaLabel`, `ctaHref`, `imageUrl`, `imageAlt`

**HeroFullBleed** : `title`, `tagline`, `bodyMarkdown`, `ctaLabel`, `ctaHref`, `imageUrl`, `imageAlt`, `overlayOpacity` (nombre 0.35–0.65)

**HeroGlowVault** : `kicker`, `title`, `bodyMarkdown`, `ctaLabel`, `ctaHref`, `imageUrl`, `imageAlt`, `glowIntensity` (0.35–0.95)

**HeroParallaxLayers** : `eyebrow`, `title`, `strapline`, `bodyMarkdown`, `ctaLabel`, `ctaHref`, `imageUrl`, `imageAlt`, `spineLabel` (optionnel)

**HeroCardsFan** : `title`, `kicker`, `bodyMarkdown`, `ctaLabel`, `ctaHref`, `cards` (tableau **3 à 7** objets `{ "imageUrl", "alt", "caption?" }` — `imageUrl` = **`/ai/generated-images/deck-cards/<fichier.png>`**)

**HeroCardsStrip** : `title`, `subtitle`, `bodyMarkdown`, `ctaLabel`, `ctaHref`, `cards` (**4 à 9** mêmes objets)

**HeroCardsMosaic** : `title`, `tagline`, `bodyMarkdown`, `ctaLabel`, `ctaHref`, `cards` (**4 à 6** mêmes objets)

**IdentityPanel** / **IdentityPanelFramed** / **IdentityPanelStory** : `deckName`, `tagline`, `bodyMarkdown`, `badge` (optionnel)

**IdentityMinimal** / **IdentityMinimalCalm** / **IdentityMinimalEditorial** : `eyebrow`, `title`, `oneLiner`

**ForWhoTwoColumns** / **ForWhoTwoColumnsGuide** / **ForWhoTwoColumnsStory** : `title`, `leftMarkdown`, `rightMarkdown`

**ForWhoPillars** / **ForWhoPillarsInsight** / **ForWhoPillarsCompass** : `title`, `introMarkdown`, `pillars` (tableau `{ "title", "bodyMarkdown" }`, au moins 3)

**OutcomesBentoGrid** / **OutcomesBentoGridAura** / **OutcomesBentoGridFocus** : `sectionTitle`, `introMarkdown`, `cells` (≥ 4 `{ "title", "bodyMarkdown", "span"? }` avec `span` ∈ `wide` | `tall` | `featured`, au moins une `featured`)

**OutcomesSignalStrip** / **OutcomesSignalStripFlow** / **OutcomesSignalStripCalm** : `sectionTitle`, `introMarkdown`, `signals` (≥ 3 `{ "label", "detailMarkdown" }`)

**HowToNumbered** / **HowToNumberedQuickstart** / **HowToNumberedRitual** : `title`, `introMarkdown` (optionnel), `steps` (≥ 3 `{ "title", "bodyMarkdown" }`)

**HowToTimeline** / **HowToTimelineFlow** / **HowToTimelineCompass** : `title`, `introMarkdown`, `steps` (≥ 3 `{ "label", "detailMarkdown" }`)

**IncludedChecklist** / **IncludedChecklistEssentials** / **IncludedChecklistPremium** : `sectionTitle`, `introMarkdown` (optionnel), `items` (≥ 3 `{ "title", "detailMarkdown?" }`)

**IncludedHighlightGrid** / **IncludedHighlightGridTiles** / **IncludedHighlightGridShowcase** : `sectionTitle`, `introMarkdown` (optionnel), `highlights` (2 à 6 `{ "title", "bodyMarkdown" }`)

**CardGalleryGrid** / **CardGalleryGridCurated** / **CardGalleryGridDense** : `sectionTitle`, `introMarkdown` (optionnel). **Cartes à afficher** (une seule source, par priorité) : **`cards`** (liste complète d’URLs) **ou** **`cardSlots`** (6 à 12 `{ "cardNumber", "captionMarkdown?", "alt?" }` → `card_{n}_front.png`) **ou** **`cardNumbers`** (tableau de numéros). Optionnel : **`deckCardsBasePath`** (défaut `/ai/generated-images/deck-cards`). Ratio d’affichage **marque-page ~672×1877**.

**CardGalleryScroll** / **CardGalleryScrollSnap** / **CardGalleryScrollMomentum** : idem, privilégier **`cardNumbers`** ou **`cardSlots`** (8 à 14 entrées) ; `cards` si besoin d’URLs custom.

**PhotoSpotlightGrid** / **PhotoSpotlightGridEditorial** : `sectionTitle`, `introMarkdown` (optionnel), `photos` (2 à 6 `{ "imageUrl", "alt", "title?", "captionMarkdown?" }` — URLs sous `/ai/generated-images/…`)

**PhotoFilmstripRow** / **PhotoFilmstripRowStory** : `sectionTitle`, `introMarkdown` (optionnel), `items` (3 à 5 `{ "imageUrl", "alt", "label?" }`)

**PhotoCinematicCollage** / **PhotoCinematicCollageNarrative** : `sectionTitle`, `introMarkdown` (optionnel), `headline` (optionnel), `bodyMarkdown` (optionnel), `ctaLabel` / `ctaHref` (optionnels), `photos` (2 à 6 `{ "imageUrl", "alt?" | "imageAlt?", "title?", "captionMarkdown?" }` ; 1 photo lead + vignettes)

**PhotoMasonryCascade** / **PhotoMasonryCascadeAmbient** : `sectionTitle`, `introMarkdown` (optionnel), `photos` (2 à 8 `{ "imageUrl", "alt?" | "imageAlt?", "title?", "captionMarkdown?" }`)

**FaqAccordion** / **FaqAccordionCalm** / **FaqAccordionDeep** : `sectionTitle`, `introMarkdown` (optionnel), `items` (≥ 3 `{ "question", "answerMarkdown" }`)

**FaqTwoColumn** / **FaqTwoColumnGuide** / **FaqTwoColumnBalanced** : `sectionTitle`, `introMarkdown` (optionnel), `leftColumnTitle` / `rightColumnTitle` (optionnels), `leftItems` / `rightItems` (≥ 2 chacune `{ "question", "answerMarkdown" }`)

**CreatorSpotlight** / **CreatorSpotlightNarrative** / **CreatorSpotlightPortrait** : `sectionTitle`, `name`, `roleLabel`, `bodyMarkdown`, `imageUrl` / `imageAlt` (optionnels), `ctaLabel` / `ctaHref` (optionnels)

**CreatorQuoteBand** / **CreatorQuoteBandManifesto** / **CreatorQuoteBandSignature** : `quoteMarkdown`, `name`, `roleLine`

**TestimonialStrip** / **TestimonialStripVoices** / **TestimonialStripMomentum** : `sectionTitle`, `introMarkdown` (optionnel), `quotes` (2 à 5 `{ "quoteMarkdown", "name?", "role?" }`)

**TestimonialSpotlight** / **TestimonialSpotlightHuman** / **TestimonialSpotlightImmersive** : `sectionTitle`, `introMarkdown` (optionnel), `quoteMarkdown`, `name`, `roleLine` (optionnel), `imageUrl` / `imageAlt` (optionnels)

**NewsletterInline** / **NewsletterInlineCalm** / **NewsletterInlinePulse** : `sectionTitle`, `bodyMarkdown`, `fieldLabel` (optionnel), `buttonLabel`, `footnoteMarkdown` (optionnel)

**NewsletterSplit** / **NewsletterSplitEditorial** / **NewsletterSplitMinimal** : `sectionTitle`, `leadMarkdown`, `fieldLabel` (optionnel), `buttonLabel`, `asideMarkdown` (optionnel)

**RelatedDecksGrid** / **RelatedDecksGridShowcase** / **RelatedDecksGridCurated** : `sectionTitle`, `introMarkdown` (optionnel), `decks` (2 à 4 `{ "deckName", "tagline", "bodyMarkdown", "href", "ctaLabel?" }`)

**RelatedDecksInline** / **RelatedDecksInlineJourney** / **RelatedDecksInlineSimple** : `sectionTitle`, `introMarkdown` (optionnel), `items` (≥ 2 `{ "label", "descriptionMarkdown", "href" }`)

**CtaMarqueeRibbon** / **CtaMarqueeRibbonGlow** / **CtaMarqueeRibbonCalm** : `eyebrow`, `headline`, `subline`, `ctaLabel`, `ctaHref`, `marqueeText`

**CtaSplitAction** / **CtaSplitActionFocus** / **CtaSplitActionDual** : `title`, `bodyMarkdown`, `primaryLabel`, `primaryHref`, `secondaryLabel` (optionnel), `secondaryHref` (optionnel)

---

Remplis `variant` et `props` conformément à la carte des variantes pour **{{LANDING_SLUG}}**.  
**Obligatoire :** pour chaque objet dans `sections`, le champ `variant` doit être **exactement identique** à la valeur correspondante dans le JSON « Variantes imposées » ci-dessus (même chaîne, caractère pour caractère). Réponds **uniquement** avec le JSON.
