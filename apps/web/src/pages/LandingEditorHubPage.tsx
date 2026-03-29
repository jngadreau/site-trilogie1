import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import './landing-editor.css'

const DEFAULT_GAME_KEY = 'arbre-de-vie'

type ProjectRow = {
  _id: string
  gameKey: string
  slug: string
  title?: string
  description?: string
  updatedAt?: string
}

export function LandingEditorHubPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const refresh = useCallback(() => {
    setLoadErr(null)
    fetch(`/site/landing-storage/projects?gameKey=${encodeURIComponent(DEFAULT_GAME_KEY)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((rows: ProjectRow[]) => setProjects(Array.isArray(rows) ? rows : []))
      .catch(() => setLoadErr('Impossible de charger les projets (Mongo / API).'))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setFormErr(null)
    setMessage(null)
    const s = slug.trim()
    if (!s) {
      setFormErr('Slug requis.')
      return
    }
    setBusy(true)
    try {
      const r = await fetch('/site/landing-storage/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameKey: DEFAULT_GAME_KEY,
          slug: s,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
        }),
      })
      const body = (await r.json().catch(() => ({}))) as Record<string, unknown>
      if (!r.ok) {
        const msg = body?.message
        throw new Error(
          typeof msg === 'string' ? msg : Array.isArray(msg) ? JSON.stringify(msg) : `${r.status}`,
        )
      }
      setMessage(`Projet créé — ${s}`)
      setSlug('')
      setTitle('')
      setDescription('')
      refresh()
    } catch (err) {
      setFormErr((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="le">
      <header className="le__head">
        <h1 className="le__title">Éditeur de landings</h1>
        <nav className="le__nav">
          <Link to="/">Accueil</Link>
          <Link to="/admin">Admin</Link>
          <Link to="/admin/deck-landing-legacy">Legacy JSON</Link>
        </nav>
      </header>

      <p className="le__lead">
        Étape <strong>jeu</strong> (formalisée) : pour l’instant seul le deck{' '}
        <code>{DEFAULT_GAME_KEY}</code> est proposé. Les projets et versions vivent dans MongoDB ; le wizard complet
        (structure IA, sections, S3) arrive ensuite — voir <code>docs/landing-editor-vision.md</code>.
      </p>

      {loadErr ? <p className="le__err">{loadErr}</p> : null}
      {formErr ? <p className="le__err">{formErr}</p> : null}
      {message ? <p className="le__ok">{message}</p> : null}

      <section className="le__section">
        <h2>Nouveau projet</h2>
        <form className="le__form" onSubmit={onCreate}>
          <label className="le__label">
            Slug (unique pour ce jeu)
            <input
              className="le__input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ex. vitrine-printemps-2026"
              autoComplete="off"
            />
          </label>
          <label className="le__label">
            Titre (optionnel)
            <input
              className="le__input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="le__label">
            Description (optionnel)
            <textarea
              className="le__textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <button type="submit" className="le__btn" disabled={busy}>
            {busy ? '…' : 'Créer le projet'}
          </button>
        </form>
      </section>

      <section className="le__section">
        <h2>Projets ({DEFAULT_GAME_KEY})</h2>
        {projects.length === 0 ? (
          <p className="le__muted">Aucun projet pour ce jeu.</p>
        ) : (
          <ul className="le__list">
            {projects.map((p) => (
              <li key={p._id} className="le__list-item">
                <Link to={`/admin/landing-editor/${p._id}`} className="le__list-link">
                  <strong>{p.slug}</strong>
                  {p.title ? <span className="le__muted"> — {p.title}</span> : null}
                </Link>
                {p.updatedAt ? (
                  <span className="le__muted le__list-meta"> · maj {new Date(p.updatedAt).toLocaleString()}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
