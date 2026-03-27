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
}

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderDetailedLanding(
  spec: LandingSpec,
  cardFiles: string[],
): string {
  const t = spec.theme;
  const vars = `:root{--accent:${esc(t.accent)};--bg:${esc(t.background)};--surface:${esc(t.surface)};--text:${esc(t.text)};--font-h:${esc(t.fontHeading)};--font-b:${esc(t.fontBody)};}`;
  const max = Math.min(spec.cardStrip.maxCards || 6, cardFiles.length);
  const strip = cardFiles.slice(0, max);

  const cardsHtml =
    strip.length > 0
      ? `<div class="ld-card-strip">
        <h3 class="ld-card-strip-title">${esc(spec.cardStrip.title)}</h3>
        <p class="ld-card-caption">${marked.parse(spec.cardStrip.captionMarkdown || '') as string}</p>
        <div class="ld-card-grid">
          ${strip
            .map(
              (f) =>
                `<figure class="ld-card-fig"><img src="/cards/arbre-de-vie/${encodeURIComponent(f)}" alt="" loading="lazy" /></figure>`,
            )
            .join('')}
        </div>
      </div>`
      : `<p class="ld-placeholder">Aucune image carte dans <code>images-jeux/arbre_de_vie/</code> — exporte les PNG/JPG ou dézippe l’archive.</p>`;

  const sectionsHtml = spec.sections
    .map((sec) => {
      const inner = sec.bodyMarkdown
        ? (marked.parse(sec.bodyMarkdown) as string)
        : '';
      const cta =
        sec.cta?.label && sec.cta.href
          ? `<a class="ld-btn" href="${esc(sec.cta.href)}"${sec.cta.href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(sec.cta.label)}</a>`
          : '';
      if (sec.kind === 'hero') {
        return `<section class="ld-section ld-hero" id="${esc(sec.id)}">
          <h2 class="ld-hero-title">${esc(sec.title || '')}</h2>
          ${sec.subtitle ? `<p class="ld-hero-sub">${esc(sec.subtitle)}</p>` : ''}
          <div class="ld-hero-body">${inner}</div>
          ${cta}
        </section>`;
      }
      return `<section class="ld-section" id="${esc(sec.id)}">
        ${sec.title ? `<h3 class="ld-section-title">${esc(sec.title)}</h3>` : ''}
        <div class="ld-section-body">${inner}</div>
        ${cta}
      </section>`;
    })
    .join('');

  return `
    <div class="ld-root">
      <style>${vars}</style>
      <style>${spec.cssBase}</style>
      <div class="ld-wrap">
        <header class="ld-header">
          <h1 class="ld-title">${esc(spec.meta.title)}</h1>
          <p class="ld-desc">${esc(spec.meta.description)}</p>
        </header>
        ${sectionsHtml}
        ${cardsHtml}
      </div>
    </div>
  `;
}
