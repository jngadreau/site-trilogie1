import { Injectable } from '@nestjs/common';
import type { DeckLandingGlobals } from './deck-modular-landing.types';
import type { DeckSectionMediaSlotV1 } from './deck-modular-landing.types';

/**
 * Point d’entrée unique : à partir des champs structurés (spec + sortie Grok section),
 * produit le prompt texte pour Grok Imagine et les paramètres d’appel (aspect ratio côté DTO).
 */
@Injectable()
export class DeckLandingImageAssemblyService {
  /**
   * Assemble le prompt final en anglais (Imagine se porte mieux en anglais).
   * Peut mélanger FR dans sceneDescription si Grok l’a laissé — acceptable.
   */
  buildImaginePrompt(slot: DeckSectionMediaSlotV1, globals: DeckLandingGlobals): string {
    const parts: string[] = [slot.sceneDescription.trim()];

    if (slot.mood?.trim()) {
      parts.push(`Mood: ${slot.mood.trim()}`);
    }
    if (slot.styleVisual?.trim()) {
      parts.push(`Visual style: ${slot.styleVisual.trim()}`);
    }
    if (slot.colorContext?.trim()) {
      parts.push(
        `Color direction: ${slot.colorContext.trim()} (page palette hint — accent ${globals.accent}, background ${globals.background})`,
      );
    } else {
      parts.push(
        `Harmonize subtly with web palette accent ${globals.accent} and calm background mood ${globals.background}.`,
      );
    }

    const constraints =
      slot.constraints?.trim() ||
      'No readable text, letters, logos, or UI elements in the image. No medical imagery.';
    parts.push(constraints);

    parts.push('High quality, suitable for a wide web hero banner.');

    return parts.join(' ');
  }

  resolveAspectRatio(slot: DeckSectionMediaSlotV1): string {
    const ar = slot.aspectRatio?.trim() || '16:9';
    return /^\d+:\d+$/.test(ar) ? ar : '16:9';
  }

  resolveOutputSlug(slug: string, sectionId: string, slotId: string): string {
    const safe = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    return `deck-${safe(slug)}-${safe(sectionId)}-${safe(slotId)}`;
  }
}
