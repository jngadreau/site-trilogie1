/** Spec produite par Grok et stockée dans landing-spec.json */

export interface LandingSpecV1 {
  version: 1;
  meta: {
    title: string;
    description: string;
  };
  theme: {
    accent: string;
    background: string;
    surface: string;
    text: string;
    fontHeading: string;
    fontBody: string;
  };
  sections: LandingSection[];
  cardStrip: {
    title: string;
    captionMarkdown: string;
    maxCards: number;
  };
  htmlShell: string;
  cssBase: string;
  imagePrompts?: {
    heroBanner?: string;
    cardFan?: string;
  };
}

export type SectionKind = 'hero' | 'text' | 'cards' | 'cta';

export interface LandingSection {
  id: string;
  kind: SectionKind;
  title?: string;
  subtitle?: string;
  bodyMarkdown?: string;
  cta?: { label: string; href: string };
}
