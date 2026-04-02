## Contexte deck (extrait)

{{DECK_CONTEXT}}

---

## Landings existantes (à différencier)

Ne reproduis **pas** la même combinaison de **quatorze** variantes (toutes sections) que l’une ou l’autre :

```json
{{EXISTING_VARIANTS_A_B_JSON}}
```

---

## Specs des variantes possibles (Markdown)

Chaque bloc décrit **rôle visuel, données attendues, consignes pour l’IA**. Utilise-les pour choisir une combinaison **cohérente** pour la landing **`{{LANDING_SLUG}}`**.

{{SECTION_SPECS_BUNDLE}}

---

## Choix autorisés par section (noms exacts)

| Section | Variantes possibles |
|---------|---------------------|
| `hero` | `HeroSplitImageRight`, `HeroFullBleed`, `HeroGlowVault`, `HeroParallaxLayers`, `HeroCardsFan`, `HeroCardsStrip`, `HeroCardsMosaic` |
| `deck_identity` | `IdentityPanel`, `IdentityMinimal`, `IdentityPanelFramed`, `IdentityPanelStory`, `IdentityMinimalCalm`, `IdentityMinimalEditorial` |
| `for_who` | `ForWhoTwoColumns`, `ForWhoPillars`, `ForWhoTwoColumnsGuide`, `ForWhoTwoColumnsStory`, `ForWhoPillarsInsight`, `ForWhoPillarsCompass` |
| `outcomes` | `OutcomesBentoGrid`, `OutcomesSignalStrip`, `OutcomesBentoGridAura`, `OutcomesBentoGridFocus`, `OutcomesSignalStripFlow`, `OutcomesSignalStripCalm` |
| `how_to_use` | `HowToNumbered`, `HowToTimeline`, `HowToNumberedQuickstart`, `HowToNumberedRitual`, `HowToTimelineFlow`, `HowToTimelineCompass` |
| `in_the_box` | `IncludedChecklist`, `IncludedHighlightGrid`, `IncludedChecklistEssentials`, `IncludedChecklistPremium`, `IncludedHighlightGridTiles`, `IncludedHighlightGridShowcase` |
| `card_gallery` | `CardGalleryGrid`, `CardGalleryScroll`, `CardGalleryGridCurated`, `CardGalleryGridDense`, `CardGalleryScrollSnap`, `CardGalleryScrollMomentum` |
| `photo_gallery` | `PhotoSpotlightGrid`, `PhotoFilmstripRow`, `PhotoCinematicCollage`, `PhotoMasonryCascade`, `PhotoSpotlightGridEditorial`, `PhotoFilmstripRowStory`, `PhotoCinematicCollageNarrative`, `PhotoMasonryCascadeAmbient` |
| `faq` | `FaqAccordion`, `FaqTwoColumn`, `FaqAccordionCalm`, `FaqAccordionDeep`, `FaqTwoColumnGuide`, `FaqTwoColumnBalanced` |
| `creator` | `CreatorSpotlight`, `CreatorQuoteBand`, `CreatorSpotlightNarrative`, `CreatorSpotlightPortrait`, `CreatorQuoteBandManifesto`, `CreatorQuoteBandSignature` |
| `testimonials` | `TestimonialStrip`, `TestimonialSpotlight`, `TestimonialStripVoices`, `TestimonialStripMomentum`, `TestimonialSpotlightHuman`, `TestimonialSpotlightImmersive` |
| `newsletter_cta` | `NewsletterInline`, `NewsletterSplit`, `NewsletterInlineCalm`, `NewsletterInlinePulse`, `NewsletterSplitEditorial`, `NewsletterSplitMinimal` |
| `related_decks` | `RelatedDecksGrid`, `RelatedDecksInline`, `RelatedDecksGridShowcase`, `RelatedDecksGridCurated`, `RelatedDecksInlineJourney`, `RelatedDecksInlineSimple` |
| `cta_band` | `CtaMarqueeRibbon`, `CtaSplitAction`, `CtaMarqueeRibbonGlow`, `CtaMarqueeRibbonCalm`, `CtaSplitActionFocus`, `CtaSplitActionDual` |

---

## JSON à renvoyer (uniquement ceci)

```json
{
  "version": 1,
  "slug": "{{LANDING_SLUG}}",
  "variants": {
    "hero": "…",
    "deck_identity": "…",
    "for_who": "…",
    "outcomes": "…",
    "how_to_use": "…",
    "in_the_box": "…",
    "card_gallery": "…",
    "photo_gallery": "…",
    "faq": "…",
    "creator": "…",
    "testimonials": "…",
    "newsletter_cta": "…",
    "related_decks": "…",
    "cta_band": "…"
  },
  "rationaleMarkdown": "…"
}
```

Rédige `rationaleMarkdown` en **français** (plusieurs paragraphes si besoin). Réponds **uniquement** avec le JSON.
