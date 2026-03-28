# ForWhoPillars

## Rôle et intention

Présenter le **public ou les cas d’usage** sous forme de **piliers** : cartes ou blocs égaux (3+), chacun avec un titre court et un texte — effet « trois façons d’entrer », « trois profils », etc.

## Description visuelle détaillée

- **Titre + intro** : `title` en `fontHeading` ; `introMarkdown` au-dessus ou sous le titre selon implémentation (ici : intro sous le titre), couleur possible **`textMuted`** pour l’intro.
- **Grille de piliers** : cartes sur **`surface`**, bordure légère, **coins arrondis**, padding uniforme ; disposition **responsive** (1 col → 2–3 colonnes selon largeur).
- **Par pilier** : `title` en sous-titre (`fontHeading` ou gras) ; corps en Markdown en dessous.
- **Rythme** : hauteur des cartes peut varier légèrement ; éviter un pilier 3× plus long que les autres.

## Données attendues

| Champ | Type | Obligatoire | Notes |
| --- | --- | --- | --- |
| `title` | string | oui | Titre de section |
| `introMarkdown` | string (Markdown) | oui | Introduction courte |
| `pillars` | array | oui | ≥ 3 objets `{ "title", "bodyMarkdown" }` |

## Assets

- **Aucune image** dans le schéma actuel.
- **Évolution possible** : champ `icon` (nom d’icône ou URL) — si non présent dans le schéma validé, **ne pas générer** d’icônes.

## Slots médias (pipeline Imagine)

**Aucun** pour l’instant. `"media": []`. (Si des icônes PNG sont ajoutées plus tard, définir ici de nouveaux `slotId` et les brancher côté API.)

## Contraintes éditoriales et ton

- **Minimum 3 piliers** ; 4 acceptables si le contexte le justifie ; au-delà, préférer une autre variante ou fusionner.
- Titres de piliers : **3–6 mots**, parallélisme syntaxique souhaité (ex. tous des noms de mode, ou tous des « Pour… »).
- `introMarkdown` : **2–3 phrases** qui annoncent la logique des piliers (pas un copier-coller du hero).

## Consignes pour l’IA (génération)

- Dériver les piliers des **sections usage / public** du contexte deck ; si une liste existe déjà dans les sources, la **restructurer** sans la diluer.
- Équilibrer **`bodyMarkdown`** de chaque pilier (longueur comparable).
- Cohérence avec la **landing** : si `ForWhoTwoColumns` n’est pas utilisée sur la même page, cette variante peut être plus riche ; sinon éviter la **redondance** mot à mot avec d’autres sections.
- Vocabulaire aligné sur le **niveau** du jeu (débutant vs praticien·ne) tel que décrit dans le contexte.
