import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { DeckLandingPipelineOrchestrationService } from './deck-landing-pipeline-orchestration.service';
import {
  DECK_LANDING_PIPELINE_QUEUE,
  JOB_DECK_COMPOSITION,
  JOB_DECK_FINALIZE,
  JOB_DECK_SECTION_ELEMENTS,
} from './deck-landing-queue.constants';
import type { DeckLandingSectionId } from './deck-landing-section-order';

@Processor(DECK_LANDING_PIPELINE_QUEUE, {
  concurrency: 2,
  lockDuration: 600_000,
})
export class DeckLandingPipelineProcessor extends WorkerHost {
  private readonly logger = new Logger(DeckLandingPipelineProcessor.name);

  constructor(private readonly orchestration: DeckLandingPipelineOrchestrationService) {
    super();
  }

  async process(
    job: Job<
      | { slug: string; traceId: string }
      | { slug: string; traceId: string; sectionId: string }
    >,
  ): Promise<Record<string, unknown>> {
    this.logger.log(`Job ${job.id} ${job.name}`);

    if (job.name === JOB_DECK_COMPOSITION) {
      const { slug, traceId } = job.data as { slug: string; traceId: string };
      return this.orchestration.runComposition(slug, traceId);
    }

    if (job.name === JOB_DECK_SECTION_ELEMENTS) {
      const { slug, traceId, sectionId } = job.data as {
        slug: string;
        traceId: string;
        sectionId: string;
      };
      return this.orchestration.runSectionElements(
        slug,
        traceId,
        sectionId as DeckLandingSectionId,
      );
    }

    if (job.name === JOB_DECK_FINALIZE) {
      const { slug, traceId } = job.data as { slug: string; traceId: string };
      return this.orchestration.runFinalize(slug, traceId);
    }

    throw new Error(`Job inconnu: ${job.name}`);
  }
}
