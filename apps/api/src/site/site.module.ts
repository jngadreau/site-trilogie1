import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { CardsModule } from '../cards/cards.module';
import { SiteController } from './site.controller';
import { SiteService } from './site.service';
import { LandingGenerationService } from './landing-generation.service';
import { GameContextGenerationService } from './game-context-generation.service';
import { LandingAssetsService } from './landing-assets.service';
import { DeckModularLandingService } from './deck-modular-landing.service';
import { DeckModularLandingAssetsService } from './deck-modular-landing-assets.service';
import { CardFanService } from './card-fan.service';

@Module({
  imports: [AiModule, CardsModule],
  controllers: [SiteController],
  providers: [
    SiteService,
    GameContextGenerationService,
    LandingGenerationService,
    LandingAssetsService,
    DeckModularLandingService,
    DeckModularLandingAssetsService,
    CardFanService,
  ],
})
export class SiteModule {}
