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

  /** JSON landing modulaire (4 sections, variantes React) — `arbre-de-vie-a` | `arbre-de-vie-b`. */
  @Get('deck-landing/:slug')
  async deckLanding(@Param('slug') slug: string) {
    return this.deckModular.loadDeckLanding(slug);
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
