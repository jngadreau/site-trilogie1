/**
 * Réaligne chaque deck-landing/*.json sur DECK_LANDING_SECTION_ORDER + deck-landing-variants.json.
 * Conserve props/media quand id + variant correspondent ; sinon remplace par des défauts éditoriaux.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const variantsPath = path.join(root, 'content/arbre-de-vie/deck-landing-variants.json')
const landingsDir = path.join(root, 'content/generated/arbre-de-vie/deck-landings')

const ORDER = [
  'hero',
  'deck_identity',
  'for_who',
  'outcomes',
  'how_to_use',
  'in_the_box',
  'faq',
  'creator',
  'related_decks',
  'cta_band',
]

const DEFAULTS = {
  HeroSplitImageRight: () => ({
    title: "L'Oracle de l'Arbre de Vie",
    subtitle: 'Oracle de présence et de cycles',
    bodyMarkdown:
      '**64 cartes** en format marque-page : images intuitives et messages longs pour accompagner tes transitions avec douceur.',
    ctaLabel: 'Découvrir',
    ctaHref: '#identite',
    imageUrl: '/ai/generated-images/banner-1.png',
    imageAlt: 'Arbre stylisé, lumière dorée et calme',
  }),
  HeroFullBleed: () => ({
    title: "L'Oracle de l'Arbre de Vie",
    tagline: 'Racines, branches, sagesse du vivant',
    bodyMarkdown:
      'Un oracle **canalisé** pour nommer ce que tu ressens et avancer au rythme de la nature.',
    ctaLabel: 'Découvrir le jeu',
    ctaHref: '#identite',
    imageUrl: '/ai/generated-images/banner-1.png',
    imageAlt: 'Forêt brumeuse, lumière douce',
    overlayOpacity: 0.48,
  }),
  HeroGlowVault: () => ({
    kicker: 'Oracle 64 cartes',
    title: "L'Oracle de l'Arbre de Vie",
    bodyMarkdown:
      '**32 cartes Images** + **32 Messages longs**, étui transparent et livret : un compagnon portable pour tes rituels du quotidien.',
    ctaLabel: 'Voir le contenu',
    ctaHref: '#contenu',
    imageUrl: '/ai/generated-images/banner-1.png',
    imageAlt: 'Ambiance boisée et lumineuse',
    glowIntensity: 0.68,
  }),
  HeroParallaxLayers: () => ({
    eyebrow: 'Arbre de vie',
    title: "L'Oracle de l'Arbre de Vie",
    strapline: 'Écouter la forêt intérieure',
    bodyMarkdown:
      'Tirages **Sève du jour**, **Racines et cime**, **Équilibre des branches** : des clés simples pour t’ancrer et t’élargir.',
    ctaLabel: 'Découvrir',
    ctaHref: '#identite',
    imageUrl: '/ai/generated-images/banner-1.png',
    imageAlt: 'Paysage forestier en profondeur',
    spineLabel: 'Oracle',
  }),
  HeroCardsFan: () => ({
    title: "L'Oracle de l'Arbre de Vie",
    kicker: 'Format marque-page',
    bodyMarkdown:
      'Glisse une carte dans ton livre ou ton sac : **guidance immédiate** ou méditation plus longue selon ton besoin.',
    ctaLabel: 'Découvrir',
    ctaHref: '#identite',
    cards: [5, 22, 38, 51, 63].map((n) => ({
      imageUrl: `/ai/generated-images/deck-cards/card_${n}_front.png`,
      alt: `Carte ${n} du jeu`,
    })),
  }),
  HeroCardsStrip: () => ({
    title: "L'Oracle de l'Arbre de Vie",
    subtitle: 'Aperçu des cartes',
    bodyMarkdown: 'Un duo **Image + Message** pour chaque thème : éclair rapide ou conseil détaillé.',
    ctaLabel: 'Découvrir',
    ctaHref: '#identite',
    cards: [2, 11, 24, 35, 44, 52].map((n) => ({
      imageUrl: `/ai/generated-images/deck-cards/card_${n}_front.png`,
      alt: `Carte ${n}`,
    })),
  }),
  HeroCardsMosaic: () => ({
    title: "L'Oracle de l'Arbre de Vie",
    tagline: '64 chemins de guidance',
    bodyMarkdown:
      'Créé par **Hélène Durand** (Ose Un Pas Vers Toi), inspiré de la symbolique de l’Arbre de Vie.',
    ctaLabel: 'Découvrir',
    ctaHref: '#identite',
    cards: [7, 18, 29, 40, 55].map((n) => ({
      imageUrl: `/ai/generated-images/deck-cards/card_${n}_front.png`,
      alt: `Carte ${n}`,
    })),
  }),
  IdentityPanel: () => ({
    deckName: "L'Oracle de l'Arbre de Vie",
    tagline: 'Racines, élévation et sagesse du vivant',
    badge: 'Oracle canalisé',
    bodyMarkdown:
      '**64 cartes** : moitié Images (mot-clé + message court), moitié Messages longs (conseils, visualisations, affirmations). **Livret** avec rituels, tirages et interprétations.',
  }),
  IdentityMinimal: () => ({
    eyebrow: 'Oracle',
    title: "L'Oracle de l'Arbre de Vie",
    oneLiner:
      'Un jeu **marque-page** pour cultiver intuition et équilibre au fil des saisons intérieures.',
  }),
  ForWhoTwoColumns: () => ({
    title: 'Pour qui ?',
    leftMarkdown:
      '- En quête d’**ancrage** et de clarté émotionnelle\n- Sensible à la **nature** et aux symboles du vivant\n- Envie d’un outil **simple** au quotidien',
    rightMarkdown:
      '- **Méditation** ou journal : prolonger la pratique avec des cartes\n- **Accompagnant·e** : médiation visuelle douce\n- **Débutant·e** : livret guidé pour démarrer',
  }),
  ForWhoPillars: () => ({
    title: 'Pour qui cet oracle ?',
    introMarkdown: 'Trois visages du public qui trouvent une résonance dans l’Arbre de Vie.',
    pillars: [
      {
        title: 'Chercheur·seuse de sens',
        bodyMarkdown: 'Tu veux **nommer** ce que tu traverses sans te perdre dans les concepts.',
      },
      {
        title: 'Amoureux·se de la nature',
        bodyMarkdown: 'Tu écoutes les **cycles**, la sève, le vent : l’oracle prolonge ce langage.',
      },
      {
        title: 'En transition',
        bodyMarkdown: 'Changement, deuil, renouveau : les cartes offrent des **repères** tendres.',
      },
    ],
  }),
  OutcomesBentoGrid: () => ({
    sectionTitle: 'Ce que tu peux en retirer',
    introMarkdown:
      'Des fruits concrets pour ton chemin : clarté, rituels et profondeur, sans promesse magique.',
    cells: [
      { title: 'Guidance du jour', bodyMarkdown: 'Une **Image** ou un **Message** pour cadrer ta journée.', span: 'wide' },
      { title: 'Tirages guidés', bodyMarkdown: 'Sève du jour, racines et cime, branches : méthodes dans le **livret**.', span: 'tall' },
      { title: 'Nomade', bodyMarkdown: '**Étui transparent** + format marque-page : emporte une carte partout.', span: 'tall' },
      { title: 'Profondeur', bodyMarkdown: 'Messages longs avec **visualisations** et affirmations.', span: 'wide' },
      { title: 'Solo ou duo', bodyMarkdown: 'Combine Image + Message pour **équilibre** intuition / détail.' },
      {
        title: 'Trilogie Créaticards',
        bodyMarkdown: 'Complète avec *Ganesh* et *Voix chamaniques* pour des lectures croisées.',
        span: 'featured',
      },
    ],
  }),
  OutcomesSignalStrip: () => ({
    sectionTitle: 'Les bienfaits',
    introMarkdown: 'Quatre axes souvent ressentis par celles et ceux qui tirent régulièrement les cartes.',
    signals: [
      { label: 'Clarté', detailMarkdown: 'Une **image** ou une phrase qui pose les choses simplement.' },
      { label: 'Rituel', detailMarkdown: 'Un geste court pour **marquer** le passage entre avant et après.' },
      { label: 'Ancrage', detailMarkdown: 'Des repères **sensoriels** (écorce, racine, brise) pour le corps.' },
      { label: 'Ouverture', detailMarkdown: 'Des questions qui **élargissent** sans imposer une vérité unique.' },
    ],
  }),
  HowToNumbered: () => ({
    title: 'Comment utiliser l’oracle',
    introMarkdown: 'Quelques minutes suffisent ; tu peux approfondir avec le livret quand tu veux.',
    steps: [
      {
        title: 'Préparer',
        bodyMarkdown: 'Espace calme, **intention** claire (ex. « Quelle sève aujourd’hui ? »).',
      },
      {
        title: 'Tirer',
        bodyMarkdown: 'Mélange, coupe ou laisse une carte **sauter**. 1 carte pour le jour ; 2–4 pour un thème.',
      },
      {
        title: 'Lire',
        bodyMarkdown: 'Commence par l’**Image** pour l’instantané, puis le **Message long** si tu veux du détail.',
      },
      {
        title: 'Ancrer',
        bodyMarkdown: 'Note une phrase, respire, glisse la carte dans l’**étui** comme rappel.',
      },
    ],
  }),
  HowToTimeline: () => ({
    title: 'Déroulé d’un tirage',
    introMarkdown: 'Une frise simple pour honorer le temps du jeu.',
    steps: [
      { label: 'Silence', detailMarkdown: 'Mains sur le paquet, **trois respirations**, question posée.' },
      { label: 'Choix', detailMarkdown: 'Mélange jusqu’à ressentir un **stop** ; fais confiance au geste.' },
      { label: 'Lecture', detailMarkdown: 'Lis à voix haute puis **reformule** avec tes mots.' },
      { label: 'Action', detailMarkdown: 'Choisis **un** geste concret pour les prochaines 24 h.' },
    ],
  }),
  IncludedChecklist: () => ({
    sectionTitle: 'Dans la boîte',
    introMarkdown:
      'Tout ce qu’il faut pour commencer : cartes, livret et protection pour transporter ton oracle.',
    items: [
      {
        title: '64 cartes marque-page',
        detailMarkdown:
          '**32 cartes Images** (mot-clé + message court) et **32 cartes Messages longs** (conseils détaillés, visualisations).',
      },
      {
        title: 'Livret d’accompagnement',
        detailMarkdown: 'Rituels de purification, **méthodes de tirage**, interprétations et pistes de réflexion.',
      },
      {
        title: 'Étui transparent',
        detailMarkdown: 'Protège le jeu et permet de **glisser une carte** dans un livre ou un sac.',
      },
      {
        title: 'Format physique',
        detailMarkdown: 'Marque-pages rigides, pensés pour une manipulation **quotidienne** et nomade.',
      },
    ],
  }),
  IncludedHighlightGrid: () => ({
    sectionTitle: 'Contenu du jeu',
    introMarkdown: 'L’essentiel en un coup d’œil avant ta première coupe.',
    highlights: [
      {
        title: '64 cartes',
        bodyMarkdown: 'Duo **Image / Message** pour chaque thème — du flash intuitif au conseil approfondi.',
      },
      {
        title: 'Livret',
        bodyMarkdown: 'Tirages, symbolique et **exemples** pour t’approprier le jeu sans te presser.',
      },
      {
        title: 'Étui',
        bodyMarkdown: 'Protection légère et **rappel visuel** : garde une carte sous les yeux.',
      },
      {
        title: 'Création',
        bodyMarkdown: 'Canalisé par **Hélène Durand** — univers Arbre de Vie, cycles et sagesse du vivant.',
      },
    ],
  }),
  FaqAccordion: () => ({
    sectionTitle: 'Questions fréquentes',
    introMarkdown: 'Réponses courtes sur l’usage et le contenu — le livret va plus en profondeur.',
    items: [
      {
        question: 'Différence entre carte Image et Message long ?',
        answerMarkdown:
          'L’**Image** donne un éclair rapide (mot-clé + texte court). Le **Message long** développe conseils, visualisation et affirmation.',
      },
      {
        question: 'Je débute : par où commencer ?',
        answerMarkdown:
          'Lis les pages d’introduction du **livret**, fais un tirage « Sève du jour » avec une seule carte, note ton ressenti.',
      },
      {
        question: 'Puis-je mélanger avec d’autres oracles ?',
        answerMarkdown:
          'Oui — beaucoup complètent avec *L’Oracle de Ganesh* ou *Les Voix chamaniques* pour des lectures croisées.',
      },
      {
        question: 'Y a-t-il des promesses de guérison ?',
        answerMarkdown:
          'Non. L’oracle est un **outil d’introspection** et d’accompagnement, pas un substitut à un soin médical ou psychologique.',
      },
    ],
  }),
  FaqTwoColumn: () => ({
    sectionTitle: 'FAQ',
    introMarkdown: 'À gauche : achat et matériel. À droite : pratique des tirages.',
    leftColumnTitle: 'Achat & boîte',
    rightColumnTitle: 'Tirages',
    leftItems: [
      {
        question: 'Que contient exactement le jeu ?',
        answerMarkdown: '**64 cartes**, un **livret** et un **étui transparent**.',
      },
      {
        question: 'Le format marque-page, c’est pratique ?',
        answerMarkdown:
          'Oui pour le **quotidien** : une carte tient dans un livre, un carnet ou une poche de sac.',
      },
    ],
    rightItems: [
      {
        question: 'Combien de cartes pour un tirage ?',
        answerMarkdown:
          'Souvent **1** pour le jour ; **2 à 4** pour explorer une situation (voir le livret pour les propositions).',
      },
      {
        question: 'Faut-il purifier les cartes ?',
        answerMarkdown:
          'Le livret propose des rituels **simples** (souffle, intention, sauge) — adapte à tes croyances.',
      },
    ],
  }),
  CreatorSpotlight: () => ({
    sectionTitle: 'La créatrice',
    name: 'Hélène Durand',
    roleLabel: 'Canalisatrice · Ose Un Pas Vers Toi',
    bodyMarkdown:
      'Hélène conçoit des oracles ancrés dans le **vivant** et l’écoute intérieure. *L’Oracle de l’Arbre de Vie* invite à honorer les cycles sans se presser.',
    ctaLabel: 'Ose Un Pas Vers Toi',
    ctaHref: 'https://oseunpasverstoi.fr',
  }),
  CreatorQuoteBand: () => ({
    quoteMarkdown:
      '*« Les cartes ne décident pas à ta place : elles t’aident à entendre ce que tu sais déjà un peu. »*',
    name: 'Hélène Durand',
    roleLine: 'Créatrice — Créaticards',
  }),
  RelatedDecksGrid: () => ({
    sectionTitle: 'La trilogie Créaticards',
    introMarkdown: 'Combine les trois univers pour des lectures plus riches.',
    decks: [
      {
        deckName: "L'Oracle de l'Arbre de Vie",
        tagline: 'Cycles · nature',
        bodyMarkdown: 'Tu es sur cette fiche : guidance **Image + Message**, 64 cartes.',
        href: '/oracle-arbre-de-vie',
        ctaLabel: 'Ce jeu',
      },
      {
        deckName: "L'Oracle de Ganesh",
        tagline: 'Obstacles · sagesse',
        bodyMarkdown: 'Débloquer avec **bienveillance** ce qui résiste.',
        href: '/oracle-ganesh',
      },
      {
        deckName: 'Les Voix chamaniques',
        tagline: 'Lignées · médecine',
        bodyMarkdown: 'Rituels et **dialogue** avec les mondes subtils.',
        href: '/voix-chamaniques',
      },
    ],
  }),
  RelatedDecksInline: () => ({
    sectionTitle: 'Autres oracles',
    introMarkdown: 'Liens vers les deux autres jeux de la même famille.',
    items: [
      {
        label: "L'Oracle de Ganesh",
        descriptionMarkdown: 'Pour les **montagnes** intérieures à gravir avec patience.',
        href: '/oracle-ganesh',
      },
      {
        label: 'Les Voix chamaniques',
        descriptionMarkdown: 'Pour le **souffle**, les ancêtres et la médecine symbolique.',
        href: '/voix-chamaniques',
      },
    ],
  }),
  CtaMarqueeRibbon: () => ({
    eyebrow: 'Prêt·e à écouter l’Arbre ?',
    headline: 'Accueille la guidance des racines et des branches',
    subline: '64 cartes, livret et étui — pour un compagnon de croissance au quotidien.',
    ctaLabel: 'Découvrir l’oracle',
    ctaHref: '/oracle-arbre-de-vie',
    marqueeText:
      'Racines · Sève · Branches · Cycles · Intuition · Nature · Rituel · Ancrage · Lumière · Douceur',
  }),
  CtaSplitAction: () => ({
    title: 'Passer à l’action',
    bodyMarkdown:
      'Commande le jeu, rejoins la communauté ou offre un oracle à quelqu’un qui traverse une saison intense.',
    primaryLabel: 'Voir la fiche produit',
    primaryHref: '/oracle-arbre-de-vie',
    secondaryLabel: 'Autres oracles Créaticards',
    secondaryHref: '/',
  }),
}

function buildSection(id, variant, existing) {
  const media = Array.isArray(existing?.media) ? existing.media : []
  if (existing && existing.variant === variant && existing.props && typeof existing.props === 'object') {
    return { id, variant, props: existing.props, media }
  }
  const gen = DEFAULTS[variant]
  if (!gen) throw new Error(`Variante sans défaut: ${variant}`)
  return { id, variant, props: gen(), media }
}

const variantsMap = JSON.parse(fs.readFileSync(variantsPath, 'utf8'))

for (const slug of Object.keys(variantsMap)) {
  const vmap = variantsMap[slug]
  const p = path.join(landingsDir, `${slug}.json`)
  if (!fs.existsSync(p)) {
    console.warn('skip missing', slug)
    continue
  }
  const doc = JSON.parse(fs.readFileSync(p, 'utf8'))
  const existingById = new Map(doc.sections.map((s) => [s.id, s]))
  doc.sections = ORDER.map((id) => buildSection(id, vmap[id], existingById.get(id)))
  fs.writeFileSync(p, JSON.stringify(doc, null, 2) + '\n', 'utf8')
  console.log('normalized', slug)
}
