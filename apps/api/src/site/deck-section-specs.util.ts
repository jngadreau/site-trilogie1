import { readFile } from 'fs/promises';
import * as path from 'path';
import { VARIANT_TO_SPEC_REL } from './deck-variant-spec-paths';

/** Ordre stable : par type de section puis par nom de variante. */
const SPEC_REL_PATHS = [
  'cta_band/variants/CtaMarqueeRibbon.spec.md',
  'cta_band/variants/CtaSplitAction.spec.md',
  'deck_identity/variants/IdentityMinimal.spec.md',
  'deck_identity/variants/IdentityPanel.spec.md',
  'faq/variants/FaqAccordion.spec.md',
  'faq/variants/FaqTwoColumn.spec.md',
  'for_who/variants/ForWhoPillars.spec.md',
  'for_who/variants/ForWhoTwoColumns.spec.md',
  'hero/variants/HeroCardsFan.spec.md',
  'hero/variants/HeroCardsMosaic.spec.md',
  'hero/variants/HeroCardsStrip.spec.md',
  'hero/variants/HeroFullBleed.spec.md',
  'hero/variants/HeroGlowVault.spec.md',
  'hero/variants/HeroParallaxLayers.spec.md',
  'hero/variants/HeroSplitImageRight.spec.md',
  'how_to_use/variants/HowToNumbered.spec.md',
  'how_to_use/variants/HowToTimeline.spec.md',
  'in_the_box/variants/IncludedChecklist.spec.md',
  'in_the_box/variants/IncludedHighlightGrid.spec.md',
  'outcomes/variants/OutcomesBentoGrid.spec.md',
  'outcomes/variants/OutcomesSignalStrip.spec.md',
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
