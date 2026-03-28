import type { DeckLandingSectionId } from './deck-landing-section-order';

/**
 * Descriptions courtes (FR) pour l’admin / Grok — rôle éditorial de chaque type de section.
 */
export const DECK_SECTION_CATALOG_FR: Record<DeckLandingSectionId, string> = {
  hero: 'Accroche principale : titre, texte, CTA, image pleine largeur ou cartes en vedette.',
  deck_identity: 'Nom du jeu, promesse en une phrase, badge ou ton minimal.',
  for_who: 'Public cible : profils, besoins, niveau (débutant / avancé).',
  outcomes: 'Bénéfices ressentis : grille bento ou bandeau de « signaux ».',
  how_to_use: 'Comment tirer les cartes : étapes numérotées ou frise temporelle.',
  in_the_box: 'Contenu physique : cartes, livret, étui, format.',
  card_gallery: 'Grille ou défilement de faces de cartes (choix des numéros).',
  photo_gallery: 'Photos ambiance, coffret, lifestyle (hors simples faces cartes).',
  faq: 'Questions fréquentes : accordéon ou deux colonnes.',
  creator: 'Créatrice ou ligne éditoriale : portrait / citation.',
  testimonials: 'Avis ou citations : plusieurs courts ou un témoignage mis en avant.',
  newsletter_cta: 'Inscription e-mail : bloc centré ou colonnes texte + formulaire.',
  related_decks: 'Autres jeux de la même famille / trilogie.',
  cta_band: 'Dernière incitation à l’action : bandeau ou double bouton.',
};
