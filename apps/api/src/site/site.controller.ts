import { Body, Controller, Get, Post } from '@nestjs/common';
import { SiteService } from './site.service';
import { LandingGenerationService } from './landing-generation.service';
import { GameContextGenerationService } from './game-context-generation.service';
import { CardFanService } from './card-fan.service';
import { ComposeFanDto } from './dto/compose-fan.dto';

@Controller('site')
export class SiteController {
  constructor(
    private readonly site: SiteService,
    private readonly gameContextGen: GameContextGenerationService,
    private readonly landingGen: LandingGenerationService,
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

  /** Compose un PNG d’éventail (Sharp) à partir de fichiers du dossier cartes. */
  @Post('compose-fan')
  async composeFan(@Body() dto: ComposeFanDto) {
    return this.cardFan.composeFan({
      files: dto.files,
      outputSlug: dto.outputSlug,
    });
  }
}
