import { Link } from 'react-router-dom'
import { useEffect, type CSSProperties } from 'react'
import { AppTopNav } from '../components/AppTopNav'
import {
  DECK_SECTION_ORDER,
  SECTION_LABELS_FR,
  VARIANTS_BY_SECTION,
} from '../lib/deckSectionCatalog'
import { SECTION_DEMO_GLOBALS } from '../demo/sectionDemoGlobals'
import './section-demo.css'

export function SectionDemoHubPage() {
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
    const id = 'deck-fonts-section-demo-hub'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = g.fontImportHref
    document.head.appendChild(link)
  }, [g.fontImportHref])

  return (
    <div className="section-demo" style={style}>
      <AppTopNav />
      <header className="section-demo__top">
        <h1>Démos par type de section</h1>
        <nav className="section-demo__nav" aria-label="Navigation démo">
          <Link to="/">Accueil</Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>
      <p className="section-demo__intro">
        Chaque page liste <strong>toutes les variantes React</strong> pour un type de section (hero,
        identité, etc.). Les images hero utilisent <code>/ai/generated-images/banner-1.png</code> ; les
        cartes utilisent <code>/ai/generated-images/deck-cards/…</code> après sync.
      </p>
      <div className="section-demo-hub__grid">
        {DECK_SECTION_ORDER.map((key) => (
          <Link key={key} to={`/demo/sections/${key}`} className="section-demo-hub__card">
            <h2>{SECTION_LABELS_FR[key]}</h2>
            <p>
              {VARIANTS_BY_SECTION[key].length} variante
              {VARIANTS_BY_SECTION[key].length > 1 ? 's' : ''} :{' '}
              {VARIANTS_BY_SECTION[key].join(', ')}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
