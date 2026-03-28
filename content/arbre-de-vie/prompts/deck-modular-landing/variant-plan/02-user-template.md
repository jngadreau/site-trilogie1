## Contexte deck (extrait)

{{DECK_CONTEXT}}

---

## Landings existantes (à différencier)

Ne reproduis **pas** la même combinaison de quatre variantes que l’une ou l’autre :

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
| `hero` | `HeroSplitImageRight`, `HeroFullBleed` |
| `deck_identity` | `IdentityPanel`, `IdentityMinimal` |
| `for_who` | `ForWhoTwoColumns`, `ForWhoPillars` |
| `how_to_use` | `HowToNumbered`, `HowToTimeline` |

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
    "how_to_use": "…"
  },
  "rationaleMarkdown": "…"
}
```

Rédige `rationaleMarkdown` en **français** (plusieurs paragraphes si besoin). Réponds **uniquement** avec le JSON.
