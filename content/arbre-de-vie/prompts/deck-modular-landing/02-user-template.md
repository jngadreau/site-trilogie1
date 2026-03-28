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

Renvoie **uniquement** cet objet (types indicatifs ; adapte le contenu au deck) :

```json
{
  "version": 1,
  "slug": "{{LANDING_SLUG}}",
  "imagePrompts": {
    "hero": "string optionnel — UN prompt en anglais, une phrase ou court paragraphe, pour Grok Imagine (bannière hero 16:9). Décrire scène, lumière, style ; pas de texte dans l’image. Si omis, l’API le synthétisera avant génération PNG."
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

Remplis `variant` et `props` conformément à la carte des variantes pour **{{LANDING_SLUG}}**.  
**Obligatoire :** pour chaque objet dans `sections`, le champ `variant` doit être **exactement identique** à la valeur correspondante dans le JSON « Variantes imposées » ci-dessus (même chaîne, caractère pour caractère). Réponds **uniquement** avec le JSON.
