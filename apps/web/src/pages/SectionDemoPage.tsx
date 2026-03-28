import { useEffect, type CSSProperties } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { renderDeckSection } from '../sections/sectionRegistry'
import {
  DECK_SECTION_ORDER,
  SECTION_LABELS_FR,
  type DeckSectionKey,
} from '../lib/deckSectionCatalog'
import { SECTION_DEMO_FIXTURES } from '../demo/sectionDemoFixtures'
import { SECTION_DEMO_GLOBALS } from '../demo/sectionDemoGlobals'
import '../styles/deck-landing.css'
import './section-demo.css'

function isDeckSectionKey(s: string): s is DeckSectionKey {
  return (DECK_SECTION_ORDER as readonly string[]).includes(s)
}

export function SectionDemoPage() {
  const { sectionType } = useParams<{ sectionType: string }>()

  const g = SECTION_DEMO_GLOBALS
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

  useEffect(() => {
    if (!g.fontImportHref) return
    const id = `deck-fonts-section-demo-${sectionType ?? 'x'}`
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = g.fontImportHref
    document.head.appendChild(link)
  }, [g.fontImportHref, sectionType])

  if (!sectionType || !isDeckSectionKey(sectionType)) {
    return <Navigate to="/demo/sections" replace />
  }

  const blocks = SECTION_DEMO_FIXTURES[sectionType]
  const label = SECTION_LABELS_FR[sectionType]

  return (
    <div className="deck-landing section-demo" style={style}>
      <header className="section-demo__top">
        <h1>
          Démo — {label} <span style={{ fontWeight: 400, opacity: 0.85 }}>({sectionType})</span>
        </h1>
        <nav className="section-demo__nav" aria-label="Navigation démo">
          <Link to="/demo/sections">Toutes les démos</Link>
          <Link to="/">Accueil</Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>
      <p className="section-demo__intro">
        <Link to="/demo/sections">← Retour au hub</Link>
        {' · '}
        {blocks.length} variante{blocks.length > 1 ? 's' : ''} pour ce type.
      </p>
      <main className="section-demo__main dl-main">
        {blocks.map((b, i) => (
          <div key={`${b.variant}-${i}`} className="section-demo__block">
            <h2 className="section-demo__block-title">{b.label}</h2>
            {renderDeckSection({
              id: `${sectionType}-demo-${i}`,
              variant: b.variant,
              props: b.props,
              media: [],
            })}
          </div>
        ))}
      </main>
    </div>
  )
}
