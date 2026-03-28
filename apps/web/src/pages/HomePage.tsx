import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppTopNav } from '../components/AppTopNav'
import './home.css'

type VariantsMap = Record<string, Record<string, string>>

function variantSummary(v: Record<string, string>): string {
  return Object.keys(v)
    .sort()
    .map((k) => v[k])
    .filter(Boolean)
    .join(' · ')
}

export function HomePage() {
  const [variants, setVariants] = useState<VariantsMap | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/site/deck-landing-variants')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((m: VariantsMap) => {
        if (!cancelled) setVariants(m)
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const slugs = variants
    ? Object.keys(variants).sort((a, b) => a.localeCompare(b))
    : []

  return (
    <div className="home-page">
      <AppTopNav />
      <main className="home-page__main">
        <div className="home-page__intro">
          <h1>Landings deck — Arbre de vie</h1>
          <p>
            Choisis une variante ci-dessous. L’API Vite (proxy) et le serveur sur le port{' '}
            <strong>3040</strong> doivent être actifs.
          </p>
          <p>
            <Link to="/demo/sections">Démos par type de section</Link> — toutes les variantes React
            (hero, identité, etc.) sur des pages dédiées.
          </p>
        </div>

        {err ? <p className="home-page__err">Impossible de charger les variantes ({err}).</p> : null}

        {!variants ? (
          <p className="home-page__empty">Chargement des variantes…</p>
        ) : slugs.length === 0 ? (
          <p className="home-page__empty">Aucune variante enregistrée. Ajoute-en une depuis l’admin.</p>
        ) : (
          <div className="home-cards">
            {slugs.map((slug) => (
              <Link key={slug} to={`/deck/${encodeURIComponent(slug)}`} className="home-card">
                <h2 className="home-card__slug">{slug}</h2>
                <p className="home-card__variants">{variantSummary(variants[slug])}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
