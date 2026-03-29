import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DeckLandingView } from '../components/DeckLandingView'
import type { DeckModularLandingV1 } from '../types/deckLanding'

export function LandingDeckPage() {
  const { slug } = useParams<{ slug: string }>()
  const [data, setData] = useState<DeckModularLandingV1 | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setErr(null)
    fetch(`/site/deck-landing/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
        return r.json()
      })
      .then((j: DeckModularLandingV1) => {
        if (!cancelled) setData(j)
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (!slug) {
    return <p className="dl-page-msg">Slug manquant.</p>
  }
  if (err) {
    return (
      <p className="dl-page-msg">
        Impossible de charger la landing ({err}). Lance l’API sur le port 3040 et le proxy Vite.
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
          <span className="dl-topbar__slug">{data.slug}</span>
          <nav className="dl-topbar__nav" aria-label="Navigation">
            <Link to="/">Accueil</Link>
            <Link to="/admin">Admin</Link>
          </nav>
        </>
      }
    />
  )
}
