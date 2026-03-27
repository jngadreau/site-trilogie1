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
