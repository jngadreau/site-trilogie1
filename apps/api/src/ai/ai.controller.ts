import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AiService } from './ai.service';
import { GenerateMarkdownDto } from './dto/generate-markdown.dto';
import { GenerateImageDto } from './dto/generate-image.dto';
import {
  AI_MARKDOWN_QUEUE,
  JOB_NAME_GENERATE_MARKDOWN,
} from './ai-markdown.constants';

@Controller('ai')
export class AiController {
  constructor(
    private readonly ai: AiService,
    @InjectQueue(AI_MARKDOWN_QUEUE) private readonly markdownQueue: Queue,
  ) {}

  @Post('generate-markdown')
  async generateMarkdown(@Body() dto: GenerateMarkdownDto) {
    return this.ai.generateMarkdownToFile(dto);
  }

  /** Met en file BullMQ ; nécessite Redis. */
  @Post('generate-markdown-async')
  async generateMarkdownAsync(@Body() dto: GenerateMarkdownDto) {
    const job = await this.markdownQueue.add(JOB_NAME_GENERATE_MARKDOWN, dto, {
      removeOnComplete: 100,
      removeOnFail: 80,
    });
    return { jobId: String(job.id) };
  }

  @Get('jobs/:jobId')
  async jobStatus(@Param('jobId') jobId: string) {
    const job = await this.markdownQueue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Job ${jobId}`);
    }
    const state = await job.getState();
    const out: Record<string, unknown> = {
      id: job.id,
      name: job.name,
      state,
    };
    if (state === 'completed' && job.returnvalue) {
      out.result = job.returnvalue;
    }
    if (state === 'failed') {
      out.failedReason = job.failedReason;
    }
    return out;
  }

  @Post('generate-image')
  async generateImage(@Body() dto: GenerateImageDto) {
    return this.ai.generateImageToFile(dto);
  }

  @Get('generated')
  async listGenerated() {
    return this.ai.listGeneratedMarkdown();
  }

  @Get('generated/:filename')
  async readGenerated(@Param('filename') filename: string) {
    const body = await this.ai.readGeneratedMarkdown(filename);
    return { filename: filename.split('/').pop(), body };
  }

  @Get('generated-images')
  async listGeneratedImages() {
    return this.ai.listGeneratedImages();
  }

  /** Fichiers copiés depuis `images-jeux/arbre_de_vie` (voir `POST /site/sync-deck-card-images`). */
  @Get('generated-images/deck-cards')
  async listMirroredDeckCards() {
    return this.ai.listMirroredDeckCards();
  }

  @Get('generated-images/deck-cards/:filename')
  async readMirroredDeckCardImage(
    @Param('filename') filename: string,
  ): Promise<StreamableFile> {
    const { buffer, mime } = await this.ai.readMirroredDeckCardImage(filename);
    const safeName = filename.split('/').pop() ?? filename;
    return new StreamableFile(buffer, {
      type: mime,
      disposition: `inline; filename="${encodeURIComponent(safeName)}"`,
    });
  }

  @Get('generated-images/:filename')
  async readGeneratedImage(
    @Param('filename') filename: string,
  ): Promise<StreamableFile> {
    const { buffer, mime } = await this.ai.readGeneratedImage(filename);
    const safeName = filename.split('/').pop() ?? filename;
    return new StreamableFile(buffer, {
      type: mime,
      disposition: `inline; filename="${encodeURIComponent(safeName)}"`,
    });
  }
}
