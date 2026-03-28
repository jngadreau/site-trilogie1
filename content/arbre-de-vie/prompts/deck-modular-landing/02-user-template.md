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

## Schéma JSON exact à produire

Renvoie **uniquement** cet objet (types indicatifs ; adapte le contenu au deck) :

```json
{
  "version": 1,
  "slug": "{{LANDING_SLUG}}",
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
      "variant": "HeroSplitImageRight OU HeroFullBleed selon carte",
      "props": {}
    },
    {
      "id": "deck_identity",
      "variant": "IdentityPanel OU IdentityMinimal",
      "props": {}
    },
    {
      "id": "for_who",
      "variant": "ForWhoTwoColumns OU ForWhoPillars",
      "props": {}
    },
    {
      "id": "how_to_use",
      "variant": "HowToNumbered OU HowToTimeline",
      "props": {}
    }
  ]
}
```

### Props par variant (obligatoires)

**HeroSplitImageRight** : `title`, `subtitle`, `bodyMarkdown`, `ctaLabel`, `ctaHref`, `imageUrl`, `imageAlt`

**HeroFullBleed** : `title`, `tagline`, `bodyMarkdown`, `ctaLabel`, `ctaHref`, `imageUrl`, `imageAlt`, `overlayOpacity` (nombre 0.35–0.65)

**IdentityPanel** : `deckName`, `tagline`, `bodyMarkdown`, `badge` (court texte optionnel)

**IdentityMinimal** : `eyebrow`, `title`, `oneLiner`

**ForWhoTwoColumns** : `title`, `leftMarkdown`, `rightMarkdown`

**ForWhoPillars** : `title`, `introMarkdown`, `pillars` (tableau de `{ "title", "bodyMarkdown" }`, au moins 3)

**HowToNumbered** : `title`, `introMarkdown` (optionnel string), `steps` (tableau `{ "title", "bodyMarkdown" }`, au moins 3)

**HowToTimeline** : `title`, `introMarkdown`, `steps` (tableau `{ "label", "detailMarkdown" }`, au moins 3)

---

Remplis `variant` et `props` conformément à la carte des variantes pour **{{LANDING_SLUG}}**. Réponds **uniquement** avec le JSON.
