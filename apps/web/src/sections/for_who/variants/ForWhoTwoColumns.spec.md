# ForWhoTwoColumns

## Rôle et intention

Répondre à **« pour qui ? »** avec une lecture **scannable** : deux listes ou deux angles en parallèle (ex. profils / besoins, débutant·e vs accompagnant·e, solo vs groupe).

## Description visuelle détaillée

- **Titre de section** : `fontHeading`, style aligné sur les autres `h2` de la page.
- **Grille** : **deux colonnes** égales sur desktop ; **empilement** en une colonne sur mobile (ordre : gauche puis droite).
- **Contenu** : chaque colonne est du **Markdown** (souvent **listes à puces** ou paragraphes courts) ; pas de cartes séparées par défaut — le fond est celui de la page.
- **Espacement** : gouttière confortable entre les colonnes pour éviter l’effet « mur de texte ».

## Données attendues

| Champ | Type | Obligatoire | Notes |
| --- | --- | --- | --- |
| `title` | string | oui | Titre de section |
| `leftMarkdown` | string (Markdown) | oui | Colonne gauche (souvent listes) |
| `rightMarkdown` | string (Markdown) | oui | Colonne droite |

## Assets

- **Aucune image** requise.
- **Optionnel** : pictogrammes futurs — non gérés par le composant actuel ; ne pas les inventer en JSON.

## Contraintes éditoriales et ton

- Viser **symétrie de longueur** entre les deux colonnes (±20 %) pour un rendu équilibré.
- Formulations **inclusives** et **concrètes** (« tu », « vous » selon le ton du deck dans le contexte).
- Chaque puce : une **idée** ; éviter les redites entre colonnes (gauche = profil A, droite = profil B, ou besoin / réponse).

## Consignes pour l’IA (génération)

- S’appuyer sur les **personas** ou publics décrits dans le contexte deck ; si absents, **déduire** prudemment à partir du livret et des cartes sans caricature.
- Donner à **`leftMarkdown`** et **`rightMarkdown`** un **rôle distinct** explicite dans les sources utilisateur (ex. colonne 1 = « tu es… », colonne 2 = « tu cherches… ») — le modèle doit le refléter dans les titres implicites des listes ou en première ligne.
- Garder le **même registre** que `globals` + hero (poétique vs direct).
- Longueur cible : **4–8 puces** au total réparties (pas 15 lignes).
