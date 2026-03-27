# site-trilogie1

**Mono-dépôt** pour tout ce qui concerne le projet **site de présentation de la trilogie** d’oracles (Ganesh, L’Arbre de Vie, Les Voix Chamaniques) : documentation, applications, paquets partagés, contenu publiable, outils.

## Structure (évolutive)

| Répertoire | Rôle |
|------------|------|
| [`docs/`](./docs/README.md) | Vision produit, stack, IA, RGPD, jalons. |
| [`apps/`](./apps/README.md) | Applications (ex. site vitrine React + TS). |
| [`packages/`](./packages/README.md) | Libs partagées (manifestes, UI, etc.). |
| [`content/`](./content/README.md) | Données et textes destinés au site (hors masters jeu). |

D’autres dossiers (`tools/`, `infra/`, …) pourront être ajoutés selon les besoins.

## Données des jeux (hors dépôt ou importées)

Les dépôts / dossiers **sources** (livrets, exports cartes haute définition) peuvent rester à part en local ; voir [`docs/README.md`](./docs/README.md) pour la disposition recommandée à côté du clone (`../oseunpasverstoi-jeux1/`, `../images-jeux/`). Ce qui est **publié sur le site** pourra vivre sous `content/` après curation.

## État actuel

- Arborescence mono-repo initialisée ; documentation de planification dans `docs/`.
