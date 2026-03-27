import { marked } from 'marked';

const nav = document.getElementById('nav')!;
const content = document.getElementById('content')!;
const tabMd = document.getElementById('tab-md')!;
const tabImg = document.getElementById('tab-img')!;

type Mode = 'md' | 'img';

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
  if (!raw) return { mode: 'md', file: null };
  const decoded = decodeURIComponent(raw);
  if (decoded.startsWith('md:')) return { mode: 'md', file: decoded.slice(3) };
  if (decoded.startsWith('img:')) return { mode: 'img', file: decoded.slice(4) };
  if (/\.(png|webp|jpe?g)$/i.test(decoded)) return { mode: 'img', file: decoded };
  return { mode: 'md', file: decoded };
}

function setHash(mode: Mode, file: string) {
  const prefix = mode === 'md' ? 'md:' : 'img:';
  window.location.hash = `#${prefix}${encodeURIComponent(file)}`;
}

function setModeUi(mode: Mode) {
  document.body.classList.toggle('mode-image', mode === 'img');
  tabMd.classList.toggle('active', mode === 'md');
  tabImg.classList.toggle('active', mode === 'img');
}

function renderNav(
  mode: Mode,
  files: string[],
  active: string | null,
) {
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

async function render(mode: Mode, file: string) {
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
    const mdFiles = await loadMarkdownList();
    const imgFiles = await loadImageList();

    const { mode: hMode, file: hFile } = parseHash();

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
        content.innerHTML =
          '<p class="placeholder">Aucun contenu généré. Utilise <code>POST /ai/generate-markdown</code> ou <code>POST /ai/generate-image</code>.</p>';
        setModeUi('md');
        return;
      }
      setHash(mode, file);
    }

    await render(mode, file!);
  } catch (e) {
    setError(e instanceof Error ? e.message : String(e));
  }
}

tabMd.addEventListener('click', async () => {
  const mdFiles = await loadMarkdownList();
  if (!mdFiles.length) {
    content.innerHTML =
      '<p class="placeholder">Aucun fichier <code>.md</code> pour l’instant.</p>';
    setModeUi('md');
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
    nav.innerHTML = '';
    return;
  }
  setHash('img', imgFiles[0]);
  await render('img', imgFiles[0]);
});

void boot();

window.addEventListener('hashchange', () => {
  const { mode, file } = parseHash();
  if (file) void render(mode, file);
});
