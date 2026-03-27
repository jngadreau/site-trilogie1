import { Module } from '@nestjs/common';
import { CardsModule } from '../cards/cards.module';
import { SiteController } from './site.controller';
import { SiteService } from './site.service';
import { LandingGenerationService } from './landing-generation.service';
import { CardFanService } from './card-fan.service';

@Module({
  imports: [CardsModule],
  controllers: [SiteController],
  providers: [SiteService, LandingGenerationService, CardFanService],
})
export class SiteModule {}
