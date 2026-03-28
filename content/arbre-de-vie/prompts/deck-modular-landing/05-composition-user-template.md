## Contexte deck (extrait)

{{DECK_CONTEXT}}

---

## Landing

**Slug** : `{{LANDING_SLUG}}`  
**Sections** (ordre fixe) : `hero` → `deck_identity` → `for_who` → `outcomes` → `how_to_use` → `in_the_box` → `faq` → `cta_band`  
**Variantes React imposées** (ne pas les modifier) :

```json
{{VARIANT_MAP_JSON}}
```

---

## Tâche

Produire **uniquement** les **paramètres globaux** de la page (couleurs, typo, rayons) et éventuellement un brief image hero en anglais.  
Les textes et médias par section seront générés **dans des jobs séparés**.

## JSON à renvoyer (seulement ceci)

```json
{
  "version": 1,
  "globals": {
    "accent": "#hex",
    "background": "#hex",
    "surface": "#hex",
    "text": "#hex",
    "textMuted": "#hex",
    "fontHeading": "string",
    "fontBody": "string",
    "radius": "12px",
    "fontImportNote": "optionnel",
    "fontImportHref": "optionnel — URL feuille Google Fonts si pertinent"
  },
  "imagePrompts": {
    "hero": "optionnel — court prompt ANGLAIS pour Imagine, si tu veux forcer une direction avant les slots média détaillés"
  }
}
```

Réponds **uniquement** avec le JSON.
