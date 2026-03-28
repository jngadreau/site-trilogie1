import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import * as path from 'path';
import {
  getDeckLandingPlansDir,
  getDeckLandingPlanPath,
  getDeckLandingsDir,
  getDeckLandingVariantsPath,
  getDeckModularLandingPromptsDir,
  getGameContextPath,
  getWebAppSectionsDir,
} from '../paths';
import type { DeckLandingVariantPlanV1 } from './deck-landing-plan.types';
import type { DeckModularLandingV1 } from './deck-modular-landing.types';
import { readDeckSectionSpecsBundle } from './deck-section-specs.util';
import { extractFirstJsonObject } from './json-extract.util';
import { DECK_LANDING_SECTION_ORDER } from './deck-landing-section-order';

/** Slugs deck « Arbre de vie » : préfixe + segment(s) alphanumériques tiretés. */
const ARBRE_DE_VIE_SLUG_RE = /^arbre-de-vie-[a-z0-9]+(?:-[a-z0-9]+)*$/;

const SECTION_KEYS = DECK_LANDING_SECTION_ORDER;

type SectionKey = (typeof DECK_LANDING_SECTION_ORDER)[number];

const VARIANT_CHOICES: Record<SectionKey, readonly string[]> = {
  hero: [
    'HeroSplitImageRight',
    'HeroFullBleed',
    'HeroGlowVault',
    'HeroParallaxLayers',
  ],
  deck_identity: ['IdentityPanel', 'IdentityMinimal'],
  for_who: ['ForWhoTwoColumns', 'ForWhoPillars'],
  outcomes: ['OutcomesBentoGrid', 'OutcomesSignalStrip'],
  how_to_use: ['HowToNumbered', 'HowToTimeline'],
  cta_band: ['CtaMarqueeRibbon', 'CtaSplitAction'],
};

@Injectable()
export class DeckModularLandingService {
  private readonly logger = new Logger(DeckModularLandingService.name);

  constructor(private readonly config: ConfigService) {}

  private isArbreDeVieSlug(slug: string): boolean {
    return ARBRE_DE_VIE_SLUG_RE.test(slug);
  }

  /**
   * Slug autorisé = motif `arbre-de-vie-…` et clé présente dans `deck-landing-variants.json`.
   */
  private async assertSlugAllowed(
    slug: string,
    variantsMap?: Record<string, Record<string, string>>,
  ): Promise<void> {
    if (!this.isArbreDeVieSlug(slug)) {
      throw new NotFoundException(`Slug landing invalide: ${slug}`);
    }
    const map = variantsMap ?? (await this.loadVariantsMap());
    if (!map[slug]) {
      throw new NotFoundException(
        `Slug landing inconnu: ${slug} — absent de deck-landing-variants.json`,
      );
    }
  }

  /** File d’attente BullMQ / pipeline. */
  async ensureDeckLandingSlug(slug: string): Promise<void> {
    await this.assertSlugAllowed(slug);
  }

  async loadDeckLanding(slug: string): Promise<DeckModularLandingV1> {
    await this.assertSlugAllowed(slug);
    const p = path.join(getDeckLandingsDir(), `${slug}.json`);
    let raw: string;
    try {
      raw = await readFile(p, 'utf8');
    } catch {
      throw new NotFoundException(
        `${slug}.json absent — POST /site/generate-deck-landing/${slug}`,
      );
    }
    try {
      return JSON.parse(raw) as DeckModularLandingV1;
    } catch {
      throw new NotFoundException(`${slug}.json invalide`);
    }
  }

  /** Carte complète slug → variantes (fichier éditorial). */
  async loadVariantsMap(): Promise<Record<string, Record<string, string>>> {
    const raw = await readFile(getDeckLandingVariantsPath(), 'utf8');
    return JSON.parse(raw) as Record<string, Record<string, string>>;
  }

  async loadVariantPlan(slug: string): Promise<DeckLandingVariantPlanV1> {
    await this.assertSlugAllowed(slug);
    const p = getDeckLandingPlanPath(slug);
    try {
      const raw = await readFile(p, 'utf8');
      return JSON.parse(raw) as DeckLandingVariantPlanV1;
    } catch {
      throw new NotFoundException(`Plan absent pour ${slug} — POST …/generate-deck-landing-variant-plan/${slug}`);
    }
  }

  /**
   * Résumé pour l’UI admin : variantes, présence des plans et des JSON landings.
   */
  async getModularDashboard(): Promise<{
    variants: Record<string, Record<string, string>>;
    plans: Record<string, { exists: boolean }>;
    landings: Record<string, { exists: boolean; bytes?: number }>;
  }> {
    const variants = await this.loadVariantsMap();
    const landingsDir = getDeckLandingsDir();
    const plansDir = getDeckLandingPlansDir();
    const landings: Record<string, { exists: boolean; bytes?: number }> = {};
    const plans: Record<string, { exists: boolean }> = {};

    const slugs = Object.keys(variants)
      .filter((s) => this.isArbreDeVieSlug(s))
      .sort();
    for (const slug of slugs) {
      const lp = path.join(landingsDir, `${slug}.json`);
      try {
        const st = await stat(lp);
        landings[slug] = { exists: true, bytes: st.size };
      } catch {
        landings[slug] = { exists: false };
      }
      const pp = getDeckLandingPlanPath(slug);
      try {
        await stat(pp);
        plans[slug] = { exists: true };
      } catch {
        plans[slug] = { exists: false };
      }
    }

    return { variants, plans, landings };
  }

  /**
   * Grok : lit toutes les specs `.md` des variantes + contexte deck + landings A/B,
   * produit un plan (choix des 4 variantes + rationale) et met à jour `deck-landing-variants.json`.
   */
  async generateVariantPlanAndSave(slug: string): Promise<{
    planPath: string;
    variantsPath: string;
    model: string;
  }> {
    const variantsMap = await this.loadVariantsMap();
    await this.assertSlugAllowed(slug, variantsMap);

    const apiKey = this.config.get<string>('GROK_API_KEY') ?? '';
    const baseUrl = this.config.get<string>('GROK_API_URL') ?? 'https://api.x.ai/v1';
    const model =
      this.config.get<string>('GROK_DECK_LANDING_MODEL')?.trim() ||
      this.config.get<string>('GROK_TEXT_MODEL')?.trim() ||
      'grok-3-mini';

    if (!apiKey) {
      throw new InternalServerErrorException('GROK_API_KEY is not configured');
    }

    let deckContext = '';
    try {
      deckContext = await readFile(getGameContextPath(), 'utf8');
    } catch {
      deckContext =
        '(game-context.md absent — lance POST /site/generate-game-context pour un meilleur résultat)';
    }
    const ctxSlice = deckContext.slice(0, 55_000);

    const specsBundle = await readDeckSectionSpecsBundle(getWebAppSectionsDir());
    const existingAB = {
      'arbre-de-vie-a': variantsMap['arbre-de-vie-a'],
      'arbre-de-vie-b': variantsMap['arbre-de-vie-b'],
    };

    const promptsDir = path.join(getDeckModularLandingPromptsDir(), 'variant-plan');
    const system = await readFile(path.join(promptsDir, '01-system.md'), 'utf8');
    let userTpl = await readFile(path.join(promptsDir, '02-user-template.md'), 'utf8');

    userTpl = userTpl
      .replace('{{DECK_CONTEXT}}', ctxSlice)
      .replace(/\{\{LANDING_SLUG\}\}/g, slug)
      .replace('{{SECTION_SPECS_BUNDLE}}', specsBundle)
      .replace('{{EXISTING_VARIANTS_A_B_JSON}}', JSON.stringify(existingAB, null, 2));

    const client = new OpenAI({ apiKey, baseURL: baseUrl });
    this.logger.log(`Grok variant-plan slug=${slug} model=${model}`);

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 8_000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userTpl },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent?.trim()) {
      throw new InternalServerErrorException('No content from Grok API');
    }

    let plan: DeckLandingVariantPlanV1;
    try {
      plan = JSON.parse(extractFirstJsonObject(rawContent)) as DeckLandingVariantPlanV1;
    } catch (e) {
      this.logger.error(`Plan JSON parse: ${(e as Error).message}`);
      throw new InternalServerErrorException('Réponse Grok (plan) non JSON valide');
    }

    if (plan.version !== 1) {
      throw new InternalServerErrorException('plan.version !== 1');
    }
    plan.slug = slug;
    if (!plan.variants) {
      throw new InternalServerErrorException('plan.variants manquant');
    }

    this.validateVariantPlan(plan, variantsMap);

    await mkdir(getDeckLandingPlansDir(), { recursive: true });
    const planPath = getDeckLandingPlanPath(slug);
    await writeFile(planPath, JSON.stringify(plan, null, 2), 'utf8');

    variantsMap[slug] = { ...plan.variants };
    const variantsPath = getDeckLandingVariantsPath();
    await writeFile(variantsPath, JSON.stringify(variantsMap, null, 2) + '\n', 'utf8');
    this.logger.log(`Updated ${variantsPath} and wrote ${planPath}`);

    return { planPath, variantsPath, model };
  }

  /**
   * Ajoute une entrée dans `deck-landing-variants.json` (slug Arbre de vie + 4 composants React).
   */
  async registerVariant(
    slug: string,
    variants: Record<string, string>,
  ): Promise<{ variantsPath: string }> {
    if (!this.isArbreDeVieSlug(slug)) {
      throw new BadRequestException(`Slug invalide: ${slug}`);
    }
    const map = await this.loadVariantsMap();
    if (map[slug]) {
      throw new ConflictException(`La variante ${slug} existe déjà`);
    }
    for (const key of SECTION_KEYS) {
      const v = variants[key];
      const allowed = VARIANT_CHOICES[key];
      if (!v || !allowed.includes(v)) {
        throw new BadRequestException(
          `Variante invalide pour ${key}: ${v} (attendu: ${allowed.join(' | ')})`,
        );
      }
    }
    const entry: Record<string, string> = {};
    for (const key of SECTION_KEYS) {
      entry[key] = variants[key]!;
    }
    map[slug] = entry;
    const variantsPath = getDeckLandingVariantsPath();
    await writeFile(variantsPath, JSON.stringify(map, null, 2) + '\n', 'utf8');
    this.logger.log(`Registered deck variant ${slug} in ${variantsPath}`);
    return { variantsPath };
  }

  private validateVariantPlan(
    plan: DeckLandingVariantPlanV1,
    variantsMap: Record<string, Record<string, string>>,
  ): void {
    for (const key of SECTION_KEYS) {
      const v = plan.variants[key];
      const allowed = VARIANT_CHOICES[key];
      if (!v || !allowed.includes(v)) {
        throw new InternalServerErrorException(
          `Variante invalide pour ${key}: ${v} (attendu: ${allowed.join(' | ')})`,
        );
      }
    }

    const combo = plan.variants;
    const a = variantsMap['arbre-de-vie-a'];
    const b = variantsMap['arbre-de-vie-b'];
    if (a && this.sameVariantCombo(combo, a)) {
      throw new InternalServerErrorException('La combinaison ne doit pas être identique à arbre-de-vie-a');
    }
    if (b && this.sameVariantCombo(combo, b)) {
      throw new InternalServerErrorException('La combinaison ne doit pas être identique à arbre-de-vie-b');
    }
  }

  private sameVariantCombo(
    x: Record<string, string>,
    y: Record<string, string>,
  ): boolean {
    return SECTION_KEYS.every((k) => x[k] === y[k]);
  }

  async generateAndSave(slug: string): Promise<{
    path: string;
    model: string;
    sections: number;
  }> {
    await this.assertSlugAllowed(slug);
    const apiKey = this.config.get<string>('GROK_API_KEY') ?? '';
    const baseUrl = this.config.get<string>('GROK_API_URL') ?? 'https://api.x.ai/v1';
    const model =
      this.config.get<string>('GROK_DECK_LANDING_MODEL')?.trim() ||
      this.config.get<string>('GROK_TEXT_MODEL')?.trim() ||
      'grok-3-mini';

    if (!apiKey) {
      throw new InternalServerErrorException('GROK_API_KEY is not configured');
    }

    let deckContext = '';
    try {
      deckContext = await readFile(getGameContextPath(), 'utf8');
    } catch {
      deckContext =
        '(game-context.md absent — lance POST /site/generate-game-context pour un meilleur résultat)';
    }
    const ctxSlice = deckContext.slice(0, 60_000);

    const variantsRaw = await readFile(getDeckLandingVariantsPath(), 'utf8');
    const variantsMap = JSON.parse(variantsRaw) as Record<string, Record<string, string>>;
    const variantEntry = variantsMap[slug];
    if (!variantEntry) {
      throw new InternalServerErrorException(`Pas d'entrée variants pour ${slug}`);
    }

    let specsBundle = '';
    try {
      specsBundle = await readDeckSectionSpecsBundle(getWebAppSectionsDir());
    } catch (e) {
      this.logger.warn(`Specs bundle: ${(e as Error).message}`);
      specsBundle = '(impossible de lire les specs depuis apps/web/src/sections)';
    }

    const system = await readFile(
      path.join(getDeckModularLandingPromptsDir(), '01-system.md'),
      'utf8',
    );
    let userTpl = await readFile(
      path.join(getDeckModularLandingPromptsDir(), '02-user-template.md'),
      'utf8',
    );

    userTpl = userTpl
      .replace('{{DECK_CONTEXT}}', ctxSlice)
      .replace(/\{\{LANDING_SLUG\}\}/g, slug)
      .replace('{{VARIANT_MAP_JSON}}', JSON.stringify(variantEntry, null, 2))
      .replace('{{SECTION_SPECS_BUNDLE}}', specsBundle);

    const client = new OpenAI({ apiKey, baseURL: baseUrl });
    this.logger.log(`Grok deck-modular landing slug=${slug} model=${model}`);

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.45,
      max_tokens: 16_000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userTpl },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent?.trim()) {
      throw new InternalServerErrorException('No content from Grok API');
    }

    let doc: DeckModularLandingV1;
    try {
      doc = JSON.parse(extractFirstJsonObject(rawContent)) as DeckModularLandingV1;
    } catch (e) {
      this.logger.error(`JSON parse: ${(e as Error).message}`);
      throw new InternalServerErrorException(
        'Réponse Grok non JSON valide — voir les logs serveur',
      );
    }

    if (doc.version !== 1) {
      throw new InternalServerErrorException('version !== 1');
    }
    if (doc.slug !== slug) {
      doc.slug = slug;
    }
    const ids = doc.sections?.map((s) => s.id) ?? [];
    const expected = [...DECK_LANDING_SECTION_ORDER];
    if (ids.length !== expected.length || expected.some((id, i) => ids[i] !== id)) {
      throw new InternalServerErrorException(
        `Sections invalides (attendu ordre ${expected.join(',')}, reçu ${ids.join(',')})`,
      );
    }

    for (const s of doc.sections) {
      const want = variantEntry[s.id];
      if (want && s.variant !== want) {
        throw new InternalServerErrorException(
          `Section ${s.id}: variante « ${s.variant} » ≠ carte « ${want} » pour ${slug}`,
        );
      }
      if (!Array.isArray(s.media)) {
        s.media = [];
      }
    }

    const outDir = getDeckLandingsDir();
    await mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, `${slug}.json`);
    await writeFile(outPath, JSON.stringify(doc, null, 2), 'utf8');
    this.logger.log(`Saved ${outPath}`);

    return {
      path: outPath,
      model,
      sections: doc.sections.length,
    };
  }
}
