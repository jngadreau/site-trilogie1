import { renderDetailedLanding, type LandingSpec } from './landing-detailed';

const root = document.getElementById('root')!;

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function boot() {
  const params = new URLSearchParams(window.location.search);
  const wantGen =
    params.get('generate') === '1' ||
    params.get('generate') === 'true' ||
    params.get('gen') === '1';

  if (wantGen) {
    root.innerHTML =
      '<p class="ld-page-loading">Étape 1/2 — synthèse <code>game-context.md</code>…</p>';
    const ctx = await fetch('/site/generate-game-context', { method: 'POST' });
    if (!ctx.ok) {
      let detail = '';
      try {
        const j = (await ctx.json()) as { message?: string | string[] };
        detail = Array.isArray(j.message) ? j.message.join(' ') : (j.message ?? '');
      } catch {
        detail = await ctx.text();
      }
      root.innerHTML = `<p class="ld-page-error">Échec étape 1 (${ctx.status}). ${escapeHtml(detail || 'Vérifie GROK_API_KEY et les dossiers cartes / livret.')}</p>`;
      return;
    }
    root.innerHTML =
      '<p class="ld-page-loading">Étape 2/2 — spec landing (<code>landing-spec.json</code>)…</p>';
    const gen = await fetch('/site/generate-landing', { method: 'POST' });
    if (!gen.ok) {
      let detail = '';
      try {
        const j = (await gen.json()) as { message?: string | string[] };
        detail = Array.isArray(j.message) ? j.message.join(' ') : (j.message ?? '');
      } catch {
        detail = await gen.text();
      }
      root.innerHTML = `<p class="ld-page-error">Échec étape 2 (${gen.status}). ${escapeHtml(detail || 'Vérifie GROK_API_KEY et les prompts landing.')}</p>`;
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('generate');
    url.searchParams.delete('gen');
    window.history.replaceState({}, '', url.pathname + (url.search || ''));
  }

  root.innerHTML = '<p class="ld-page-loading">Chargement de la landing…</p>';

  const specRes = await fetch('/site/landing-spec');
  if (!specRes.ok) {
    if (specRes.status === 404) {
      root.innerHTML = `<p class="ld-page-error">Aucune spec (<code>landing-spec.json</code>). Ouvre avec <code>?generate=1</code> (pipeline contexte + landing) ou <code>npm run generate:site</code> (API 3040).</p>`;
    } else {
      root.innerHTML = `<p class="ld-page-error">Landing spec indisponible (${specRes.status}).</p>`;
    }
    return;
  }

  const spec = (await specRes.json()) as LandingSpec;
  const cardsRes = await fetch('/cards/arbre-de-vie');
  if (!cardsRes.ok) {
    root.innerHTML = `<p class="ld-page-error">Liste des cartes indisponible (${cardsRes.status}).</p>`;
    return;
  }
  const data = (await cardsRes.json()) as { files: string[] };
  const cardFiles = data.files ?? [];

  root.innerHTML = renderDetailedLanding(spec, cardFiles);

  if (spec.meta?.description) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', spec.meta.description);
  }

  document.title = spec.meta?.title
    ? `${spec.meta.title} — L’Arbre de Vie`
    : 'L’Arbre de Vie — landing détaillée';
}

void boot();
