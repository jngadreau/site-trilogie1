import type { DeckLandingGlobals } from '../types/deckLanding'

/** Palette et typo partagées pour les pages démo de sections. */
export const SECTION_DEMO_GLOBALS: DeckLandingGlobals = {
  accent: '#8B7355',
  background: '#F8F4F0',
  surface: '#FDFDFB',
  text: '#3D2B1F',
  textMuted: '#7A6652',
  fontHeading: "'Playfair Display', Georgia, serif",
  fontBody: "'Merriweather', 'Times New Roman', serif",
  radius: '16px',
  fontImportNote: 'Playfair Display + Merriweather',
  fontImportHref:
    'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&display=swap',
}

export const DEMO_HERO_IMAGE = '/ai/generated-images/banner-1.png'

export function demoCardUrl(n: number): string {
  return `/ai/generated-images/deck-cards/card_${n}_front.png`
}
