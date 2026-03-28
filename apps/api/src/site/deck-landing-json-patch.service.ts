import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { readFile, writeFile } from 'fs/promises';
import * as path from 'path';
import { getDeckLandingsDir } from '../paths';
import type {
  DeckModularLandingV1,
  DeckSectionMediaSlotV1,
  LandingImageHistoryEntryV1,
} from './deck-modular-landing.types';
import { DeckLandingTraceService } from './deck-landing-trace.service';

const HISTORY_MAX = 24;

@Injectable()
export class DeckLandingJsonPatchService {
  constructor(private readonly trace: DeckLandingTraceService) {}

  private positionKey(sectionId: string, slotId: string): string {
    return `${sectionId}:${slotId}`;
  }

  async applySlotImage(
    slug: string,
    sectionId: string,
    slot: DeckSectionMediaSlotV1,
    imageUrl: string,
    meta?: { prompt?: string; model?: string },
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

      const key = this.positionKey(sectionId, slot.slotId);
      const prompt = meta?.prompt?.trim() ?? '';
      const entry: LandingImageHistoryEntryV1 = {
        id: randomUUID(),
        imageUrl,
        prompt,
        model: meta?.model,
        createdAt: new Date().toISOString(),
      };
      const prev = doc.imageHistory?.[key] ?? [];
      doc.imageHistory = { ...doc.imageHistory, [key]: [...prev, entry].slice(-HISTORY_MAX) };

      await writeFile(p, JSON.stringify(doc, null, 2), 'utf8');
    });
  }

  /** Réactive une URL déjà en historique (hero). */
  async selectHistoryImage(slug: string, positionKey: string, versionId: string): Promise<void> {
    await this.trace.withLandingFileLock(slug, async () => {
      const p = path.join(getDeckLandingsDir(), `${slug}.json`);
      const raw = await readFile(p, 'utf8');
      const doc = JSON.parse(raw) as DeckModularLandingV1;
      const list = doc.imageHistory?.[positionKey];
      const hit = list?.find((e) => e.id === versionId);
      if (!hit) {
        throw new NotFoundException(`Version ${versionId} introuvable pour ${positionKey}`);
      }
      const [sectionId, slotId] = positionKey.split(':');
      if (sectionId !== 'hero' || slotId !== 'hero') {
        throw new BadRequestException('Sélection historique : seule la position hero:hero est câblée');
      }
      const hero = doc.sections.find((s) => s.id === 'hero');
      if (!hero) throw new NotFoundException('Section hero absente');
      (hero.props as Record<string, unknown>).imageUrl = hit.imageUrl;
      await writeFile(p, JSON.stringify(doc, null, 2), 'utf8');
    });
  }
}
