import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AiModule } from '../ai/ai.module';
import { SiteModule } from '../site/site.module';
import { DeckLandingStorageService } from './deck-landing-storage.service';
import { LandingStorageController } from './landing-storage.controller';
import {
  DeckLandingProject,
  DeckLandingProjectSchema,
} from './schemas/deck-landing-project.schema';
import {
  DeckLandingVersion,
  DeckLandingVersionSchema,
} from './schemas/deck-landing-version.schema';
import { S3AssetsService } from './s3-assets.service';
import { LandingStructureWizardService } from './landing-structure-wizard.service';
import { LandingContentPopulateService } from './landing-content-populate.service';
import { LandingVersionMediaS3Service } from './landing-version-media-s3.service';
import { LandingImageSlotPromptsService } from './landing-image-slot-prompts.service';

@Module({
  imports: [
    AiModule,
    SiteModule,
    ConfigModule,
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri:
          process.env.MONGODB_URI?.trim() ||
          'mongodb://localhost:27017/gnova-cv',
      }),
    }),
    MongooseModule.forFeature([
      { name: DeckLandingProject.name, schema: DeckLandingProjectSchema },
      { name: DeckLandingVersion.name, schema: DeckLandingVersionSchema },
    ]),
  ],
  controllers: [LandingStorageController],
  providers: [
    DeckLandingStorageService,
    S3AssetsService,
    LandingStructureWizardService,
    LandingContentPopulateService,
    LandingVersionMediaS3Service,
  ],
  exports: [
    DeckLandingStorageService,
    S3AssetsService,
    LandingStructureWizardService,
    LandingContentPopulateService,
    LandingVersionMediaS3Service,
    LandingImageSlotPromptsService,
  ],
})
export class LandingStorageModule {}
