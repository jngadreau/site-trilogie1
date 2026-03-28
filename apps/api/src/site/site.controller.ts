import { randomUUID } from 'crypto';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RegisterDeckLandingVariantDto } from './dto/register-deck-landing-variant.dto';
import { UpdateDeckLandingVariantsDto } from './dto/update-deck-landing-variants.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { SiteService } from './site.service';
import { LandingGenerationService } from './landing-generation.service';
import { GameContextGenerationService } from './game-context-generation.service';
import { LandingAssetsService } from './landing-assets.service';
import { DeckModularLandingService } from './deck-modular-landing.service';
import { DeckModularLandingAssetsService } from './deck-modular-landing-assets.service';
import { CardFanService } from './card-fan.service';
import { DeckCardMirrorService } from './deck-card-mirror.service';
import { ComposeFanDto } from './dto/compose-fan.dto';
import { GenerateLandingAssetsDto } from './dto/generate-landing-assets.dto';
import {
  DECK_LANDING_IMAGE_QUEUE,
  DECK_LANDING_PIPELINE_QUEUE,
  JOB_DECK_COMPOSITION,
} from './deck-landing-queue.constants';

@Controller('site')
export class SiteController {
  constructor(
    private readonly site: SiteService,
    private readonly gameContextGen: GameContextGenerationService,
    private readonly landingGen: LandingGenerationService,
    private readonly landingAssets: LandingAssetsService,
    private readonly deckModular: DeckModularLandingService,
    private readonly deckModularAssets: DeckModularLandingAssetsService,
    private readonly cardFan: CardFanService,
    private readonly deckCardMirror: DeckCardMirrorService,
    @InjectQueue(DECK_LANDING_PIPELINE_QUEUE)
    private readonly deckPipelineQueue: Queue,
    @InjectQueue(DECK_LANDING_IMAGE_QUEUE)
    private readonly deckImageQueue: Queue,
  ) {}

  @Get('manifest')
  async manifest() {
    return this.site.getManifest();
  }

  /** Spec landing détaillée (générée par Grok, voir prompts/landing/). */
  @Get('landing-spec')
  async landingSpec() {
    return this.landingGen.loadLandingSpec();
  }

  /**
   * Étape 1 : synthèse Markdown `game-context.md` (cartes .md + livret + metadata + trilogie).
   * Réutilisable pour les appels landing sans repasser toutes les sources.
   */
  @Post('generate-game-context')
  async generateGameContext() {
    return this.gameContextGen.generateAndSave();
  }

  /**
   * Étape 2 : génère la landing à partir de `prompts/landing/*.md` + `game-context.md` (si présent) + extraits.
   * Écrit `landing-spec.json`, `landing-shell.html`, `landing-base.css` dans content/generated/arbre-de-vie/
   */
  @Post('generate-landing')
  async generateLanding() {
    return this.landingGen.generateAndSave();
  }

  /** JSON landing modulaire (10 sections, variantes React) — slug présent dans `deck-landing-variants.json`. */
  @Get('deck-landing/:slug')
  async deckLanding(@Param('slug') slug: string) {
    return this.deckModular.loadDeckLanding(slug);
  }

  /** Carte slug → variantes React (`content/.../deck-landing-variants.json`). */
  @Get('deck-landing-variants')
  async deckLandingVariants() {
    return this.deckModular.loadVariantsMap();
  }

  /** Enregistre une nouvelle combinaison de variantes React pour un slug `arbre-de-vie-…`. */
  @Post('deck-landing-variants/register')
  async registerDeckLandingVariant(@Body() dto: RegisterDeckLandingVariantDto) {
    return this.deckModular.registerVariant(dto.slug, {
      hero: dto.hero,
      deck_identity: dto.deck_identity,
      for_who: dto.for_who,
      outcomes: dto.outcomes,
      how_to_use: dto.how_to_use,
      in_the_box: dto.in_the_box,
      faq: dto.faq,
      creator: dto.creator,
      related_decks: dto.related_decks,
      cta_band: dto.cta_band,
    });
  }

  /**
   * Met à jour une ou plusieurs variantes React pour un slug déjà présent dans
   * `deck-landing-variants.json` (les champs omis sont conservés).
   */
  @Post('deck-landing-variants/update')
  async updateDeckLandingVariants(@Body() dto: UpdateDeckLandingVariantsDto) {
    const { slug, ...partial } = dto;
    return this.deckModular.updateDeckLandingVariants(slug, partial);
  }

  /** Plan Grok pour une landing (ex. `arbre-de-vie-c`) : choix des variantes + rationale. */
  @Get('deck-landing-variant-plan/:slug')
  async deckLandingVariantPlan(@Param('slug') slug: string) {
    return this.deckModular.loadVariantPlan(slug);
  }

  /** État des JSON (landings, plans) + carte des variantes — pour l’UI `/admin`. */
  @Get('deck-modular-landing-dashboard')
  async deckModularLandingDashboard() {
    return this.deckModular.getModularDashboard();
  }

  /**
   * Copie les visuels cartes depuis `images-jeux/arbre_de_vie` vers
   * `…/generated/arbre-de-vie/images/deck-cards/` (à côté des PNG Grok).
   * Les landings utilisent `GET /ai/generated-images/deck-cards/:filename`.
   */
  @Post('sync-deck-card-images')
  async syncDeckCardImages() {
    return this.deckCardMirror.syncFromGameFolder();
  }

  /**
   * Grok : specs de toutes les sections + contexte deck → plan variante C, mise à jour de
   * `deck-landing-variants.json` et écriture `deck-landing-plans/{slug}.json`.
   */
  @Post('generate-deck-landing-variant-plan/:slug')
  async generateDeckLandingVariantPlan(@Param('slug') slug: string) {
    return this.deckModular.generateVariantPlanAndSave(slug);
  }

  /** Génère / écrase `deck-landings/{slug}.json` via Grok + prompts `deck-modular-landing/`. */
  @Post('generate-deck-landing/:slug')
  async generateDeckLanding(@Param('slug') slug: string) {
    return this.deckModular.generateAndSave(slug);
  }

  /**
   * Pipeline BullMQ : composition (globals) → 4 jobs « section elements » → finalize (écrit JSON) →
   * jobs Imagine par slot `media`. Nécessite **Redis**. Réponse : `traceId` + `jobId` du job composition.
   */
  @Post('generate-deck-landing-pipeline/:slug')
  async generateDeckLandingPipeline(@Param('slug') slug: string) {
    await this.deckModular.ensureDeckLandingSlug(slug);
    const traceId = randomUUID();
    const job = await this.deckPipelineQueue.add(
      JOB_DECK_COMPOSITION,
      { slug, traceId },
      { removeOnComplete: 40, removeOnFail: 25 },
    );
    return { traceId, jobId: String(job.id), queue: DECK_LANDING_PIPELINE_QUEUE };
  }

  /** Liste récente des jobs pipeline + images (admin). */
  @Get('deck-landing-pipeline-jobs')
  async deckLandingPipelineJobs(@Query('limit') limitRaw?: string) {
    const limit = Math.min(80, Math.max(5, parseInt(limitRaw ?? '35', 10) || 35));
    const types = ['waiting', 'active', 'delayed', 'completed', 'failed'] as (
      | 'waiting'
      | 'active'
      | 'delayed'
      | 'completed'
      | 'failed'
    )[];
    const [pipeJobs, imgJobs] = await Promise.all([
      this.deckPipelineQueue.getJobs(types, 0, limit - 1),
      this.deckImageQueue.getJobs(types, 0, limit - 1),
    ]);
    const mapJob = async (q: string, j: Job) => {
      const state = await j.getState();
      return {
        queue: q,
        id: String(j.id),
        name: j.name,
        state,
        data: j.data,
        returnvalue: j.returnvalue,
        failedReason: j.failedReason,
        timestamp: j.timestamp,
        processedOn: j.processedOn,
        finishedOn: j.finishedOn,
      };
    };
    const pipeline = await Promise.all(
      pipeJobs.map((j) => mapJob(DECK_LANDING_PIPELINE_QUEUE, j)),
    );
    const images = await Promise.all(
      imgJobs.map((j) => mapJob(DECK_LANDING_IMAGE_QUEUE, j)),
    );
    const merged = [...pipeline, ...images].sort(
      (a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0),
    );
    return { limit, jobs: merged.slice(0, limit) };
  }

  /**
   * Point d’entrée **commun** Imagine : lit le slot `media` dans le JSON (`sectionId` + `slotId`),
   * assemble le prompt et met à jour les `props` (ex. `imageUrl` pour hero).
   */
  @Post('generate-deck-landing-image/:slug/:sectionId/:slotId')
  async generateDeckLandingImage(
    @Param('slug') slug: string,
    @Param('sectionId') sectionId: string,
    @Param('slotId') slotId: string,
  ) {
    return this.deckModularAssets.generateImageFromSlot(slug, sectionId, slotId);
  }

  /**
   * Bannière hero (Grok Imagine) pour une landing modulaire : lit `deck-landings/{slug}.json`,
   * utilise `imagePrompts.hero` si présent sinon synthétise un prompt (Grok chat),
   * écrit un PNG sous `images/` et met à jour `hero.props.imageUrl` dans le JSON.
   */
  @Post('generate-deck-landing-hero-image/:slug')
  async generateDeckLandingHeroImage(@Param('slug') slug: string) {
    return this.deckModularAssets.generateHeroImage(slug);
  }

  /**
   * Visuels à partir de `landing-spec.json` : bannière (Grok Imagine, `imagePrompts.heroBanner`)
   * + éventail PNG (Sharp, premières cartes du dossier jeu). Corps optionnel `{ "hero": true, "fan": true }`.
   */
  @Post('generate-landing-assets')
  async generateLandingAssets(@Body() dto?: GenerateLandingAssetsDto) {
    return this.landingAssets.generateFromSpec({
      hero: dto?.hero !== false,
      fan: dto?.fan !== false,
    });
  }

  /** Compose un PNG d’éventail (Sharp) à partir de fichiers du dossier cartes. */
  @Post('compose-fan')
  async composeFan(@Body() dto: ComposeFanDto) {
    return this.cardFan.composeFan({
      files: dto.files,
      outputSlug: dto.outputSlug,
    });
  }
}
