## Contexte deck (extrait)

{{DECK_CONTEXT}}

---

## Section à remplir

- **id** : `{{SECTION_ID}}`
- **variante React** : `{{SECTION_VARIANT}}` (nom exact, ne pas changer)

## Globals de la page (cohérence obligatoire)

```json
{{GLOBALS_JSON}}
```

---

## Spec auteur de cette variante (Markdown)

{{SECTION_SPEC_MD}}

---

## Schéma JSON à renvoyer (uniquement ceci)

Remplis `props` selon la variante (champs obligatoires listés dans la spec).  
Remplis `media` selon la section **Slots médias** de la spec : tableau d’objets pour chaque image à prévoir, ou `[]` si aucun slot.

Chaque entrée `media` doit permettre, **sans autre contexte**, de construire le prompt Imagine :

| Champ | Rôle |
|--------|------|
| `slotId` | Identifiant stable (ex. `hero`) |
| `aspectRatio` | `16:9`, `4:3`, `1:1`, … |
| `sceneDescription` | Cœur du futur prompt : qui/quoi/où, lumière, cadrage |
| `mood` | Ambiance |
| `styleVisual` | Style pictural |
| `colorContext` | Lien avec la palette `globals` |
| `constraints` | Ex. pas de texte dans l’image |
| `altHintFr` | Piste pour `imageAlt` côté props |

```json
{
  "props": {},
  "media": []
}
```

**Hero** : si `media` contient `slotId` `hero`, mets aussi dans `props` des champs cohérents (`title`, `imageAlt` aligné sur `altHintFr`, etc.) et `imageUrl` temporaire `/ai/generated-images/banner-1.png` si besoin.

Réponds **uniquement** avec le JSON.
