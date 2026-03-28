import * as path from 'path';

/**
 * Racine du workspace `card-sites-examples` (parent de `site-trilogie1`).
 * Cwd attendu : `apps/api`.
 */
export function getWorkspaceRoot(): string {
  const override = process.env.WORKSPACE_ROOT?.trim();
  if (override) {
    return path.isAbsolute(override) ? override : path.resolve(process.cwd(), override);
  }
  return path.resolve(process.cwd(), '..', '..', '..');
}

/**
 * Répertoire des fichiers générés pour l’Arbre de Vie (md, images).
 */
export function getContentGeneratedArbreDeVieDir(): string {
  const override = process.env.CONTENT_GENERATED_DIR?.trim();
  if (override) {
    return path.isAbsolute(override) ? override : path.resolve(process.cwd(), override);
  }
  return path.resolve(process.cwd(), '..', '..', 'content', 'generated', 'arbre-de-vie');
}

export function getGeneratedImagesDir(): string {
  return path.join(getContentGeneratedArbreDeVieDir(), 'images');
}

/**
 * Copie miroir des PNG/JPEG/WebP cartes (depuis `images-jeux/`) à côté des images Grok,
 * servies sous `/ai/generated-images/deck-cards/:filename`.
 */
export function getMirroredDeckCardImagesDir(): string {
  return path.join(getGeneratedImagesDir(), 'deck-cards');
}

/** Contenu éditorial versionné (manifeste, prompts) — pas les seuls fichiers générés. */
export function getSiteArbreDeVieContentDir(): string {
  return path.resolve(process.cwd(), '..', '..', 'content', 'arbre-de-vie');
}

export function getSiteManifestPath(): string {
  return path.join(getSiteArbreDeVieContentDir(), 'site.manifest.json');
}

export function getLandingSpecPath(): string {
  return path.join(getContentGeneratedArbreDeVieDir(), 'landing-spec.json');
}

export function getLandingPromptsDir(): string {
  return path.join(getSiteArbreDeVieContentDir(), 'prompts', 'landing');
}

/** Prompts Grok pour la synthèse `game-context.md` (étape 1). */
export function getGameContextPromptsDir(): string {
  return path.join(getLandingPromptsDir(), 'game-context');
}

/** Sortie : synthèse éditoriale réutilisable pour les appels landing sans repasser toutes les sources. */
export function getGameContextPath(): string {
  return path.join(getContentGeneratedArbreDeVieDir(), 'game-context.md');
}

/**
 * Dossier des `.md` par carte (descriptions). Défaut : jeu Arbre de Vie dans le workspace source.
 */
export function getGameCardsContextDir(): string {
  const override = process.env.GAME_CARDS_CONTEXT_DIR?.trim();
  if (override) {
    return path.isAbsolute(override) ? override : path.resolve(process.cwd(), override);
  }
  return path.join(
    getWorkspaceRoot(),
    'oseunpasverstoi-jeux1',
    'Arbre de vie',
    'contexts',
    'cards',
  );
}

/**
 * Dossier du livret (plusieurs `.md`). Défaut : `booklet/` du jeu Arbre de Vie.
 */
export function getGameBookletDir(): string {
  const override = process.env.GAME_BOOKLET_DIR?.trim();
  if (override) {
    return path.isAbsolute(override) ? override : path.resolve(process.cwd(), override);
  }
  return path.join(
    getWorkspaceRoot(),
    'oseunpasverstoi-jeux1',
    'Arbre de vie',
    'booklet',
  );
}

/** Livret : extrait par défaut pour la génération landing. */
export function getBookletDebutArbreDeViePath(): string {
  const override = process.env.BOOKLET_DEBUT_PATH?.trim();
  if (override) {
    return path.isAbsolute(override) ? override : path.resolve(process.cwd(), override);
  }
  return path.join(
    getWorkspaceRoot(),
    'oseunpasverstoi-jeux1',
    'Arbre de vie',
    'booklet',
    'debut.md',
  );
}

/** Images finales des cartes (PNG/JPG exportés). */
export function getCardImagesArbreDeVieDir(): string {
  const override = process.env.CARD_IMAGES_ARBRE_DE_VIE?.trim();
  if (override) {
    return path.isAbsolute(override) ? override : path.resolve(process.cwd(), override);
  }
  return path.join(getWorkspaceRoot(), 'images-jeux', 'arbre_de_vie');
}

export function getTrilogyContextPath(): string {
  return path.join(
    path.resolve(process.cwd(), '..', '..', 'content', 'shared'),
    'trilogy-context.md',
  );
}

export function getCardMetadataArbreDeViePath(): string {
  return path.join(getCardImagesArbreDeVieDir(), 'metadata.json');
}

/** Landings modulaires deck (JSON par slug, ex. arbre-de-vie-a). */
export function getDeckLandingsDir(): string {
  return path.join(getContentGeneratedArbreDeVieDir(), 'deck-landings');
}

export function getDeckModularLandingPromptsDir(): string {
  return path.join(getSiteArbreDeVieContentDir(), 'prompts', 'deck-modular-landing');
}

/** Choix des variantes React par landing (arbre-de-vie-a / arbre-de-vie-b). */
export function getDeckLandingVariantsPath(): string {
  return path.join(getSiteArbreDeVieContentDir(), 'deck-landing-variants.json');
}

/** Plans de variante (Grok) : choix des layouts + rationale. */
export function getDeckLandingPlansDir(): string {
  return path.join(getSiteArbreDeVieContentDir(), 'deck-landing-plans');
}

export function getDeckLandingPlanPath(slug: string): string {
  return path.join(getDeckLandingPlansDir(), `${slug}.json`);
}

/** Racine `apps/web/src/sections` (specs `.md` des variantes React). */
export function getWebAppSectionsDir(): string {
  return path.resolve(process.cwd(), '..', 'web', 'src', 'sections');
}
