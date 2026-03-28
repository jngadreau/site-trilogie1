import { readFile } from 'fs/promises';
import * as path from 'path';

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
