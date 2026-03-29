import type { LandingImageHistoryEntryV1 } from '../site/deck-modular-landing.types';

const HISTORY_MAX = 24;

function positionKey(sectionId: string, slotId: string): string {
  return `${sectionId}:${slotId}`;
}

export function appendLandingImageHistory(
  content: Record<string, unknown>,
  sectionId: string,
  slotId: string,
  entry: LandingImageHistoryEntryV1,
): void {
  const key = positionKey(sectionId, slotId);
  const prevHistory =
    content.imageHistory && typeof content.imageHistory === 'object'
      ? (content.imageHistory as Record<string, LandingImageHistoryEntryV1[]>)
      : {};
  const list = Array.isArray(prevHistory[key]) ? [...prevHistory[key]] : [];
  list.push(entry);
  content.imageHistory = { ...prevHistory, [key]: list.slice(-HISTORY_MAX) };
}
