import { useEffect, useState, type CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { renderDeckSection } from '../sections/sectionRegistry'
import type { DeckModularLandingV1 } from '../types/deckLanding'
import '../styles/deck-landing.css'

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

  useEffect(() => {
    if (!data?.globals.fontImportHref) return
    const id = `deck-fonts-${data.slug}`
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = data.globals.fontImportHref
    document.head.appendChild(link)
  }, [data])

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

  const g = data.globals
  const style: CSSProperties = {
    ['--dl-accent' as string]: g.accent,
    ['--dl-bg' as string]: g.background,
    ['--dl-surface' as string]: g.surface,
    ['--dl-text' as string]: g.text,
    ['--dl-muted' as string]: g.textMuted ?? 'color-mix(in srgb, var(--dl-text) 55%, transparent)',
    ['--dl-font-heading' as string]: g.fontHeading,
    ['--dl-font-body' as string]: g.fontBody,
    ['--dl-radius' as string]: g.radius ?? '12px',
  }

  return (
    <div className="deck-landing" style={style}>
      <header className="dl-topbar">
        <span className="dl-topbar__slug">{data.slug}</span>
        <nav className="dl-topbar__nav" aria-label="Autres landings">
          <a href="/deck/arbre-de-vie-a">A</a>
          <a href="/deck/arbre-de-vie-b">B</a>
          <a href="/deck/arbre-de-vie-c">C</a>
          <a href="/admin">Admin</a>
        </nav>
      </header>
      <main className="dl-main">{data.sections.map((s) => renderDeckSection(s))}</main>
    </div>
  )
}
