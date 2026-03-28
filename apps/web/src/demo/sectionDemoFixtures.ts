import type { DeckSectionKey } from '../lib/deckSectionCatalog'
import { DEMO_HERO_IMAGE, demoCardUrl } from './sectionDemoGlobals'

export type SectionDemoBlock = {
  variant: string
  label: string
  props: Record<string, unknown>
}

const fanCards = [5, 22, 38, 51, 63].map((n) => ({
  imageUrl: demoCardUrl(n),
  alt: `Carte oracle ${n} — face illustrée`,
}))

const stripCards = [2, 11, 24, 35, 44, 52].map((n) => ({
  imageUrl: demoCardUrl(n),
  alt: `Carte ${n} du jeu`,
}))

const mosaicCards = [7, 18, 29, 40, 55].map((n) => ({
  imageUrl: demoCardUrl(n),
  alt: `Carte ${n}`,
}))

/** Textes d’exemple alignés sur l’Oracle de l’Arbre de Vie (64 cartes, livret, étui, Créaticards). */
export const SECTION_DEMO_FIXTURES: Record<DeckSectionKey, SectionDemoBlock[]> = {
  hero: [
    {
      variant: 'HeroSplitImageRight',
      label: 'HeroSplitImageRight',
      props: {
        title: "L'Oracle de l'Arbre de Vie",
        subtitle: 'Racines, sève et branches pour ton quotidien',
        bodyMarkdown:
          '**64 cartes** en format marque-page : moitié **Images** (éclair intuitif), moitié **Messages longs** (conseils et visualisations). Un oracle canalisé pour accompagner tes cycles sans te presser.',
        ctaLabel: 'Voir le contenu du jeu',
        ctaHref: '#contenu',
        imageUrl: DEMO_HERO_IMAGE,
        imageAlt: 'Arbre stylisé, lumière dorée et calme forestier',
      },
    },
    {
      variant: 'HeroFullBleed',
      label: 'HeroFullBleed',
      props: {
        title: "L'Oracle de l'Arbre de Vie",
        tagline: 'Créé par Hélène Durand — Ose Un Pas Vers Toi',
        bodyMarkdown:
          'Inspiré de la **symbolique de l’Arbre de Vie** : équilibre terre et ciel, patience du vivant, intuition douce. Avec **livret** (tirages, rituels) et **étui transparent** pour emporter une carte partout.',
        ctaLabel: 'Découvrir les tirages',
        ctaHref: '#faq',
        imageUrl: DEMO_HERO_IMAGE,
        imageAlt: 'Forêt lumineuse, brume et troncs majestueux',
        overlayOpacity: 0.44,
      },
    },
    {
      variant: 'HeroGlowVault',
      label: 'HeroGlowVault',
      props: {
        kicker: 'Oracle 64 cartes · Créaticards',
        title: "L'Oracle de l'Arbre de Vie",
        bodyMarkdown:
          'Tirages **Sève du jour**, **Racines et cime**, **Équilibre des branches** : des clés simples pour nommer ce que tu traverses et avancer avec la nature comme alliée.',
        ctaLabel: 'Découvrir',
        ctaHref: '#identite',
        imageUrl: DEMO_HERO_IMAGE,
        imageAlt: 'Ambiance boisée chaleureuse et apaisante',
        glowIntensity: 0.7,
      },
    },
    {
      variant: 'HeroParallaxLayers',
      label: 'HeroParallaxLayers',
      props: {
        eyebrow: 'Trilogie spirituelle',
        title: "L'Oracle de l'Arbre de Vie",
        strapline: 'Complète Ganesh & Voix chamaniques',
        bodyMarkdown:
          'Un jeu **nomade** pour méditation, journal ou accompagnement : les cartes parlent au corps et à l’imaginaire, sans jargon imposé.',
        ctaLabel: 'Vers la FAQ',
        ctaHref: '#faq',
        imageUrl: DEMO_HERO_IMAGE,
        imageAlt: 'Paysage forestier en profondeur, lumière filtrée',
        spineLabel: 'Oracle',
      },
    },
    {
      variant: 'HeroCardsFan',
      label: 'HeroCardsFan',
      props: {
        title: "L'Oracle de l'Arbre de Vie",
        kicker: 'Aperçu des cartes (miroir API)',
        bodyMarkdown:
          'Visuels réels du jeu après **POST /site/sync-deck-card-images**. Chaque carte relie **mot-clé**, image et message long dans le livret.',
        ctaLabel: 'Contenu de la boîte',
        ctaHref: '#contenu',
        cards: fanCards,
      },
    },
    {
      variant: 'HeroCardsStrip',
      label: 'HeroCardsStrip',
      props: {
        title: "L'Oracle de l'Arbre de Vie",
        subtitle: 'Marque-pages rigides · étui inclus',
        bodyMarkdown:
          'Fais défiler pour voir la diversité des visuels. Le format se glisse dans un livre ou un agenda pour un **rappel discret** toute la journée.',
        ctaLabel: 'Découvrir',
        ctaHref: '#contenu',
        cards: stripCards,
      },
    },
    {
      variant: 'HeroCardsMosaic',
      label: 'HeroCardsMosaic',
      props: {
        title: "L'Oracle de l'Arbre de Vie",
        tagline: 'Duo Image + Message pour chaque thème',
        bodyMarkdown:
          '**32** cartes Images et **32** Messages longs : du flash intuitif au conseil détaillé, selon ton temps et ton besoin.',
        ctaLabel: 'Comment l’utiliser',
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
        tagline: 'Racines, élévation et sagesse du vivant',
        badge: 'Oracle canalisé',
        bodyMarkdown:
          '**64 cartes** pensées comme un compagnon de croissance : symboles naturels, cycles et invitation à l’écoute intérieure. **Livret** avec purification, méthodes de tirage et interprétations riches (visualisations, affirmations, questions).\n\nCréé par **Hélène Durand** — univers **Créaticards**, en résonance avec *L’Oracle de Ganesh* et *Les Voix chamaniques*.',
      },
    },
    {
      variant: 'IdentityMinimal',
      label: 'IdentityMinimal',
      props: {
        eyebrow: 'Créaticards · format marque-page',
        title: "L'Oracle de l'Arbre de Vie",
        oneLiner:
          '**64 cartes**, livret et étui : une guidance **intuitive et portable** pour honorer tes saisons intérieures.',
      },
    },
  ],
  for_who: [
    {
      variant: 'ForWhoTwoColumns',
      label: 'ForWhoTwoColumns',
      props: {
        title: 'Pour qui cet oracle ?',
        leftMarkdown:
          '**Tu cherches un rituel simple**\n\n- Poser une intention sans te noyer dans la théorie\n- Aimer les **images** qui parlent au ventre autant qu’à la tête\n- Tenir une **carte** près de toi dans la journée (livre, sac, table de chevet)',
        rightMarkdown:
          '**Tu es en mouvement intérieur**\n\n- Transition, question relationnelle ou professionnelle\n- Pratique de méditation, journal ou thérapie\n- Envie d’un outil **doux** qui ne te juge pas et ouvre des pistes',
      },
    },
    {
      variant: 'ForWhoPillars',
      label: 'ForWhoPillars',
      props: {
        title: 'Pour qui résonne l’Arbre ?',
        introMarkdown:
          'Trois profils fréquents — le jeu s’adapte à ton rythme, seul·e ou avec un cercle de confiance.',
        pillars: [
          {
            title: 'Sensibles à la nature',
            bodyMarkdown:
              'Tu entends déjà les **cycles** (bourgeon, feuille, fruit) dans ta vie : l’oracle donne des mots pour les traverser avec tendresse.',
          },
          {
            title: 'Accompagnant·e ou praticien·ne',
            bodyMarkdown:
              'Tu proposes des **espaces d’écoute** : les cartes deviennent une médiation visuelle pour ouvrir la parole sans forcer.',
          },
          {
            title: 'Curieux·ses du tirage intuitif',
            bodyMarkdown:
              'Tu débutes : le **livret** guide tes premiers pas (Sève du jour, racines et cime, etc.) sans promesse de miracle.',
          },
        ],
      },
    },
  ],
  outcomes: [
    {
      variant: 'OutcomesBentoGrid',
      label: 'OutcomesBentoGrid',
      props: {
        sectionTitle: 'Ce que tu cultiv avec l’oracle',
        introMarkdown:
          'Pas de baguette magique : des **repères** concrets, du vocabulaire pour tes émotions et des rituels courts pour ancrer les prises de conscience.',
        cells: [
          {
            title: 'Guidance du jour',
            bodyMarkdown:
              'Une **Image** ou un **Message** pour cadrer ta journée : un mot-clé, une image forte, une piste d’action.',
            span: 'wide',
          },
          {
            title: 'Profondeur quand tu as le temps',
            bodyMarkdown:
              'Les **Messages longs** déploient conseils, **visualisations** et affirmations — comme une mini méditation écrite.',
            span: 'tall',
          },
          {
            title: 'Nomade & discret',
            bodyMarkdown:
              '**Étui transparent** + format marque-page : une carte dans le livre ou le carnet, sans encombrer ton sac.',
            span: 'tall',
          },
          {
            title: 'Tirages nommés',
            bodyMarkdown:
              '**Sève du jour**, **Racines et cime**, **Équilibre des branches**… Des structures proposées dans le livret pour ne jamais partir de zéro.',
            span: 'wide',
          },
          {
            title: 'Rituels doux',
            bodyMarkdown: 'Purification au souffle, sauge ou intention : le livret propose des **gestes simples** avant/après tirage.',
          },
          {
            title: 'Univers Créaticards',
            bodyMarkdown:
              'Enrichis ta pratique avec **Ganesh** (obstacles & sagesse) et **Voix chamaniques** (lignées & médecine) pour des lectures croisées.',
            span: 'featured',
          },
        ],
      },
    },
    {
      variant: 'OutcomesSignalStrip',
      label: 'OutcomesSignalStrip',
      props: {
        sectionTitle: 'Les bienfaits souvent ressentis',
        introMarkdown:
          'Chaque personne vit l’oracle différemment ; voici ce que beaucoup disent retrouver au fil des tirages.',
        signals: [
          {
            label: 'Clarté',
            detailMarkdown:
              'Une **image** ou une phrase qui pose les choses simplement, sans te enfermer dans une étiquette.',
          },
          {
            label: 'Rituel',
            detailMarkdown:
              'Le geste de **mélanger**, de couper, de poser la carte : une pause respirable dans la journée.',
          },
          {
            label: 'Ancrage',
            detailMarkdown:
              'Des symboles **végétaux** (racine, sève, cime) pour redescendre dans le corps et le présent.',
          },
          {
            label: 'Ouverture',
            detailMarkdown:
              'Des **questions** plutôt que des sentences : tu restes acteur·rice de tes choix.',
          },
        ],
      },
    },
  ],
  how_to_use: [
    {
      variant: 'HowToNumbered',
      label: 'HowToNumbered',
      props: {
        title: 'Comment utiliser l’Oracle de l’Arbre de Vie',
        introMarkdown:
          'De trois minutes à une demi-heure : adapte le temps au besoin. Le livret détaille d’autres méthodes et variantes.',
        steps: [
          {
            title: 'Installer le moment',
            bodyMarkdown:
              'Espace calme, jeu devant toi. **Intention** simple : « Quelle sève pour moi aujourd’hui ? » ou une question précise. Purifie si tu le souhaites (souffle, sauge).',
          },
          {
            title: 'Mélanger et tirer',
            bodyMarkdown:
              'Mélange jusqu’à sentir un stop. **1 carte** pour le jour ; **2 à 4** pour un thème (voir livret : Racines et cime, Branches, etc.).',
          },
          {
            title: 'Lire Image puis Message',
            bodyMarkdown:
              'Commence par la **carte Image** pour l’impact visuel et le mot-clé ; ouvre le **Message long** du même thème si tu veux du détail.',
          },
          {
            title: 'Ancrer et refermer',
            bodyMarkdown:
              'Note une phrase, respire, glisse une carte dans l’**étui** comme rappel. Remercie le jeu avant de ranger — le livret propose d’autres rituels de clôture.',
          },
        ],
      },
    },
    {
      variant: 'HowToTimeline',
      label: 'HowToTimeline',
      props: {
        title: 'Frise d’un tirage conscient',
        introMarkdown:
          'Une lecture peut être courte ; l’important est le **lien** que tu crées entre la carte et ta vie.',
        steps: [
          {
            label: 'Silence',
            detailMarkdown:
              'Mains sur le paquet, **trois respirations**, question posée à voix basse ou par écrit.',
          },
          {
            label: 'Choix',
            detailMarkdown:
              'Coupe, mélange ou laisse une carte **sauter** : fais confiance au geste, sans chercher la « bonne » technique.',
          },
          {
            label: 'Lecture',
            detailMarkdown:
              'Lis à voix haute puis **reformule** avec tes mots. Où ça résonne dans le corps ? Quelle émotion nommer ?',
          },
          {
            label: 'Action',
            detailMarkdown:
              'Choisis **un** micro-geste pour les prochaines 24 h : message à envoyer, marche, repos, dessin…',
          },
        ],
      },
    },
  ],
  in_the_box: [
    {
      variant: 'IncludedChecklist',
      label: 'IncludedChecklist',
      props: {
        sectionTitle: 'Dans la boîte',
        introMarkdown:
          'Tout le nécessaire pour commencer : cartes, protection et livret pédagogique — sans matériel imposé (tapis, bougies : optionnel).',
        items: [
          {
            title: '64 cartes marque-page',
            detailMarkdown:
              '**32 Images** (message court + visuel) et **32 Messages longs** (développement, visualisation, affirmation) pour chaque thème.',
          },
          {
            title: 'Livret d’accompagnement',
            detailMarkdown:
              'Rituels de **purification**, méthodes de **tirage**, interprétations et pistes de réflexion — en français.',
          },
          {
            title: 'Étui transparent',
            detailMarkdown:
              'Protège le jeu et permet de **transporter une carte** seule : dans un livre, un agenda ou une poche.',
          },
          {
            title: 'Format physique pensé pour le quotidien',
            detailMarkdown:
              'Cartes rigides, format **marque-page** : manipulation agréable et rangement facile.',
          },
        ],
      },
    },
    {
      variant: 'IncludedHighlightGrid',
      label: 'IncludedHighlightGrid',
      props: {
        sectionTitle: 'Contenu du jeu en un coup d’œil',
        introMarkdown:
          'L’essentiel avant ta première coupe — le livret approfondit chaque point (symboles, exemples de tirages).',
        highlights: [
          {
            title: '64 cartes',
            bodyMarkdown:
              'Structure **duo** : pour chaque thème, une carte Image rapide et une carte Message long pour creuser.',
          },
          {
            title: 'Livret',
            bodyMarkdown:
              '**Tirages** suggérés, glossaire des intentions, conseils pour débuter sans se prendre la tête.',
          },
          {
            title: 'Étui',
            bodyMarkdown:
              'Léger, visible : tu repères vite ta **carte du jour** sans ouvrir tout le jeu.',
          },
          {
            title: 'Ligne éditoriale',
            bodyMarkdown:
              'Univers **Arbre de Vie**, cycles naturels, ton **bienveillant** — pas de fatalité ni de promesse médicale.',
          },
        ],
      },
    },
  ],
  faq: [
    {
      variant: 'FaqAccordion',
      label: 'FaqAccordion',
      props: {
        sectionTitle: 'Questions fréquentes',
        introMarkdown:
          'Réponses courtes ; pour l’interprétation fine de chaque carte, le **livret** reste la référence.',
        items: [
          {
            question: 'Quelle différence entre carte Image et Message long ?',
            answerMarkdown:
              'La carte **Image** donne un éclair (mot-clé + texte court + illustration). Le **Message long** du même thème développe le conseil, une visualisation et souvent une affirmation.',
          },
          {
            question: 'Je n’ai jamais tiré les cartes : par où commencer ?',
            answerMarkdown:
              'Lis l’intro du livret, puis fais un tirage **Sève du jour** avec **une seule** carte Image ou un Message. Note une phrase ; c’est déjà un bon début.',
          },
          {
            question: 'Puis-je combiner avec d’autres oracles Créaticards ?',
            answerMarkdown:
              'Oui. Beaucoup croisent avec **Ganesh** (blocages, sagesse) ou **Voix chamaniques** (ancrage, lignées) pour des lectures à plusieurs voix.',
          },
          {
            question: 'L’oracle remplace-t-il un suivi médical ou psychologique ?',
            answerMarkdown:
              '**Non.** C’est un outil d’**introspection** et d’accompagnement personnel, pas un substitut à un soin professionnel.',
          },
        ],
      },
    },
    {
      variant: 'FaqTwoColumn',
      label: 'FaqTwoColumn',
      props: {
        sectionTitle: 'FAQ — achat & pratique',
        introMarkdown:
          'À gauche : matériel et commande. À droite : usage au quotidien.',
        leftColumnTitle: 'Boîte & achat',
        rightColumnTitle: 'Tirages',
        leftItems: [
          {
            question: 'Que contient exactement le coffret ?',
            answerMarkdown:
              '**64 cartes**, un **livret** et un **étui transparent**. Rien d’autre n’est obligatoire pour jouer.',
          },
          {
            question: 'Le format marque-page tient dans un livre ?',
            answerMarkdown:
              'Oui : c’est pensé pour glisser une **carte du jour** dans un roman, un carnet de gratitude ou un classeur.',
          },
        ],
        rightItems: [
          {
            question: 'Combien de cartes pour un tirage « classique » ?',
            answerMarkdown:
              'Souvent **1** pour le jour. Pour une question plus large, le livret propose des **grilles** à 2, 3 ou 4 cartes.',
          },
          {
            question: 'Faut-il « purifier » le jeu ?',
            answerMarkdown:
              'Optionnel. Le livret suggère des gestes **simples** (souffle, intention, sauge) — fais ce qui a du sens pour toi.',
          },
        ],
      },
    },
  ],
  creator: [
    {
      variant: 'CreatorSpotlight',
      label: 'CreatorSpotlight',
      props: {
        sectionTitle: 'La créatrice',
        name: 'Hélène Durand',
        roleLabel: 'Canalisatrice · Ose Un Pas Vers Toi',
        bodyMarkdown:
          'Hélène imagine des oracles qui **honorent le vivant** : cycles, dualités, lenteur du germe qui devient arbre. *L’Oracle de l’Arbre de Vie* prolonge cette ligne — pas de fatalité, des **questions** et des images qui donnent du vocabulaire à l’intuition.\n\nElle accompagne aussi la **trilogie Créaticards** avec *Ganesh* et *Les Voix chamaniques* pour des lectures croisées.',
        imageUrl: DEMO_HERO_IMAGE,
        imageAlt: 'Portrait ou ambiance associée à la créatrice (placeholder démo)',
        ctaLabel: 'Découvrir Ose Un Pas Vers Toi',
        ctaHref: 'https://oseunpasverstoi.fr',
      },
    },
    {
      variant: 'CreatorQuoteBand',
      label: 'CreatorQuoteBand',
      props: {
        quoteMarkdown:
          '*« Je crée des jeux pour que personne ne se sente seul·e face à ce qu’il traverse — la nature et les cartes peuvent être des témoins tendres. »*',
        name: 'Hélène Durand',
        roleLine: 'Créatrice — Ose Un Pas Vers Toi · Créaticards',
      },
    },
  ],
  related_decks: [
    {
      variant: 'RelatedDecksGrid',
      label: 'RelatedDecksGrid',
      props: {
        sectionTitle: 'La trilogie Créaticards',
        introMarkdown:
          'Trois univers complémentaires : **obstacles & sagesse**, **Arbre de Vie**, **lignées & médecine**. Les mélanger enrichit les tirages.',
        decks: [
          {
            deckName: 'L’Oracle de l’Arbre de Vie',
            tagline: 'Cycles · équilibre terre-ciel',
            bodyMarkdown:
              'Tu es ici : **64 cartes** duo Image/Message, livret de tirages et étui nomade.',
            href: '/oracle-arbre-de-vie',
            ctaLabel: 'Ce jeu',
          },
          {
            deckName: 'L’Oracle de Ganesh',
            tagline: 'Obstacles · ouverture',
            bodyMarkdown:
              'Pour nommer ce qui bloque et demander une **sagesse** qui déplace les montagnes, pas à pas.',
            href: '/oracle-ganesh',
          },
          {
            deckName: 'Les Voix chamaniques',
            tagline: 'Ancêtres · médecine du souffle',
            bodyMarkdown:
              'Explorer les **lignées**, les soins symboliques et les messages du non-humain avec respect.',
            href: '/voix-chamaniques',
          },
        ],
      },
    },
    {
      variant: 'RelatedDecksInline',
      label: 'RelatedDecksInline',
      props: {
        sectionTitle: 'Poursuivre avec…',
        introMarkdown: 'Liens rapides vers les **deux autres piliers** de la trilogie (URLs de démo).',
        items: [
          {
            label: 'L’Oracle de Ganesh',
            descriptionMarkdown: 'Quand le chemin semble **bouché** — une autre voix pour débloquer avec douceur.',
            href: '/oracle-ganesh',
          },
          {
            label: 'Les Voix chamaniques',
            descriptionMarkdown: 'Pour le **souffle**, les rituels et le dialogue avec les mondes invisibles.',
            href: '/voix-chamaniques',
          },
        ],
      },
    },
  ],
  cta_band: [
    {
      variant: 'CtaMarqueeRibbon',
      label: 'CtaMarqueeRibbon',
      props: {
        eyebrow: 'Oracle de l’Arbre de Vie',
        headline: 'Accueille la sagesse des racines et des branches',
        subline:
          '64 cartes, livret et étui — pour un rituel doux au rythme de ta vie.',
        ctaLabel: 'Découvrir l’oracle',
        ctaHref: '/oracle-arbre-de-vie',
        marqueeText:
          'Sève · Racines · Branches · Cycles · Intuition · Nature · Rituel · Créaticards · Ancrage',
      },
    },
    {
      variant: 'CtaSplitAction',
      label: 'CtaSplitAction',
      props: {
        title: 'Passer à l’action',
        bodyMarkdown:
          'Commande **L’Oracle de l’Arbre de Vie**, découvre les autres jeux de la **trilogie** ou offre un oracle à quelqu’un qui traverse une saison intense.',
        primaryLabel: 'Fiche produit',
        primaryHref: '/oracle-arbre-de-vie',
        secondaryLabel: 'Autres oracles',
        secondaryHref: '/',
      },
    },
  ],
}
