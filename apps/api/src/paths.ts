import * as path from 'path';

/**
 * Répertoire des fichiers générés pour l’Arbre de Vie (md, images).
 * Cwd attendu : `apps/api` en dev (`npm run start:dev`).
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
