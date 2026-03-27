/** Métadonnées étendues pour `images-jeux/.../metadata.json` */

export interface PhysicalSizeMm {
  width: number;
  height: number;
}

export interface CardPixelSample {
  file: string;
  width: number;
  height: number;
}

export interface CardAspectRatioBlock {
  /** Taille réelle du produit (mm), largeur × hauteur (portrait). */
  physicalSizeMm: PhysicalSizeMm;
  /** largeur / hauteur à partir des mm. */
  widthToHeightFromPhysicalMm: number;
  /** Mesure sur un fichier image représentatif (après refresh ou détection). */
  pixelSample: CardPixelSample | null;
  /** largeur / hauteur en pixels (null si aucune image). */
  widthToHeightFromPixels: number | null;
  /** Valeur pour CSS `aspect-ratio` (priorité au ratio pixel fichier). */
  cssAspectRatio: string;
  /** true si l’écart relatif entre ratio pixel et ratio mm reste sous le seuil (fonds perdus, etc.). */
  pixelRatioMatchesPhysicalMmApprox: boolean;
}
