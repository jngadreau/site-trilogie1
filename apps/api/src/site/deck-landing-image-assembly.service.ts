import { Injectable } from '@nestjs/common';
import type { DeckLandingGlobals } from './deck-modular-landing.types';
import type { DeckSectionMediaSlotV1 } from './deck-modular-landing.types';

/** Valeurs acceptées par l’API Grok Imagine (`aspect_ratio`). */
const GROK_IMAGINE_ASPECT_RATIOS = new Set([
  '1:1',
  '3:4',
  '4:3',
  '9:16',
  '16:9',
  '2:3',
  '3:2',
  '9:19.5',
  '19.5:9',
  '9:20',
  '20:9',
  '1:2',
  '2:1',
  'auto',
]);

/** Ratios parfois produits par Grok / specs mais non supportés par l’API. */
const ASPECT_RATIO_ALIASES: Record<string, string> = {
  '21:9': '20:9',
  '18:9': '2:1',
};

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
    const trimmed = slot.aspectRatio?.trim() || '16:9';
    const lower = trimmed.toLowerCase();

    const canonical = [...GROK_IMAGINE_ASPECT_RATIOS].find((x) => x.toLowerCase() === lower);
    if (canonical) {
      return canonical;
    }

    const mapped = ASPECT_RATIO_ALIASES[lower];
    if (mapped) {
      return mapped;
    }

    return '16:9';
  }

  resolveOutputSlug(slug: string, sectionId: string, slotId: string): string {
    const safe = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    return `deck-${safe(slug)}-${safe(sectionId)}-${safe(slotId)}`;
  }
}
