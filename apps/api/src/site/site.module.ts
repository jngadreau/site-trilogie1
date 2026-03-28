import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
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
import {
  DECK_LANDING_IMAGE_QUEUE,
  DECK_LANDING_PIPELINE_QUEUE,
} from './deck-landing-queue.constants';
import { DeckLandingTraceService } from './deck-landing-trace.service';
import { DeckLandingImageAssemblyService } from './deck-landing-image-assembly.service';
import { DeckLandingJsonPatchService } from './deck-landing-json-patch.service';
import { DeckLandingPipelineOrchestrationService } from './deck-landing-pipeline-orchestration.service';
import { DeckLandingPipelineProcessor } from './deck-landing-pipeline.processor';
import { DeckLandingImageProcessor } from './deck-landing-image.processor';

@Module({
  imports: [
    AiModule,
    CardsModule,
    BullModule.registerQueue({ name: DECK_LANDING_PIPELINE_QUEUE }),
    BullModule.registerQueue({ name: DECK_LANDING_IMAGE_QUEUE }),
  ],
  controllers: [SiteController],
  providers: [
    SiteService,
    GameContextGenerationService,
    LandingGenerationService,
    LandingAssetsService,
    DeckModularLandingService,
    DeckLandingTraceService,
    DeckLandingImageAssemblyService,
    DeckLandingJsonPatchService,
    DeckModularLandingAssetsService,
    DeckLandingPipelineOrchestrationService,
    DeckLandingPipelineProcessor,
    DeckLandingImageProcessor,
    CardFanService,
  ],
})
export class SiteModule {}
