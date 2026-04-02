import { useEffect, type CSSProperties } from 'react'
import { Link, NavLink, Navigate, useParams } from 'react-router-dom'
import { renderDeckSection } from '../sections/sectionRegistry'
import {
  DECK_SECTION_ORDER,
  SECTION_LABELS_FR,
  VARIANTS_BY_SECTION,
  type DeckSectionKey,
} from '../lib/deckSectionCatalog'
import { getSectionDemoBlocks } from '../demo/sectionDemoFixtures'
import { SECTION_DEMO_GLOBALS } from '../demo/sectionDemoGlobals'
import '../styles/deck-landing.css'
import './section-demo.css'

function isDeckSectionKey(s: string): s is DeckSectionKey {
  return (DECK_SECTION_ORDER as readonly string[]).includes(s)
}

const FIRST_SECTION = DECK_SECTION_ORDER[0]

export function SectionDemoPage() {
  const { sectionType } = useParams<{ sectionType?: string }>()

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
    const id = `deck-fonts-section-demo-${sectionType ?? 'index'}`
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = g.fontImportHref
    document.head.appendChild(link)
  }, [g.fontImportHref, sectionType])

  if (!sectionType || !isDeckSectionKey(sectionType)) {
    return <Navigate to={`/demo/sections/${FIRST_SECTION}`} replace />
  }

  const blocks = getSectionDemoBlocks(sectionType, VARIANTS_BY_SECTION[sectionType])
  const label = SECTION_LABELS_FR[sectionType]

  return (
    <div className="deck-landing-root deck-landing-root--fill-viewport section-demo" style={style}>
      <header className="section-demo__top">
        <h1>Démos sections</h1>
        <nav className="section-demo__nav" aria-label="Navigation site">
          <Link to="/">Accueil</Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>

      <div className="section-demo__body">
        <aside className="section-demo__sidebar" aria-label="Types de section">
          <nav className="section-demo__side-nav">
            {DECK_SECTION_ORDER.map((key) => (
              <NavLink
                key={key}
                to={`/demo/sections/${key}`}
                className={({ isActive }) =>
                  `section-demo__side-link${isActive ? ' section-demo__side-link--active' : ''}`
                }
              >
                <span className="section-demo__side-label">{SECTION_LABELS_FR[key]}</span>
                <span className="section-demo__side-meta">
                  {VARIANTS_BY_SECTION[key].length} variante
                  {VARIANTS_BY_SECTION[key].length > 1 ? 's' : ''}
                </span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="section-demo__content">
          <h2 className="section-demo__current">
            {label}{' '}
            <span className="section-demo__current-id">({sectionType})</span>
          </h2>
          <p className="section-demo__intro">
            Chaque entrée du menu liste <strong>toutes les variantes React</strong> pour ce type. Les
            images hero utilisent <code>/ai/generated-images/banner-1.png</code> ; les cartes utilisent{' '}
            <code>/ai/generated-images/deck-cards/…</code> après sync. Ici :{' '}
            <strong>
              {blocks.length} variante{blocks.length > 1 ? 's' : ''}
            </strong>
            .
          </p>
          <main className="section-demo__main dl-main">
            {blocks.map((b, i) => (
              <div key={`${b.variant}-${i}`} className="section-demo__block">
                <h3 className="section-demo__block-title">
                  {b.label}
                  {b.aliasOf ? <span className="section-demo__alias-meta">Alias de {b.aliasOf}</span> : null}
                </h3>
                {renderDeckSection({
                  id: `${sectionType}-demo-${i}`,
                  variant: b.variant,
                  props: b.props,
                  ...(b.fullWidth ? { layout: { fullWidth: true } } : {}),
                  media: [],
                })}
              </div>
            ))}
          </main>
        </div>
      </div>
    </div>
  )
}
