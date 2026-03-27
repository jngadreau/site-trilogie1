import { marked } from 'marked';

const nav = document.getElementById('nav')!;
const content = document.getElementById('content')!;

function setError(msg: string) {
  content.innerHTML = `<p class="error">${msg}</p>`;
}

async function loadList(): Promise<string[]> {
  const res = await fetch('/ai/generated');
  if (!res.ok) throw new Error(`API ${res.status} — l’API est-elle démarrée ?`);
  const data = (await res.json()) as { files: string[] };
  return data.files ?? [];
}

function renderNav(files: string[], active: string | null) {
  nav.innerHTML = '';
  for (const f of files) {
    const a = document.createElement('a');
    a.href = `#${encodeURIComponent(f)}`;
    a.textContent = f;
    if (f === active) a.classList.add('active');
    a.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = encodeURIComponent(f);
      void showFile(f);
    });
    nav.appendChild(a);
  }
}

async function showFile(filename: string) {
  const files = await loadList();
  renderNav(files, filename);
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

async function boot() {
  try {
    const files = await loadList();
    if (files.length === 0) {
      content.innerHTML =
        '<p class="placeholder">Aucun fichier .md dans <code>content/generated/arbre-de-vie/</code>. Génère-en un via <code>POST /ai/generate-markdown</code>.</p>';
      return;
    }
    const hash = decodeURIComponent(window.location.hash.slice(1) || '');
    const pick = hash && files.includes(hash) ? hash : files[0];
    window.location.hash = encodeURIComponent(pick);
    await showFile(pick);
  } catch (e) {
    setError(e instanceof Error ? e.message : String(e));
  }
}

void boot();

window.addEventListener('hashchange', () => {
  const hash = decodeURIComponent(window.location.hash.slice(1) || '');
  if (hash) void showFile(hash);
});
