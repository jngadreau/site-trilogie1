import { readFile } from 'fs/promises';
import * as path from 'path';
import { VARIANT_TO_SPEC_REL } from './deck-variant-spec-paths';

/** Ordre stable : par type de section puis par nom de variante. */
const SPEC_REL_PATHS = [
  'hero/variants/HeroSplitImageRight.spec.md',
  'hero/variants/HeroFullBleed.spec.md',
  'deck_identity/variants/IdentityPanel.spec.md',
  'deck_identity/variants/IdentityMinimal.spec.md',
  'for_who/variants/ForWhoTwoColumns.spec.md',
  'for_who/variants/ForWhoPillars.spec.md',
  'how_to_use/variants/HowToNumbered.spec.md',
  'how_to_use/variants/HowToTimeline.spec.md',
] as const;

export async function readDeckSectionSpecsBundle(sectionsRoot: string): Promise<string> {
  const chunks: string[] = [];
  for (const rel of SPEC_REL_PATHS) {
    const filePath = path.join(sectionsRoot, rel);
    const body = await readFile(filePath, 'utf8');
    chunks.push(`## Spécification — \`${rel}\`\n\n${body.trim()}`);
  }
  return chunks.join('\n\n---\n\n');
}

export async function readDeckSectionSpecByVariant(
  sectionsRoot: string,
  variant: string,
): Promise<string> {
  const rel = VARIANT_TO_SPEC_REL[variant];
  if (!rel) {
    throw new Error(`Variante sans spec MD enregistrée: ${variant}`);
  }
  const filePath = path.join(sectionsRoot, rel);
  return readFile(filePath, 'utf8');
}
