import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DeckLandingView } from '../components/DeckLandingView'
import { isDeckModularLandingV1 } from '../lib/deckLandingGuards'
import type { DeckModularLandingV1 } from '../types/deckLanding'

type VersionDoc = {
  _id: string
  projectId: string
  content?: unknown
}

export function LandingMongoPreviewPage() {
  const { projectId, versionId } = useParams<{ projectId: string; versionId: string }>()
  const [data, setData] = useState<DeckModularLandingV1 | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!versionId || !projectId) return
    let cancelled = false
    setErr(null)
    setData(null)
    fetch(`/site/landing-storage/versions/${encodeURIComponent(versionId)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
        return r.json()
      })
      .then((v: VersionDoc) => {
        if (cancelled) return
        const pid = String(v.projectId)
        if (pid !== projectId) {
          throw new Error('Cette version n’appartient pas au projet indiqué dans l’URL.')
        }
        const c = v.content
        if (!isDeckModularLandingV1(c)) {
          throw new Error('content n’est pas un DeckModularLandingV1 valide (globals + sections).')
        }
        setData(c)
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [projectId, versionId])

  if (!projectId || !versionId) {
    return <p className="dl-page-msg">Paramètres manquants.</p>
  }
  if (err) {
    return (
      <p className="dl-page-msg">
        {err}{' '}
        <Link to={`/admin/landing-editor/${encodeURIComponent(projectId)}`}>Retour éditeur</Link>
      </p>
    )
  }
  if (!data) {
    return <p className="dl-page-msg">Chargement…</p>
  }

  return (
    <DeckLandingView
      data={data}
      header={
        <>
          <span className="dl-topbar__slug">
            Prévisualisation Mongo — <code>{data.slug}</code>
          </span>
          <nav className="dl-topbar__nav" aria-label="Navigation">
            <Link to={`/admin/landing-editor/${encodeURIComponent(projectId)}`}>Projet</Link>
            <Link
              to={`/admin/landing-editor/${encodeURIComponent(projectId)}/version/${encodeURIComponent(versionId)}/edit`}
            >
              Éditeur sections
            </Link>
            <Link to="/admin">Admin</Link>
            <Link to="/">Accueil</Link>
          </nav>
        </>
      }
    />
  )
}
