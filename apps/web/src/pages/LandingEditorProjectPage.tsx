import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import './landing-editor.css'

type ProjectDoc = {
  _id: string
  gameKey: string
  slug: string
  title?: string
  description?: string
  sectionDescriptions?: Record<string, string>
  currentDraftVersionId?: string
  publishedVersionId?: string
}

type VersionRow = {
  _id: string
  versionNumber: number
  status: string
  label?: string
  sectionOrder?: string[]
  createdAt?: string
}

const EMPTY_LANDING_STUB = (slug: string) => ({
  version: 1,
  slug,
  globals: {
    accent: '#2d5a4a',
    background: '#f6f3ef',
    surface: '#ffffff',
    text: '#1a1a1a',
    textMuted: '#5c5c5c',
    fontHeading: 'Georgia, serif',
    fontBody: 'system-ui, sans-serif',
    radius: '12px',
  },
  sections: [] as unknown[],
})

export function LandingEditorProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<ProjectDoc | null>(null)
  const [versions, setVersions] = useState<VersionRow[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!projectId) return
    setErr(null)
    Promise.all([
      fetch(`/site/landing-storage/projects/${encodeURIComponent(projectId)}`).then((r) => {
        if (!r.ok) throw new Error(`projet ${r.status}`)
        return r.json()
      }),
      fetch(`/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions`).then((r) => {
        if (!r.ok) throw new Error(`versions ${r.status}`)
        return r.json()
      }),
    ])
      .then(([p, v]) => {
        setProject(p as ProjectDoc)
        setVersions(Array.isArray(v) ? v : [])
      })
      .catch(() => setErr('Chargement impossible.'))
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  async function addDraftVersion() {
    if (!projectId || !project) return
    setBusy(true)
    setMessage(null)
    setErr(null)
    try {
      const r = await fetch(`/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'draft',
          label: 'Brouillon initial',
          sectionOrder: [],
          variantsBySection: {},
          content: EMPTY_LANDING_STUB(project.slug),
        }),
      })
      const body = (await r.json().catch(() => ({}))) as Record<string, unknown>
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      setMessage(`Version ${String(body.versionNumber ?? '')} créée.`)
      load()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (!projectId) {
    return (
      <p className="le__err">
        Identifiant manquant. <Link to="/admin/landing-editor">Retour</Link>
      </p>
    )
  }

  return (
    <div className="le">
      <header className="le__head">
        <h1 className="le__title">Projet landing</h1>
        <nav className="le__nav">
          <Link to="/admin/landing-editor">← Liste</Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>

      {err ? <p className="le__err">{err}</p> : null}
      {message ? <p className="le__ok">{message}</p> : null}

      {!project && !err ? <p className="le__muted">Chargement…</p> : null}

      {project ? (
        <>
          <section className="le__section">
            <h2>
              <code>{project.slug}</code>
            </h2>
            <p className="le__muted">
              Jeu : <code>{project.gameKey}</code>
            </p>
            {project.title ? <p>{project.title}</p> : null}
            {project.description ? <p className="le__desc">{project.description}</p> : null}
          </section>

          <section className="le__section">
            <h2>Versions</h2>
            <p className="le__muted">
              Brouillons successifs pour ce projet. La suite du wizard remplira <code>sectionOrder</code>, le contenu
              Grok et les assets S3.
            </p>
            <button type="button" className="le__btn le__btn--secondary" disabled={busy} onClick={() => addDraftVersion()}>
              {busy ? '…' : 'Nouvelle version (JSON vide)'}
            </button>
            {versions.length === 0 ? (
              <p className="le__muted">Aucune version.</p>
            ) : (
              <ul className="le__list">
                {versions.map((v) => (
                  <li key={v._id} className="le__list-item">
                    <span className="le__pill">{v.status}</span> v{v.versionNumber}
                    {v.label ? <span className="le__muted"> — {v.label}</span> : null}
                    {v.createdAt ? (
                      <span className="le__muted le__list-meta"> · {new Date(v.createdAt).toLocaleString()}</span>
                    ) : null}
                    <code className="le__mono"> {v._id}</code>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
