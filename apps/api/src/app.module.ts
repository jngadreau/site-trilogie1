import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AiModule } from './ai/ai.module';
import { SiteModule } from './site/site.module';
import { CardsModule } from './cards/cards.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '.env.local'] }),
    AiModule,
    CardsModule,
    SiteModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
