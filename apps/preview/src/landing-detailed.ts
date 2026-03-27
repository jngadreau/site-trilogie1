import { marked } from 'marked';

export interface LandingSpec {
  version: 1;
  meta: { title: string; description: string };
  theme: {
    accent: string;
    background: string;
    surface: string;
    text: string;
    fontHeading: string;
    fontBody: string;
  };
  sections: Array<{
    id: string;
    kind: string;
    title?: string;
    subtitle?: string;
    bodyMarkdown?: string;
    cta?: { label: string; href: string };
  }>;
  cardStrip: {
    title: string;
    captionMarkdown: string;
    maxCards: number;
  };
  cssBase: string;
  htmlShell?: string;
  imagePrompts?: { heroBanner?: string; cardFan?: string };
  /** Présent si la spec a été régénérée après ajout API ; sinon complété depuis GET /cards/.../metadata. */
  cardFormat?: {
    physicalSizeMm: { width: number; height: number };
    cssAspectRatio: string;
    widthToHeightFromPixels?: number | null;
    pixelSample?: { file: string; width: number; height: number } | null;
  };
}

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(s: string) {
  return esc(s).replace(/'/g, '&#39;');
}

/** Grok échappe parfois les retours ligne dans le JSON. */
function normalizeSpecCss(css: string | undefined): string {
  if (!css) return '';
  return css.replace(/\\n/g, '\n').replace(/\\"/g, '"');
}

/** Première image listée parmi des noms possibles (fichiers générés). */
function pickAsset(names: string[], candidates: string[]): string | null {
  const set = new Set(names);
  for (const c of candidates) {
    if (set.has(c)) return c;
  }
  return null;
}

const HERO_ASSETS = ['landing-hero-from-spec.png', 'landing-hero-from-spec.webp'];
const FAN_ASSETS = ['landing-fan-from-cards.png'];

/**
 * Extrait l’URL Google Fonts du shell HTML produit par Grok (si présent).
 */
function extractGoogleFontsHref(htmlShell?: string): string | null {
  if (!htmlShell) return null;
  const m = htmlShell.match(/href="(https:\/\/fonts\.googleapis\.com[^"]+)"/i);
  return m?.[1] ?? null;
}

export function injectLandingFontLink(htmlShell?: string): void {
  const href = extractGoogleFontsHref(htmlShell);
  if (!href) return;
  const id = 'ld-landing-google-fonts';
  if (document.getElementById(id)) return;
  const pre = document.createElement('link');
  pre.rel = 'preconnect';
  pre.href = 'https://fonts.googleapis.com';
  pre.id = `${id}-pre`;
  const pre2 = document.createElement('link');
  pre2.rel = 'preconnect';
  pre2.href = 'https://fonts.gstatic.com';
  pre2.crossOrigin = '';
  pre2.id = `${id}-pre-g`;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(pre, pre2, link);
}

function ctaMarkup(
  cta: { label: string; href: string } | undefined,
  classNames: string,
): string {
  if (!cta?.label || !cta.href) return '';
  const ext = cta.href.startsWith('http');
  return `<a class="${classNames}" href="${escAttr(cta.href)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(cta.label)}</a>`;
}

/**
 * Rendu aligné sur les sélecteurs typiques de `cssBase` Grok (#hero, .hero-container, .section-title, .card-strip, .cta-button, …).
 */
export function renderDetailedLanding(
  spec: LandingSpec,
  cardFiles: string[],
  generatedImageFiles: string[],
  cardAspectCss = '51 / 153',
): string {
  const t = spec.theme;
  const vars = `:root{--accent:${esc(t.accent)};--background:${esc(t.background)};--surface:${esc(t.surface)};--text:${esc(t.text)};--font-h:${esc(t.fontHeading)};--font-b:${esc(t.fontBody)};}`;
  const cssRaw = normalizeSpecCss(spec.cssBase);

  const heroFile = pickAsset(generatedImageFiles, HERO_ASSETS);
  const fanFile = pickAsset(generatedImageFiles, FAN_ASSETS);

  const max = Math.min(spec.cardStrip.maxCards || 6, cardFiles.length);
  const strip = cardFiles.slice(0, max);

  const cardsStripHtml =
    strip.length > 0
      ? `<div class="card-strip" role="list">
          ${strip
            .map(
              (f) =>
                `<div class="card-preview" role="listitem"><img src="/cards/arbre-de-vie/${encodeURIComponent(f)}" alt="" loading="lazy" /></div>`,
            )
            .join('')}
        </div>`
      : `<p class="ld-placeholder">Aucune image carte dans <code>images-jeux/arbre_de_vie/</code>.</p>`;

  const fanSection =
    fanFile != null
      ? `<section class="ld-fan-wrap" aria-label="Aperçu éventail">
          <div class="container">
            <img class="ld-fan-image" src="/ai/generated-images/${encodeURIComponent(fanFile)}" alt="" width="1100" height="520" loading="lazy" decoding="async" />
          </div>
        </section>`
      : '';

  const sectionsHtml = spec.sections
    .map((sec) => {
      const inner = sec.bodyMarkdown
        ? (marked.parse(sec.bodyMarkdown) as string)
        : '';

      if (sec.kind === 'hero') {
        const heroImg =
          heroFile != null
            ? `<img src="/ai/generated-images/${encodeURIComponent(heroFile)}" alt="" width="1200" height="675" loading="eager" decoding="async" />`
            : '';
        return `<section id="${esc(sec.id)}">
          <div class="hero-container">
            <div class="hero-content">
              <h1 class="hero-title">${esc(sec.title || '')}</h1>
              ${sec.subtitle ? `<p class="hero-subtitle">${esc(sec.subtitle)}</p>` : ''}
              <div class="hero-body">${inner}</div>
              ${ctaMarkup(sec.cta, 'cta-button primary')}
            </div>
            <div class="hero-image">${heroImg}</div>
          </div>
        </section>`;
      }

      if (sec.kind === 'cta') {
        return `<section id="${esc(sec.id)}">
          <div class="cta-container">
            ${sec.title ? `<h2 class="section-title">${esc(sec.title)}</h2>` : ''}
            ${inner ? `<div class="cta-body">${inner}</div>` : ''}
            ${ctaMarkup(sec.cta, 'cta-button primary large')}
          </div>
        </section>`;
      }

      if (sec.kind === 'cards') {
        return `<section id="${esc(sec.id)}">
          <div class="container">
            ${sec.title ? `<h2 class="section-title">${esc(sec.title)}</h2>` : ''}
            <div class="section-body">${inner}</div>
            <h3 class="ld-strip-heading">${esc(spec.cardStrip.title)}</h3>
            <div class="ld-strip-intro">${marked.parse(spec.cardStrip.captionMarkdown || '') as string}</div>
            ${cardsStripHtml}
          </div>
        </section>`;
      }

      return `<section id="${esc(sec.id)}">
        <div class="container">
          ${sec.title ? `<h2 class="section-title">${esc(sec.title)}</h2>` : ''}
          <div class="section-body">${inner}</div>
          ${ctaMarkup(sec.cta, 'cta-button primary')}
        </div>
      </section>`;
    })
    .join('');

  return `
    <div class="ld-scope" style="--ld-card-aspect: ${escAttr(cardAspectCss)};">
      <style>${vars}</style>
      <style>
        /* Compléments : images dans les blocs prévus par Grok */
        .hero-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 20px;
          display: block;
          min-height: 280px;
        }
        .hero-image:empty {
          min-height: 280px;
          border-radius: 20px;
          background: linear-gradient(145deg, var(--accent, #4a7c59), transparent);
          opacity: 0.35;
        }
        .ld-strip-heading {
          font-family: var(--font-h, inherit);
          text-align: center;
          margin: 2rem 0 0.75rem;
          font-size: 1.35rem;
          color: var(--text, inherit);
        }
        .ld-strip-intro {
          text-align: center;
          max-width: 42rem;
          margin: 0 auto 1.5rem;
          opacity: 0.92;
        }
        .ld-strip-intro p { margin: 0.5rem 0; }
        .ld-fan-wrap {
          padding: 2rem 0 3rem;
          background: var(--surface, #fff);
        }
        .ld-fan-image {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 0 auto;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        }
        .section-body p:first-child { margin-top: 0; }
        .cta-body p:last-child { margin-bottom: 0; }
      </style>
      <style>${cssRaw}</style>
      <style>
        /* Après css Grok : grille 6 → 3 colonnes, image qui remplit le cadre (plus de bandes blanches). */
        .ld-scope main.ld-landing-main .card-strip {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: clamp(0.5rem, 1.5vw, 1.1rem);
          align-items: stretch;
          width: 100%;
          max-width: 100%;
          margin-left: auto;
          margin-right: auto;
        }
        @media (max-width: 960px) {
          .ld-scope main.ld-landing-main .card-strip {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 400px) {
          .ld-scope main.ld-landing-main .card-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        .ld-scope main.ld-landing-main .card-strip > .card-preview {
          position: relative;
          aspect-ratio: var(--ld-card-aspect, 51 / 153);
          width: 100%;
          min-width: 0;
          min-height: 0;
          overflow: hidden;
          border-radius: 12px;
          border: 1px solid var(--border, #e0e6d8);
          box-shadow: 0 8px 25px rgba(74, 124, 89, 0.12);
          background: var(--text, #2d3e2f);
        }
        .ld-scope main.ld-landing-main .card-strip > .card-preview > img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }
      </style>
      <main class="ld-landing-main">
        ${sectionsHtml}
        ${fanSection}
      </main>
    </div>
  `;
}
