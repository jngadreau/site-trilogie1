import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateMarkdownDto } from './dto/generate-markdown.dto';
import { AI_MARKDOWN_QUEUE, JOB_NAME_GENERATE_MARKDOWN } from './ai-markdown.constants';

@Processor(AI_MARKDOWN_QUEUE, {
  concurrency: 2,
  lockDuration: 300_000,
})
export class MarkdownGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(MarkdownGenerationProcessor.name);

  constructor(private readonly ai: AiService) {
    super();
  }

  async process(job: Job<GenerateMarkdownDto>): Promise<{
    path: string;
    model: string;
    preview: string;
  }> {
    if (job.name !== JOB_NAME_GENERATE_MARKDOWN) {
      throw new Error(`Unexpected job name: ${job.name}`);
    }
    this.logger.log(`Job ${job.id} markdown generation start`);
    return this.ai.generateMarkdownToFile(job.data);
  }
}
