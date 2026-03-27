# Documentation — Sites de présentation des jeux de cartes

Ce dossier rassemble la documentation du projet, mise à jour au fil des itérations.

| Document | Contenu |
|----------|---------|
| [projet-sites-jeux-cartes.md](./projet-sites-jeux-cartes.md) | Vision, groupe/trilogie, affichage carte & promo, conversion & stats, IA (historique, évolutions), stack front + **NestJS / Mongo / BullMQ / Grok / S3 / Keycloak**, RGPD & cookies |
| [processus-prototype-arbre-de-vie.md](./processus-prototype-arbre-de-vie.md) | **Court terme** : prototype **L’Arbre de Vie**, serveur IA (MD + images), preview sans React, références **gnova-cv-app** / **jng-fwk**, jalons J1–J6 |
| [reference-gnova-cv-app-server.md](./reference-gnova-cv-app-server.md) | Cartographie du **`server/`** G Nova : Grok (OpenAI SDK), BullMQ, workers, `fwk-server-core` |
| [roadmap-taches.md](./roadmap-taches.md) | **Suivi des tâches** — court / moyen terme, transversal |

## Sources des jeux (hors dépôt `site-trilogie1`)

Ce dépôt GitHub ne contient **pas** les carnets de données ni les exports d’images. En **développement local**, placez ce clone à côté des dossiers suivants (chemins relatifs depuis la racine du clone : `../`) :

- **Textes, livrets, données cartes** : `../oseunpasverstoi-jeux1/` (les dossiers `images` internes ne sont pas les visuels finaux des cartes).
- **Visuels finaux et métadonnées d’export** : `../images-jeux/` (ex. `ganesh/`, `arbre_de_vie/`, `voix_chamaniques/`, archives d’export).

Le document [projet-sites-jeux-cartes.md](./projet-sites-jeux-cartes.md) utilise des chemins logiques (`oseunpasverstoi-jeux1/`, `images-jeux/`) par rapport à un **workspace** qui regroupe ces dossiers et le clone de ce mono-dépôt. Les **contenus publiés** pour le web pourront être versionnés sous [`../content/`](../content/) après import ou génération.
