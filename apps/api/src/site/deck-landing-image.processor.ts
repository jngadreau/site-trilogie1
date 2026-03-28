import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as path from 'path';
import { AiService } from '../ai/ai.service';
import type { DeckLandingGlobals } from './deck-modular-landing.types';
import type { DeckSectionMediaSlotV1 } from './deck-modular-landing.types';
import { DeckLandingImageAssemblyService } from './deck-landing-image-assembly.service';
import { DeckLandingJsonPatchService } from './deck-landing-json-patch.service';
import { DECK_LANDING_IMAGE_QUEUE, JOB_DECK_GENERATE_IMAGE } from './deck-landing-queue.constants';

export type DeckLandingImageJobPayload = {
  slug: string;
  sectionId: string;
  slot: DeckSectionMediaSlotV1;
  globals: DeckLandingGlobals;
  traceId?: string;
};

@Processor(DECK_LANDING_IMAGE_QUEUE, {
  concurrency: 3,
  lockDuration: 300_000,
})
export class DeckLandingImageProcessor extends WorkerHost {
  private readonly logger = new Logger(DeckLandingImageProcessor.name);

  constructor(
    private readonly ai: AiService,
    private readonly assembly: DeckLandingImageAssemblyService,
    private readonly jsonPatch: DeckLandingJsonPatchService,
  ) {
    super();
  }

  async process(job: Job<DeckLandingImageJobPayload>): Promise<Record<string, unknown>> {
    if (job.name !== JOB_DECK_GENERATE_IMAGE) {
      throw new Error(`Unexpected job ${job.name}`);
    }

    const { slug, sectionId, slot, globals } = job.data;
    const prompt = this.assembly.buildImaginePrompt(slot, globals);
    const aspectRatio = this.assembly.resolveAspectRatio(slot);
    const outputSlug = `${this.assembly.resolveOutputSlug(slug, sectionId, slot.slotId)}-t${Date.now()}`;

    this.logger.log(`Imagine ${slug} ${sectionId}/${slot.slotId} ar=${aspectRatio}`);

    const { path: imagePath, model } = await this.ai.generateImageToFile({
      prompt,
      outputSlug,
      aspectRatio,
    });

    const fileName = path.basename(imagePath);
    const imageUrl = `/ai/generated-images/${fileName}`;

    await this.jsonPatch.applySlotImage(slug, sectionId, slot, imageUrl, { prompt, model });

    return { imageUrl, model, promptPreview: prompt.slice(0, 200) };
  }
}
