# content

Données publiques ou générées **pour le site** (textes validés, manifestes JSON/YAML, chemins d’assets web — pas les masters d’impression).

**Prototype Arbre de Vie** (voir [docs/processus-prototype-arbre-de-vie.md](../docs/processus-prototype-arbre-de-vie.md)) : prévoir par exemple `generated/` (sorties IA à relire) et un dossier figé type `arbre-de-vie/` pour ce qui alimente le preview.

L’import depuis les sources externes (`oseunpasverstoi-jeux1/`, `images-jeux/`) se fera par scripts ou pipeline ; la structure exacte sera définie avec l’app.

### Arbre de Vie (prototype)

- **`arbre-de-vie/site.manifest.json`** — assemble la landing (hero image + MD + CTA) ; servi par `GET /site/manifest`.
- **`arbre-de-vie/prompts/`** — recettes de prompts pour l’API ; voir le README dans ce dossier.
