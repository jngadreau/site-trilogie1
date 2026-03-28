import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import OpenAI from 'openai';
import { mkdir, readFile, writeFile } from 'fs/promises';
import * as path from 'path';
import {
  getDeckLandingsDir,
  getDeckModularLandingPromptsDir,
  getGameContextPath,
  getDeckLandingVariantsPath,
  getWebAppSectionsDir,
} from '../paths';
import { extractFirstJsonObject } from './json-extract.util';
import { readDeckSectionSpecByVariant } from './deck-section-specs.util';
import type { DeckLandingCompositionGrokV1 } from './deck-landing-composition.types';
import type {
  DeckModularLandingV1,
  DeckSectionMediaSlotV1,
} from './deck-modular-landing.types';
import { DeckLandingTraceService } from './deck-landing-trace.service';
import { DeckModularLandingService } from './deck-modular-landing.service';
import {
  DECK_LANDING_IMAGE_QUEUE,
  DECK_LANDING_PIPELINE_QUEUE,
  JOB_DECK_FINALIZE,
  JOB_DECK_GENERATE_IMAGE,
  JOB_DECK_SECTION_ELEMENTS,
} from './deck-landing-queue.constants';
import {
  DECK_LANDING_SECTION_ORDER,
  type DeckLandingSectionId,
} from './deck-landing-section-order';

const SECTION_ORDER = DECK_LANDING_SECTION_ORDER;

@Injectable()
export class DeckLandingPipelineOrchestrationService {
  private readonly logger = new Logger(DeckLandingPipelineOrchestrationService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly trace: DeckLandingTraceService,
    private readonly deckModular: DeckModularLandingService,
    @InjectQueue(DECK_LANDING_PIPELINE_QUEUE)
    private readonly pipelineQueue: Queue,
    @InjectQueue(DECK_LANDING_IMAGE_QUEUE)
    private readonly imageQueue: Queue,
  ) {}

  async runComposition(slug: string, traceId: string): Promise<{
    model: string;
    sectionsEnqueued: number;
  }> {
    await this.deckModular.ensureDeckLandingSlug(slug);

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

    const variantsRaw = await readFile(getDeckLandingVariantsPath(), 'utf8');
    const variantsMap = JSON.parse(variantsRaw) as Record<string, Record<string, string>>;
    const variantEntry = variantsMap[slug];
    if (!variantEntry) {
      throw new InternalServerErrorException(`Pas d'entrée variants pour ${slug}`);
    }

    const promptsDir = getDeckModularLandingPromptsDir();
    const system = await readFile(path.join(promptsDir, '01-system.md'), 'utf8');
    let userTpl = await readFile(path.join(promptsDir, '05-composition-user-template.md'), 'utf8');
    userTpl = userTpl
      .replace('{{DECK_CONTEXT}}', ctxSlice)
      .replace(/\{\{LANDING_SLUG\}\}/g, slug)
      .replace('{{VARIANT_MAP_JSON}}', JSON.stringify(variantEntry, null, 2));

    const client = new OpenAI({ apiKey, baseURL: baseUrl });
    this.logger.log(`[${traceId}] composition slug=${slug}`);

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 4_000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userTpl },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw?.trim()) {
      throw new InternalServerErrorException('Composition Grok vide');
    }

    let comp: DeckLandingCompositionGrokV1;
    try {
      comp = JSON.parse(extractFirstJsonObject(raw)) as DeckLandingCompositionGrokV1;
    } catch (e) {
      this.logger.error(`Composition JSON: ${(e as Error).message}`);
      throw new InternalServerErrorException('Composition Grok non JSON');
    }
    if (comp.version !== 1 || !comp.globals) {
      throw new InternalServerErrorException('Composition invalide');
    }

    const imagePromptsJson = JSON.stringify(comp.imagePrompts ?? {});

    await this.trace.initTrace(traceId, {
      slug,
      globalsJson: JSON.stringify(comp.globals),
      variantsJson: JSON.stringify(variantEntry),
      imagePromptsJson,
      expectedSections: SECTION_ORDER.length,
    });

    await this.pipelineQueue.addBulk(
      SECTION_ORDER.map((sectionId) => ({
        name: JOB_DECK_SECTION_ELEMENTS,
        data: { slug, traceId, sectionId },
        opts: {
          removeOnComplete: 50,
          removeOnFail: 30,
        },
      })),
    );

    return { model, sectionsEnqueued: SECTION_ORDER.length };
  }

  async runSectionElements(
    slug: string,
    traceId: string,
    sectionId: DeckLandingSectionId,
  ): Promise<{ model: string; finalized: boolean }> {
    const apiKey = this.config.get<string>('GROK_API_KEY') ?? '';
    const baseUrl = this.config.get<string>('GROK_API_URL') ?? 'https://api.x.ai/v1';
    const model =
      this.config.get<string>('GROK_DECK_LANDING_MODEL')?.trim() ||
      this.config.get<string>('GROK_TEXT_MODEL')?.trim() ||
      'grok-3-mini';

    if (!apiKey) {
      throw new InternalServerErrorException('GROK_API_KEY is not configured');
    }

    const globalsJson = await this.trace.getGlobals(traceId);
    const variantsJson = await this.trace.getVariants(traceId);
    if (!globalsJson || !variantsJson) {
      throw new InternalServerErrorException(`Trace ${traceId} expirée ou incomplète`);
    }

    const variants = JSON.parse(variantsJson) as Record<string, string>;
    const variant = variants[sectionId];
    if (!variant) {
      throw new InternalServerErrorException(`Variante manquante pour ${sectionId}`);
    }

    let deckContext = '';
    try {
      deckContext = await readFile(getGameContextPath(), 'utf8');
    } catch {
      deckContext = '(game-context.md absent)';
    }
    const ctxSlice = deckContext.slice(0, 45_000);

    const specMd = await readDeckSectionSpecByVariant(getWebAppSectionsDir(), variant);
    const promptsDir = getDeckModularLandingPromptsDir();
    const system = await readFile(path.join(promptsDir, '01-system.md'), 'utf8');
    let userTpl = await readFile(path.join(promptsDir, '06-section-elements-user-template.md'), 'utf8');
    userTpl = userTpl
      .replace('{{DECK_CONTEXT}}', ctxSlice)
      .replace(/\{\{SECTION_ID\}\}/g, sectionId)
      .replace('{{SECTION_VARIANT}}', variant)
      .replace('{{GLOBALS_JSON}}', globalsJson)
      .replace('{{SECTION_SPEC_MD}}', specMd);

    const client = new OpenAI({ apiKey, baseURL: baseUrl });
    this.logger.log(`[${traceId}] section ${sectionId} variant=${variant}`);

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.45,
      max_tokens: 8_000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userTpl },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw?.trim()) {
      throw new InternalServerErrorException(`Grok vide pour section ${sectionId}`);
    }

    let parsed: { props: Record<string, unknown>; media?: DeckSectionMediaSlotV1[] };
    try {
      parsed = JSON.parse(extractFirstJsonObject(raw)) as typeof parsed;
    } catch (e) {
      this.logger.error(`Section ${sectionId} JSON: ${(e as Error).message}`);
      throw new InternalServerErrorException(`Section ${sectionId} non JSON`);
    }

    await this.trace.setSectionPayload(
      traceId,
      sectionId,
      JSON.stringify({
        props: parsed.props ?? {},
        media: Array.isArray(parsed.media) ? parsed.media : [],
      }),
    );

    const done = await this.trace.incrDone(traceId);
    const expected = await this.trace.getExpected(traceId);
    let finalized = false;
    if (done === expected) {
      await this.pipelineQueue.add(
        JOB_DECK_FINALIZE,
        { slug, traceId },
        { removeOnComplete: 30, removeOnFail: 20 },
      );
      finalized = true;
    }

    return { model, finalized };
  }

  async runFinalize(slug: string, traceId: string): Promise<{
    path: string;
    imageJobs: number;
  }> {
    const globalsJson = await this.trace.getGlobals(traceId);
    const variantsJson = await this.trace.getVariants(traceId);
    const imagePromptsJson = await this.trace.getImagePrompts(traceId);
    if (!globalsJson || !variantsJson) {
      throw new InternalServerErrorException(`Trace ${traceId} incomplète pour finalize`);
    }

    const globals = JSON.parse(globalsJson) as DeckModularLandingV1['globals'];
    const variants = JSON.parse(variantsJson) as Record<string, string>;
    let imagePrompts: DeckModularLandingV1['imagePrompts'] = {};
    try {
      if (imagePromptsJson) {
        imagePrompts = JSON.parse(imagePromptsJson) as DeckModularLandingV1['imagePrompts'];
      }
    } catch {
      imagePrompts = {};
    }

    const sections: DeckModularLandingV1['sections'] = [];

    for (const sectionId of SECTION_ORDER) {
      const raw = await this.trace.getSectionPayload(traceId, sectionId);
      if (!raw) {
        throw new InternalServerErrorException(`Section manquante dans trace: ${sectionId}`);
      }
      const { props, media } = JSON.parse(raw) as {
        props: Record<string, unknown>;
        media: DeckSectionMediaSlotV1[];
      };
      sections.push({
        id: sectionId,
        variant: variants[sectionId],
        props,
        media,
      });
    }

    const doc: DeckModularLandingV1 = {
      version: 1,
      slug,
      globals,
      sections,
      imagePrompts: Object.keys(imagePrompts ?? {}).length ? imagePrompts : undefined,
    };

    for (const s of doc.sections) {
      const want = variants[s.id];
      if (want && s.variant !== want) {
        throw new InternalServerErrorException(
          `Finalize: section ${s.id} variante « ${s.variant} » ≠ ${want}`,
        );
      }
    }

    const outDir = getDeckLandingsDir();
    await mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, `${slug}.json`);
    await writeFile(outPath, JSON.stringify(doc, null, 2), 'utf8');
    this.logger.log(`[${traceId}] finalize → ${outPath}`);

    let imageCount = 0;

    for (const s of doc.sections) {
      const slots = s.media ?? [];
      for (const slot of slots) {
        if (!slot.slotId || !slot.sceneDescription?.trim()) {
          continue;
        }
        await this.imageQueue.add(
          JOB_DECK_GENERATE_IMAGE,
          {
            slug,
            sectionId: s.id,
            slot,
            globals: doc.globals,
            traceId,
          },
          { removeOnComplete: 80, removeOnFail: 40 },
        );
        imageCount += 1;
      }
    }

    await this.trace.deleteTrace(traceId, [...SECTION_ORDER]);

    return { path: outPath, imageJobs: imageCount };
  }

  /**
   * Reprend le **JSON landing actuel** (globals + variantes par section) et enfile uniquement
   * les jobs « section elements » → finalize → images (pas de nouvelle composition Grok).
   */
  async enqueueSectionElementsFromExistingLanding(slug: string): Promise<{
    traceId: string;
    sectionsEnqueued: number;
    jobIds: string[];
  }> {
    await this.deckModular.ensureDeckLandingSlug(slug);
    const doc = await this.deckModular.loadDeckLanding(slug);
    const ids = doc.sections.map((s) => s.id);
    if (ids.length !== SECTION_ORDER.length || SECTION_ORDER.some((id, i) => ids[i] !== id)) {
      throw new BadRequestException(
        `Ordre des sections invalide (attendu ${SECTION_ORDER.join(',')}, reçu ${ids.join(',')}).`,
      );
    }
    const variants: Record<string, string> = {};
    for (const s of doc.sections) {
      variants[s.id] = s.variant;
    }
    const traceId = randomUUID();
    const imagePromptsJson = JSON.stringify(doc.imagePrompts ?? {});
    await this.trace.initTrace(traceId, {
      slug,
      globalsJson: JSON.stringify(doc.globals),
      variantsJson: JSON.stringify(variants),
      imagePromptsJson,
      expectedSections: SECTION_ORDER.length,
    });
    const bulk = await this.pipelineQueue.addBulk(
      SECTION_ORDER.map((sectionId) => ({
        name: JOB_DECK_SECTION_ELEMENTS,
        data: { slug, traceId, sectionId },
        opts: {
          removeOnComplete: 50,
          removeOnFail: 30,
        },
      })),
    );
    return {
      traceId,
      sectionsEnqueued: SECTION_ORDER.length,
      jobIds: bulk.map((j) => String(j.id)),
    };
  }
}
