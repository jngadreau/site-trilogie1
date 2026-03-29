import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AiModule } from './ai/ai.module';
import { SiteModule } from './site/site.module';
import { CardsModule } from './cards/cards.module';
import { LandingStorageModule } from './landing-storage/landing-storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '.env.local'] }),
    AiModule,
    CardsModule,
    SiteModule,
    LandingStorageModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
