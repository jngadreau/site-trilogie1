# IdentityMinimal

## Rôle et intention

Variante **ultra légère** de l’identité : peu de mots, **beaucoup d’air**, effet manifeste ou ligne éditoriale forte. Utile quand le hero est déjà très chargé ou quand on veut un **rythme** minimaliste.

## Description visuelle détaillée

- **Disposition** : contenu **centré**, largeur de lecture limitée (~36rem), beaucoup de **marge verticale** au-dessus et en dessous.
- **Eyebrow** : toute petite ligne au-dessus du titre (catégorie, série, type de produit), couleur **`textMuted`**, espacement des lettres léger.
- **Titre** : `fontHeading`, taille importante mais **moins massif** qu’un hero full screen ; une seule idée.
- **One-liner** : un paragraphe ou phrase unique, souvent en **`textMuted`** ou poids normal ; le **gras** Markdown possible sur 1–2 mots pour l’emphase.
- **Aucun encadré** : pas de carte `surface` — le fond est **`globals.background`** nu.

## Données attendues

| Champ | Type | Obligatoire | Notes |
| --- | --- | --- | --- |
| `eyebrow` | string | oui | Ligne fine au-dessus du titre |
| `title` | string | oui | Titre principal |
| `oneLiner` | string | oui | Phrase unique (Markdown léger possible) |

## Assets

- **Aucune image** ; toute la présence vient du **rythme** et de la **typographie** (polices `globals`).

## Slots médias (pipeline Imagine)

**Aucun.** `"media": []`.

## Contraintes éditoriales et ton

- **`oneLiner`** : une seule **période** ou deux très courtes ; pas de liste ; éviter les répétitions du titre.
- **`eyebrow`** : format court, souvent avec un **séparateur** typographique (·) si plusieurs mots-clés (ex. « Oracle · introspection »).
- Ton : **précis**, presque **haïku** commercial ; chaque mot doit justifier sa place.

## Consignes pour l’IA (génération)

- Extraire **une seule proposition de valeur** du contexte deck pour `oneLiner` ; si plusieurs idées concurrent, les **fusionner** ou choisir la plus différenciante.
- Vérifier la **cohérence** avec le hero : si le hero nomme déjà le jeu, le `title` ici peut être une **variation** (sous-angle) ou la **même** ligne officielle selon le brief — éviter trois titres identiques sur la page (ajuster avec le reste du JSON).
- Adapter la **densité** des mots au contraste de la page : fond sombre → phrases un peu plus **aérées** ; fond clair → même discipline pour ne pas alourdir.
