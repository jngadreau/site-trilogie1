import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SiteService } from './site.service';
import { LandingGenerationService } from './landing-generation.service';
import { GameContextGenerationService } from './game-context-generation.service';
import { LandingAssetsService } from './landing-assets.service';
import { DeckModularLandingService } from './deck-modular-landing.service';
import { CardFanService } from './card-fan.service';
import { ComposeFanDto } from './dto/compose-fan.dto';
import { GenerateLandingAssetsDto } from './dto/generate-landing-assets.dto';

@Controller('site')
export class SiteController {
  constructor(
    private readonly site: SiteService,
    private readonly gameContextGen: GameContextGenerationService,
    private readonly landingGen: LandingGenerationService,
    private readonly landingAssets: LandingAssetsService,
    private readonly deckModular: DeckModularLandingService,
    private readonly cardFan: CardFanService,
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

  /** JSON landing modulaire (4 sections, variantes React) — slugs `arbre-de-vie-a` \| `b` \| `c`. */
  @Get('deck-landing/:slug')
  async deckLanding(@Param('slug') slug: string) {
    return this.deckModular.loadDeckLanding(slug);
  }

  /** Carte slug → variantes React (`content/.../deck-landing-variants.json`). */
  @Get('deck-landing-variants')
  async deckLandingVariants() {
    return this.deckModular.loadVariantsMap();
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
