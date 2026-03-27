## Contexte jeu synthétisé (prioritaire — base ton ton, faits et niveau de détail)

{{GAME_CONTEXT}}

## Extrait livret brut (complément si la synthèse est légère — ne pas recopier tel quel sur le site)

{{BOOKLET_EXCERPT}}

## Méta export cartes (JSON)

{{GAME_META_JSON}}

## Trilogie (rappel court)

{{TRILOGY_CONTEXT}}

---

## Schéma JSON exact à produire

Renvoie **uniquement** ce JSON (types stricts, pas de clés en trop) :

```json
{
  "version": 1,
  "meta": {
    "title": "string",
    "description": "string ~155 caractères pour meta SEO"
  },
  "theme": {
    "accent": "#hex",
    "background": "#hex",
    "surface": "#hex",
    "text": "#hex",
    "fontHeading": "string",
    "fontBody": "string"
  },
  "sections": [
    {
      "id": "hero",
      "kind": "hero",
      "title": "string",
      "subtitle": "string",
      "bodyMarkdown": "string (1–3 paragraphes)",
      "cta": { "label": "string", "href": "https://..." }
    },
    {
      "id": "pour-qui",
      "kind": "text",
      "title": "string",
      "bodyMarkdown": "string"
    },
    {
      "id": "cartes",
      "kind": "cards",
      "title": "string",
      "bodyMarkdown": "string (intro courte au jeu de cartes)"
    },
    {
      "id": "cta-fin",
      "kind": "cta",
      "title": "string",
      "bodyMarkdown": "string optionnel",
      "cta": { "label": "string", "href": "https://..." }
    }
  ],
  "cardStrip": {
    "title": "string",
    "captionMarkdown": "string",
    "maxCards": 6
  },
  "htmlShell": "string (HTML5 échappé dans JSON — utiliser \\n pour les retours ligne)",
  "cssBase": "string (CSS complet échappé dans JSON)",
  "imagePrompts": {
    "heroBanner": "string (brief EN ou FR pour génération image bannière)",
    "cardFan": "string (brief pour composition éventail)"
  }
}
```

Les champs `htmlShell` et `cssBase` doivent être **cohérents** avec `theme` et `sections` (même titres pour les zones commentées).
