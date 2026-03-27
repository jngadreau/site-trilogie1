import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MarkdownGenerationProcessor } from './markdown-generation.processor';
import { AI_MARKDOWN_QUEUE } from './ai-markdown.constants';
import { getBullConnectionOptions } from '../config/bullmq.config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: getBullConnectionOptions(config),
      }),
    }),
    BullModule.registerQueue({ name: AI_MARKDOWN_QUEUE }),
  ],
  controllers: [AiController],
  providers: [AiService, MarkdownGenerationProcessor],
})
export class AiModule {}
