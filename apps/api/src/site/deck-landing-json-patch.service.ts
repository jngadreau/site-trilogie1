import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import * as path from 'path';
import { getDeckLandingsDir } from '../paths';
import type { DeckModularLandingV1 } from './deck-modular-landing.types';
import type { DeckSectionMediaSlotV1 } from './deck-modular-landing.types';
import { DeckLandingTraceService } from './deck-landing-trace.service';

@Injectable()
export class DeckLandingJsonPatchService {
  constructor(private readonly trace: DeckLandingTraceService) {}

  async applySlotImage(
    slug: string,
    sectionId: string,
    slot: DeckSectionMediaSlotV1,
    imageUrl: string,
  ): Promise<void> {
    await this.trace.withLandingFileLock(slug, async () => {
      const p = path.join(getDeckLandingsDir(), `${slug}.json`);
      const raw = await readFile(p, 'utf8');
      const doc = JSON.parse(raw) as DeckModularLandingV1;
      const sec = doc.sections.find((s) => s.id === sectionId);
      if (!sec) {
        throw new NotFoundException(`Section ${sectionId} absente`);
      }
      if (sectionId === 'hero' && slot.slotId === 'hero') {
        (sec.props as Record<string, unknown>).imageUrl = imageUrl;
        if (slot.altHintFr?.trim()) {
          (sec.props as Record<string, unknown>).imageAlt = slot.altHintFr.trim();
        }
      } else {
        throw new BadRequestException(
          `Aucun champ JSON défini pour image section=${sectionId} slot=${slot.slotId} (seul hero/hero est câblé)`,
        );
      }
      await writeFile(p, JSON.stringify(doc, null, 2), 'utf8');
    });
  }
}
