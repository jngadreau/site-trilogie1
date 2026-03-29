import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { renderDeckSection } from '../sections/sectionRegistry'
import type { DeckModularLandingV1 } from '../types/deckLanding'
import '../styles/deck-landing.css'

type Props = {
  data: DeckModularLandingV1
  /** Barre du haut (navigation, slug, etc.) */
  header?: ReactNode
}

export function DeckLandingView({ data, header }: Props) {
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

  const g = data.globals
  const pageBgUrl =
    g.backgroundImage && typeof g.backgroundImage.imageUrl === 'string'
      ? g.backgroundImage.imageUrl.trim()
      : ''
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
    <div className={`deck-landing${pageBgUrl ? ' deck-landing--has-page-bg' : ''}`} style={style}>
      {pageBgUrl ? (
        <div
          className="deck-landing__page-bg"
          aria-hidden
          style={{ backgroundImage: `url(${pageBgUrl})` }}
        />
      ) : null}
      {header ? <header className="dl-topbar">{header}</header> : null}
      <main className="dl-main">{data.sections.map((s) => renderDeckSection(s))}</main>
    </div>
  )
}
