import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './admin-home.css'

type StorageStatus = {
  mongo?: boolean
  mongoReadyState?: number
  /** Fichiers landing (S3 côté serveur, jamais exposé au navigateur). */
  storageReady?: boolean
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
          <Link to="/admin/landing-editor">Éditeur landings</Link>
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
        <h2>Stockage (MongoDB + fichiers)</h2>
        <p className="admin-home__muted">
          Côté API : <code>MONGODB_URI</code> et variables S3 (bucket, endpoint, clés,{' '}
          <code>ENV_ID_FOR_STORAGE</code>, <code>S3_STORAGE_KEY_PREFIX</code> optionnel). La webapp ne reçoit que des
          chemins <code>/site/landing-storage/…/assets/file/…</code>, pas d’URL de bucket.
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
              <strong>Fichiers landings</strong> (stockage objet, servi via l’API) :{' '}
              {status.storageReady ? (
                <span className="admin-home__ok-inline">prêt</span>
              ) : (
                <span className="admin-home__warn">non configuré</span>
              )}
            </li>
          </ul>
        ) : !statusErr ? (
          <p className="admin-home__muted">Chargement…</p>
        ) : null}
        <p className="admin-home__muted">
          API : <code>GET/POST /site/landing-storage/…</code> (projets, versions, upload{' '}
          <code>file</code>, lecture <code>GET …/assets/file/:fileName</code>).
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
