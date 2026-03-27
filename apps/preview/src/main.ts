import { marked } from 'marked';

const nav = document.getElementById('nav')!;
const content = document.getElementById('content')!;
const tabLanding = document.getElementById('tab-landing')!;
const tabMd = document.getElementById('tab-md')!;
const tabImg = document.getElementById('tab-img')!;

type Mode = 'landing' | 'md' | 'img';

interface SiteManifest {
  version: number;
  gameId: string;
  title: string;
  subtitle?: string;
  hero: {
    imageFile: string;
    markdownFile: string;
    imageAlt?: string;
  };
  cta?: {
    label: string;
    href: string;
    openInNewTab?: boolean;
  };
  meta?: { description?: string };
}

function setError(msg: string) {
  content.innerHTML = `<p class="error">${msg}</p>`;
}

async function loadMarkdownList(): Promise<string[]> {
  const res = await fetch('/ai/generated');
  if (!res.ok) throw new Error(`API ${res.status} — l’API est-elle démarrée ?`);
  const data = (await res.json()) as { files: string[] };
  return data.files ?? [];
}

async function loadImageList(): Promise<string[]> {
  const res = await fetch('/ai/generated-images');
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = (await res.json()) as { files: string[] };
  return data.files ?? [];
}

function parseHash(): { mode: Mode; file: string | null } {
  const raw = window.location.hash.slice(1);
  if (!raw) return { mode: 'landing', file: null };
  const decoded = decodeURIComponent(raw);
  if (decoded === 'landing' || decoded === 'page') return { mode: 'landing', file: null };
  if (decoded.startsWith('md:')) return { mode: 'md', file: decoded.slice(3) };
  if (decoded.startsWith('img:')) return { mode: 'img', file: decoded.slice(4) };
  if (/\.(png|webp|jpe?g)$/i.test(decoded)) return { mode: 'img', file: decoded };
  return { mode: 'md', file: decoded };
}

function setHash(mode: Mode, file: string) {
  if (mode === 'landing') {
    window.location.hash = '#landing';
    return;
  }
  const prefix = mode === 'md' ? 'md:' : 'img:';
  window.location.hash = `#${prefix}${encodeURIComponent(file)}`;
}

function setModeUi(mode: Mode) {
  document.body.classList.toggle('mode-image', mode === 'img');
  document.body.classList.toggle('mode-landing', mode === 'landing');
  tabLanding.classList.toggle('active', mode === 'landing');
  tabMd.classList.toggle('active', mode === 'md');
  tabImg.classList.toggle('active', mode === 'img');
}

function renderNav(mode: Mode, files: string[], active: string | null) {
  if (mode === 'landing') {
    nav.classList.add('nav-hidden');
    nav.innerHTML = '';
    return;
  }
  nav.classList.remove('nav-hidden');
  nav.innerHTML = '';
  for (const f of files) {
    const a = document.createElement('a');
    a.href = `#${mode === 'md' ? 'md' : 'img'}:${encodeURIComponent(f)}`;
    a.textContent = f;
    if (f === active) a.classList.add('active');
    a.addEventListener('click', (e) => {
      e.preventDefault();
      setHash(mode, f);
      void render(mode, f);
    });
    nav.appendChild(a);
  }
}

async function showMarkdown(filename: string) {
  content.innerHTML = '<p class="placeholder">Chargement…</p>';
  const res = await fetch(`/ai/generated/${encodeURIComponent(filename)}`);
  if (!res.ok) {
    setError(`Impossible de lire ${filename} (${res.status})`);
    return;
  }
  const data = (await res.json()) as { body: string };
  const raw = data.body ?? '';
  const withoutFrontMatter = raw.replace(/^---[\s\S]*?---\s*/, '');
  content.innerHTML = marked.parse(withoutFrontMatter) as string;
}

function showImage(filename: string) {
  const src = `/ai/generated-images/${encodeURIComponent(filename)}`;
  content.innerHTML = `
    <figure class="figure-image">
      <img src="${src}" alt="" decoding="async" />
      <figcaption>${escapeHtml(filename)} — aperçu généré (Grok Imagine)</figcaption>
    </figure>
  `;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function renderLanding() {
  setModeUi('landing');
  content.innerHTML = '<p class="placeholder">Chargement du manifeste…</p>';

  const mRes = await fetch('/site/manifest');
  if (!mRes.ok) {
    setError(
      `Manifeste indisponible (${mRes.status}). Vérifie <code>content/arbre-de-vie/site.manifest.json</code> et l’API.`,
    );
    return;
  }
  const m = (await mRes.json()) as SiteManifest;
  const imgFile = m.hero?.imageFile;
  const mdFile = m.hero?.markdownFile;
  if (!imgFile || !mdFile) {
    setError('Manifeste : hero.imageFile ou hero.markdownFile manquant.');
    return;
  }

  const mdFiles = await loadMarkdownList();
  const imgFiles = await loadImageList();
  if (!mdFiles.includes(mdFile)) {
    setError(
      `Le fichier <code>${escapeHtml(mdFile)}</code> n’est pas dans les MD générés. Génère-le ou mets à jour le manifeste.`,
    );
    return;
  }
  if (!imgFiles.includes(imgFile)) {
    setError(
      `L’image <code>${escapeHtml(imgFile)}</code> est absente du dossier images généré. Génère-la ou mets à jour le manifeste.`,
    );
    return;
  }

  const mdRes = await fetch(`/ai/generated/${encodeURIComponent(mdFile)}`);
  if (!mdRes.ok) {
    setError(`Lecture MD impossible (${mdRes.status}).`);
    return;
  }
  const mdJson = (await mdRes.json()) as { body: string };
  const raw = mdJson.body ?? '';
  const bodyHtml = marked.parse(raw.replace(/^---[\s\S]*?---\s*/, '')) as string;

  const imgSrc = `/ai/generated-images/${encodeURIComponent(imgFile)}`;
  const alt = escapeHtml(m.hero.imageAlt ?? m.title);
  const cta = m.cta;
  const ctaHtml =
    cta?.label && cta.href
      ? `<p class="landing-cta"><a href="${escapeHtml(cta.href)}"${cta.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(cta.label)}</a></p>`
      : '';

  content.innerHTML = `
    <article class="landing">
      <div class="landing-hero">
        <img src="${imgSrc}" alt="${alt}" decoding="async" />
      </div>
      <h2 class="landing-title">${escapeHtml(m.title)}</h2>
      ${m.subtitle ? `<p class="landing-sub">${escapeHtml(m.subtitle)}</p>` : ''}
      <div class="landing-body">${bodyHtml}</div>
      ${ctaHtml}
    </article>
  `;

  if (m.meta?.description) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', m.meta.description);
  }
}

async function render(mode: Mode, file: string) {
  if (mode === 'landing') {
    await renderLanding();
    return;
  }

  setModeUi(mode);
  const mdFiles = await loadMarkdownList();
  const imgFiles = await loadImageList();

  const list = mode === 'md' ? mdFiles : imgFiles;
  renderNav(mode, list, file);

  if (!list.includes(file)) {
    setError(`Fichier introuvable : ${file}`);
    return;
  }

  if (mode === 'md') await showMarkdown(file);
  else showImage(file);
}

async function boot() {
  try {
    const { mode: hMode, file: hFile } = parseHash();

    if (!window.location.hash) {
      window.location.hash = '#landing';
      await renderLanding();
      return;
    }

    if (hMode === 'landing') {
      await renderLanding();
      return;
    }

    const mdFiles = await loadMarkdownList();
    const imgFiles = await loadImageList();

    let mode: Mode = hMode;
    let file: string | null = hFile;

    if (file && mode === 'md' && !mdFiles.includes(file)) file = null;
    if (file && mode === 'img' && !imgFiles.includes(file)) file = null;

    if (!file) {
      if (hMode === 'img' && imgFiles.length) {
        mode = 'img';
        file = imgFiles[0];
      } else if (mdFiles.length) {
        mode = 'md';
        file = mdFiles[0];
      } else if (imgFiles.length) {
        mode = 'img';
        file = imgFiles[0];
      } else {
        window.location.hash = '#landing';
        await renderLanding();
        return;
      }
      setHash(mode, file);
    }

    await render(mode, file!);
  } catch (e) {
    setError(e instanceof Error ? e.message : String(e));
  }
}

tabLanding.addEventListener('click', () => {
  window.location.hash = '#landing';
  void renderLanding();
});

tabMd.addEventListener('click', async () => {
  const mdFiles = await loadMarkdownList();
  if (!mdFiles.length) {
    content.innerHTML =
      '<p class="placeholder">Aucun fichier <code>.md</code> pour l’instant.</p>';
    setModeUi('md');
    nav.classList.remove('nav-hidden');
    nav.innerHTML = '';
    return;
  }
  setHash('md', mdFiles[0]);
  await render('md', mdFiles[0]);
});

tabImg.addEventListener('click', async () => {
  const imgFiles = await loadImageList();
  if (!imgFiles.length) {
    content.innerHTML =
      '<p class="placeholder">Aucune image dans <code>content/generated/.../images/</code>.</p>';
    setModeUi('img');
    nav.classList.remove('nav-hidden');
    nav.innerHTML = '';
    return;
  }
  setHash('img', imgFiles[0]);
  await render('img', imgFiles[0]);
});

void boot();

window.addEventListener('hashchange', () => {
  const { mode, file } = parseHash();
  if (mode === 'landing') {
    void renderLanding();
    return;
  }
  if (file) void render(mode, file);
});
