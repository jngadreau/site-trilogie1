import type { DeckSectionKey } from '../lib/deckSectionCatalog'
import { DEMO_HERO_IMAGE, demoCardUrl } from './sectionDemoGlobals'

export type SectionDemoBlock = {
  variant: string
  label: string
  props: Record<string, unknown>
}

const fanCards = [5, 22, 38, 51, 63].map((n) => ({
  imageUrl: demoCardUrl(n),
  alt: `Carte démo ${n} — face illustrée`,
}))

const stripCards = [2, 11, 24, 35, 44, 52].map((n) => ({
  imageUrl: demoCardUrl(n),
  alt: `Carte ${n}`,
}))

const mosaicCards = [7, 18, 29, 40, 55].map((n) => ({
  imageUrl: demoCardUrl(n),
  alt: `Carte ${n}`,
}))

export const SECTION_DEMO_FIXTURES: Record<DeckSectionKey, SectionDemoBlock[]> = {
  hero: [
    {
      variant: 'HeroSplitImageRight',
      label: 'HeroSplitImageRight',
      props: {
        title: "L'Oracle de l'Arbre de Vie",
        subtitle: 'Démo — image à droite',
        bodyMarkdown: 'Texte de démonstration pour comparer les héros. **Gras** et paragraphe.',
        ctaLabel: 'Action',
        ctaHref: '#',
        imageUrl: DEMO_HERO_IMAGE,
        imageAlt: 'Visuel de démonstration',
      },
    },
    {
      variant: 'HeroFullBleed',
      label: 'HeroFullBleed',
      props: {
        title: "L'Oracle de l'Arbre de Vie",
        tagline: 'Démo — plein écran',
        bodyMarkdown: 'Corps markdown court pour la démo du hero plein écran.',
        ctaLabel: 'Découvrir',
        ctaHref: '#',
        imageUrl: DEMO_HERO_IMAGE,
        imageAlt: 'Fond plein écran démo',
        overlayOpacity: 0.42,
      },
    },
    {
      variant: 'HeroGlowVault',
      label: 'HeroGlowVault',
      props: {
        kicker: 'Démo',
        title: "L'Oracle de l'Arbre de Vie",
        bodyMarkdown: 'Vault avec halo radial sur l’image.',
        ctaLabel: 'Suite',
        ctaHref: '#',
        imageUrl: DEMO_HERO_IMAGE,
        imageAlt: 'Vault démo',
        glowIntensity: 0.72,
      },
    },
    {
      variant: 'HeroParallaxLayers',
      label: 'HeroParallaxLayers',
      props: {
        eyebrow: 'Démo',
        title: "L'Oracle de l'Arbre de Vie",
        strapline: 'Couches parallaxe',
        bodyMarkdown: 'Effet de profondeur sur la même image en plusieurs plans.',
        ctaLabel: 'Voir',
        ctaHref: '#',
        imageUrl: DEMO_HERO_IMAGE,
        imageAlt: 'Parallax démo',
        spineLabel: 'Arbre',
      },
    },
    {
      variant: 'HeroCardsFan',
      label: 'HeroCardsFan',
      props: {
        title: "L'Oracle de l'Arbre de Vie",
        kicker: 'Cartes réelles (miroir API)',
        bodyMarkdown:
          'Éventail de cartes — lancer **POST /site/sync-deck-card-images** si les images manquent.',
        ctaLabel: 'CTA',
        ctaHref: '#',
        cards: fanCards,
      },
    },
    {
      variant: 'HeroCardsStrip',
      label: 'HeroCardsStrip',
      props: {
        title: "L'Oracle de l'Arbre de Vie",
        subtitle: 'Bandeau horizontal',
        bodyMarkdown: 'Défilement horizontal sur petit écran.',
        ctaLabel: 'CTA',
        ctaHref: '#',
        cards: stripCards,
      },
    },
    {
      variant: 'HeroCardsMosaic',
      label: 'HeroCardsMosaic',
      props: {
        title: "L'Oracle de l'Arbre de Vie",
        tagline: 'Mosaïque',
        bodyMarkdown: 'Une carte mise en avant + grille compacte.',
        ctaLabel: 'CTA',
        ctaHref: '#',
        cards: mosaicCards,
      },
    },
  ],
  deck_identity: [
    {
      variant: 'IdentityPanel',
      label: 'IdentityPanel',
      props: {
        deckName: "L'Oracle de l'Arbre de Vie",
        tagline: 'Démo identité — panneau',
        badge: 'Oracle',
        bodyMarkdown:
          '**Bloc identité** avec badge et texte riche pour la démo du panneau structuré.',
      },
    },
    {
      variant: 'IdentityMinimal',
      label: 'IdentityMinimal',
      props: {
        deckName: "L'Oracle de l'Arbre de Vie",
        tagline: 'Version minimaliste',
        bodyMarkdown: 'Moins de chrome, focus sur le nom et le sous-titre.',
      },
    },
  ],
  for_who: [
    {
      variant: 'ForWhoTwoColumns',
      label: 'ForWhoTwoColumns',
      props: {
        title: 'Pour qui ? (démo)',
        leftMarkdown: '- Première colonne **liste**.\n- Deuxième point.',
        rightMarkdown: '- Colonne droite.\n- **Accent** éditorial.',
      },
    },
    {
      variant: 'ForWhoPillars',
      label: 'ForWhoPillars',
      props: {
        title: 'Pour qui ? (piliers)',
        introMarkdown: 'Intro courte au-dessus des trois piliers.',
        pillars: [
          { title: 'Chercheur·seuse de sens', bodyMarkdown: 'Texte **pilier** un.' },
          { title: 'En transition', bodyMarkdown: 'Deuxième pilier, détail markdown.' },
          { title: 'Accompagnant·e', bodyMarkdown: 'Troisième pilier.' },
        ],
      },
    },
  ],
  outcomes: [
    {
      variant: 'OutcomesBentoGrid',
      label: 'OutcomesBentoGrid',
      props: {
        sectionTitle: 'Bienfaits (bento)',
        introMarkdown: 'Grille **bento** avec cellules de tailles variées.',
        cells: [
          { title: 'Clarté', bodyMarkdown: 'Cellule standard.' },
          { title: 'Ancrage', bodyMarkdown: '**Grande** cellule.', span: 'tall' },
          { title: 'Légèreté', bodyMarkdown: 'Autre cellule.' },
          { title: 'Rituel', bodyMarkdown: 'Cellule **large**.', span: 'wide' },
          { title: 'Synthèse', bodyMarkdown: 'Mise en avant.', span: 'featured' },
        ],
      },
    },
    {
      variant: 'OutcomesSignalStrip',
      label: 'OutcomesSignalStrip',
      props: {
        sectionTitle: 'Signaux (strip)',
        introMarkdown: 'Liste de **signaux** avec pulse décoratif.',
        signals: [
          { label: 'Intuition', detailMarkdown: 'Premier signal — *markdown*.' },
          { label: 'Patience', detailMarkdown: 'Deuxième signal.' },
          { label: 'Action douce', detailMarkdown: 'Troisième signal.' },
        ],
      },
    },
  ],
  how_to_use: [
    {
      variant: 'HowToNumbered',
      label: 'HowToNumbered',
      props: {
        title: 'Comment utiliser (numéroté)',
        introMarkdown: 'Étapes **numérotées** classiques.',
        steps: [
          { title: 'Préparer', bodyMarkdown: 'Installer le moment.' },
          { title: 'Tirer', bodyMarkdown: 'Choisir une ou plusieurs cartes.' },
          { title: 'Intégrer', bodyMarkdown: 'Noter et ancrer le message.' },
        ],
      },
    },
    {
      variant: 'HowToTimeline',
      label: 'HowToTimeline',
      props: {
        title: 'Comment utiliser (frise)',
        introMarkdown: 'Frise **verticale** avec repères.',
        steps: [
          { label: 'Étape A', detailMarkdown: 'Détail A.' },
          { label: 'Étape B', detailMarkdown: 'Détail B.' },
          { label: 'Étape C', detailMarkdown: 'Détail C.' },
        ],
      },
    },
  ],
  cta_band: [
    {
      variant: 'CtaMarqueeRibbon',
      label: 'CtaMarqueeRibbon',
      props: {
        eyebrow: 'Démo CTA',
        headline: 'Bandeau avec marquee',
        subline: 'Texte de soutien sous le titre.',
        ctaLabel: 'Action principale',
        ctaHref: '#',
        marqueeText: 'Mot un · Mot deux · Mot trois · Mot quatre',
      },
    },
    {
      variant: 'CtaSplitAction',
      label: 'CtaSplitAction',
      props: {
        title: 'CTA split',
        bodyMarkdown: 'Bloc **split** : texte à gauche, boutons à droite.',
        primaryLabel: 'Principal',
        primaryHref: '#',
        secondaryLabel: 'Secondaire',
        secondaryHref: '#',
      },
    },
  ],
}
