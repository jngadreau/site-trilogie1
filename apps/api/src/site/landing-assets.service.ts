import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { CardsService } from '../cards/cards.service';
import { CardFanService } from './card-fan.service';
import { LandingGenerationService } from './landing-generation.service';

@Injectable()
export class LandingAssetsService {
  private readonly logger = new Logger(LandingAssetsService.name);

  constructor(
    private readonly ai: AiService,
    private readonly landing: LandingGenerationService,
    private readonly cardFan: CardFanService,
    private readonly cards: CardsService,
  ) {}

  /**
   * Bannière : Grok Imagine à partir de `imagePrompts.heroBanner`.
   * Éventail : Sharp à partir des premières cartes du dossier jeu (pas de re-génération image carte).
   */
  async generateFromSpec(opts?: {
    hero?: boolean;
    fan?: boolean;
  }): Promise<{
    hero?: { path: string; model: string } | { skipped: string };
    fan?: { path: string } | { skipped: string };
  }> {
    const doHero = opts?.hero !== false;
    const doFan = opts?.fan !== false;

    const spec = await this.landing.loadLandingSpec();
    const out: {
      hero?: { path: string; model: string } | { skipped: string };
      fan?: { path: string } | { skipped: string };
    } = {};

    if (doHero) {
      const prompt = spec.imagePrompts?.heroBanner?.trim();
      if (!prompt) {
        out.hero = { skipped: 'imagePrompts.heroBanner absent dans landing-spec.json' };
      } else {
        this.logger.log('Génération bannière hero depuis la spec (Grok Imagine)');
        out.hero = await this.ai.generateImageToFile({
          prompt,
          outputSlug: 'landing-hero-from-spec',
          aspectRatio: '16:9',
        });
      }
    }

    if (doFan) {
      const list = await this.cards.listArbreDeVie();
      const maxStrip = Math.min(Math.max(2, spec.cardStrip?.maxCards ?? 6), 9);
      const take = Math.min(maxStrip, list.files.length);
      const files = list.files.slice(0, take);

      if (files.length < 2) {
        out.fan = {
          skipped:
            'moins de 2 images dans images-jeux/arbre_de_vie/ — éventail impossible',
        };
      } else {
        this.logger.log(`Composition éventail Sharp (${files.length} cartes)`);
        try {
          out.fan = await this.cardFan.composeFan({
            files,
            outputSlug: 'landing-fan-from-cards',
          });
        } catch (e) {
          const msg = (e as Error).message;
          this.logger.warn(`Éventail ignoré: ${msg}`);
          out.fan = { skipped: `Sharp: ${msg}` };
        }
      }
    }

    if (opts?.hero === false && opts?.fan === false) {
      throw new BadRequestException('hero et fan ne peuvent pas être tous les deux à false');
    }

    return out;
  }
}
