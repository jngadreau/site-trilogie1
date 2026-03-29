import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './admin-home.css'

type StorageStatus = {
  mongo?: boolean
  mongoReadyState?: number
  s3?: boolean
  s3Bucket?: string | null
  storageEnvId?: string
}

export function AdminHomePage() {
  const [status, setStatus] = useState<StorageStatus | null>(null)
  const [statusErr, setStatusErr] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const refreshStatus = useCallback(() => {
    setStatusErr(null)
    fetch('/site/landing-storage/status')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((s: StorageStatus) => setStatus(s))
      .catch(() => setStatusErr('API landing-storage indisponible'))
  }, [])

  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  async function postSync() {
    setBusy('sync')
    setMessage(null)
    setErr(null)
    try {
      const r = await fetch('/site/sync-deck-card-images', { method: 'POST' })
      const body = (await r.json().catch(() => ({}))) as Record<string, unknown>
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      setMessage(
        typeof body.copied === 'number'
          ? `Miroir OK — ${body.copied} copié(s), ${Number(body.skipped) || 0} ignoré(s)`
          : 'OK',
      )
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="admin-home">
      <header className="admin-home__head">
        <h1 className="admin-home__title">Administration</h1>
        <nav className="admin-home__nav">
          <Link to="/">Accueil</Link>
          <Link to="/demo/sections">Démos sections</Link>
          <Link to="/admin/deck-landing-legacy">Legacy deck (JSON)</Link>
        </nav>
      </header>

      <p className="admin-home__lead">
        Cette page ne regroupe que les <strong>actions générales</strong> et le suivi du stockage. L’éditeur de landings
        (wizard, IA, prévisualisation / édition) sera sur des routes dédiées — voir{' '}
        <code>docs/landing-editor-vision.md</code> à la racine du dépôt <code>site-trilogie1</code>.
      </p>

      {err ? <p className="admin-home__err">{err}</p> : null}
      {message ? <p className="admin-home__ok">{message}</p> : null}

      <section className="admin-home__section">
        <h2>Stockage (MongoDB + S3)</h2>
        <p className="admin-home__muted">
          Même schéma d’environnement que gnova-cv-app : <code>MONGODB_URI</code>,{' '}
          <code>S3_BUCKET_NAME</code>, <code>S3_REGION</code>, <code>S3_ENDPOINT</code>,{' '}
          <code>S3_FORCE_PATH_STYLE</code>, clés d’accès, <code>ENV_ID_FOR_STORAGE</code>.
        </p>
        <p className="admin-home__muted">
          <button type="button" className="admin-home__btn-ghost" onClick={() => refreshStatus()}>
            Rafraîchir le statut
          </button>
        </p>
        {statusErr ? <p className="admin-home__warn">{statusErr}</p> : null}
        {status ? (
          <ul className="admin-home__status">
            <li>
              <strong>MongoDB</strong> :{' '}
              {status.mongo ? (
                <span className="admin-home__ok-inline">connecté</span>
              ) : (
                <span className="admin-home__err-inline">non connecté</span>
              )}
              {status.mongoReadyState !== undefined ? (
                <span className="admin-home__muted"> (readyState={status.mongoReadyState})</span>
              ) : null}
            </li>
            <li>
              <strong>S3</strong> :{' '}
              {status.s3 ? (
                <span className="admin-home__ok-inline">configuré</span>
              ) : (
                <span className="admin-home__warn">non configuré</span>
              )}
              {status.s3Bucket ? (
                <span className="admin-home__muted"> — bucket {status.s3Bucket}</span>
              ) : null}
            </li>
            <li>
              <strong>ENV_ID_FOR_STORAGE</strong> : <code>{status.storageEnvId ?? '—'}</code>
            </li>
          </ul>
        ) : !statusErr ? (
          <p className="admin-home__muted">Chargement…</p>
        ) : null}
        <p className="admin-home__muted">
          API : <code>GET/POST /site/landing-storage/…</code> (projets, versions, upload multipart{' '}
          <code>file</code>).
        </p>
      </section>

      <section className="admin-home__section">
        <h2>Images cartes (miroir disque)</h2>
        <p className="admin-home__muted">
          Copie depuis <code>images-jeux/arbre_de_vie</code> vers <code>images/deck-cards</code> (API preview).
        </p>
        <button type="button" className="admin-home__btn" disabled={!!busy} onClick={() => postSync()}>
          {busy === 'sync' ? '…' : 'Synchroniser les images cartes'}
        </button>
      </section>
    </div>
  )
}
