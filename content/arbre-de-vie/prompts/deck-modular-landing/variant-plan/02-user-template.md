## Contexte deck (extrait)

{{DECK_CONTEXT}}

---

## Landings existantes (à différencier)

Ne reproduis **pas** la même combinaison de **huit** variantes (toutes sections) que l’une ou l’autre :

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
| `deck_identity` | `IdentityPanel`, `IdentityMinimal` |
| `for_who` | `ForWhoTwoColumns`, `ForWhoPillars` |
| `outcomes` | `OutcomesBentoGrid`, `OutcomesSignalStrip` |
| `how_to_use` | `HowToNumbered`, `HowToTimeline` |
| `in_the_box` | `IncludedChecklist`, `IncludedHighlightGrid` |
| `faq` | `FaqAccordion`, `FaqTwoColumn` |
| `cta_band` | `CtaMarqueeRibbon`, `CtaSplitAction` |

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
    "faq": "…",
    "cta_band": "…"
  },
  "rationaleMarkdown": "…"
}
```

Rédige `rationaleMarkdown` en **français** (plusieurs paragraphes si besoin). Réponds **uniquement** avec le JSON.
