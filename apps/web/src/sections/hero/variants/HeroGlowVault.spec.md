# HeroGlowVault

Hero **plein impact** : image immersive, **halos radiaux** dynamiques (couleur d’accent), carte **verre dépoli** (glassmorphism) pour le texte. Visuellement plus premium qu’un simple full-bleed.

## Props JSON (Grok)

| Champ | Type | Notes |
|-------|------|--------|
| `kicker` | string | Ligne courte au-dessus du titre (ton chaleureux / mystique). |
| `title` | string | H1, 2–6 mots, fort. |
| `bodyMarkdown` | string | 1–2 paragraphes Markdown. |
| `ctaLabel` | string | Verbe d’action. |
| `ctaHref` | string | `#` ou URL. |
| `imageUrl` | string | Placeholder `/images/...png` si pas encore généré. |
| `imageAlt` | string | FR, descriptif. |
| `glowIntensity` | number | **0.35–0.95** — plus haut = halo plus présent. |

## Slots médias

| `slotId` | Rôle | `aspectRatio` |
|----------|------|----------------|
| `hero` | Bannière pour Imagine | `20:9` ou `16:9` |

Champs slot habituels : `sceneDescription`, `mood`, `styleVisual`, `colorContext`, `constraints`, `altHintFr`.
