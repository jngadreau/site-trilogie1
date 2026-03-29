import type { DeckModularLandingV1 } from '../types/deckLanding'

export function isDeckModularLandingV1(x: unknown): x is DeckModularLandingV1 {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  if (o.version !== 1) return false
  if (typeof o.slug !== 'string' || !o.slug) return false
  if (!o.globals || typeof o.globals !== 'object') return false
  if (!Array.isArray(o.sections)) return false
  return true
}
