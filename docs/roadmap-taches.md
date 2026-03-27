# Roadmap — site-trilogie1

Document de suivi des tâches (mis à jour au fil des itérations). Les cases `[x]` indiquent ce qui est en place dans le dépôt à la dernière révision de ce fichier.

---

## Court terme — prototype « L’Arbre de Vie »

| Statut | Tâche |
|--------|--------|
| [x] | API NestJS : Grok chat → Markdown, Grok Imagine → PNG, BullMQ async, lecture fichiers générés |
| [x] | Preview Vite : onglets Textes / Images, proxy vers API |
| [x] | **Manifeste** `content/arbre-de-vie/site.manifest.json` (titres, hero image + MD, CTA, meta) |
| [x] | **GET `/site/manifest`** pour le preview / futur front |
| [x] | **Vue Accueil** dans le preview (landing = hero + bloc texte depuis le manifeste) |
| [x] | **Prompts / recettes** — amorce : `content/arbre-de-vie/prompts/` (README + `hero-instruction.example.txt`) ; affiner au fil des générations |
| [ ] | **Import livret** : script ou endpoint qui injecte un extrait de `oseunpasverstoi-jeux1/Arbre de vie/booklet/` comme `contextMarkdown` |
| [ ] | Affiner la landing (typo, second bloc, footer minimal) |

---

## Moyen terme — trilogie & front définitif

| Statut | Tâche |
|--------|--------|
| [ ] | Dupliquer le modèle manifeste + preview pour **Ganesh** et **Voix chamaniques** |
| [ ] | Page **groupe / trilogie** (copy + liens + pack) |
| [ ] | **`apps/web`** React + TS + build statique, aligné sur les manifestes |
| [ ] | **Plateforme Creaticards** : Nest, Mongo, BullMQ, Grok, Keycloak, S3, historique versions (voir [projet-sites-jeux-cartes.md](./projet-sites-jeux-cartes.md)) |

---

## Transversal

| Statut | Tâche |
|--------|--------|
| [ ] | **RGPD** : CMP, politique de confidentialité, choix analytics |
| [ ] | **CI** : lint + build `apps/api`, `apps/preview`, futur `apps/web` |

---

## Références

- Vision produit : [projet-sites-jeux-cartes.md](./projet-sites-jeux-cartes.md)
- Processus prototype : [processus-prototype-arbre-de-vie.md](./processus-prototype-arbre-de-vie.md)
- Référence serveur G Nova : [reference-gnova-cv-app-server.md](./reference-gnova-cv-app-server.md)

---

*Dernière mise à jour : mars 2026.*
