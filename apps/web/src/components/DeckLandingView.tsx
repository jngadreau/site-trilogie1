import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { renderDeckSection } from '../sections/sectionRegistry'
import type { DeckModularLandingV1 } from '../types/deckLanding'
import '../styles/deck-landing.css'

type Props = {
  data: DeckModularLandingV1
  /** Barre du haut (navigation, slug, etc.) */
  header?: ReactNode
  /**
   * `true` : `min-height: 100vh` sur la racine (routes `/deck/…`, aperçu plein écran).
   * `false` : hauteur suivant le contenu (split éditeur, iframe, embed sans héritage body).
   */
  fillViewport?: boolean
}

export function DeckLandingView({ data, header, fillViewport = true }: Props) {
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

  const rootClass = [
    'deck-landing-root',
    pageBgUrl ? 'deck-landing-root--has-page-bg' : '',
    fillViewport ? 'deck-landing-root--fill-viewport' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={rootClass}
      data-deck-landing-root=""
      data-deck-slug={data.slug}
      style={style}
    >
      {pageBgUrl ? (
        <div
          className="deck-landing-root__page-bg"
          aria-hidden
          style={{ backgroundImage: `url(${pageBgUrl})` }}
        />
      ) : null}
      {header ? <header className="dl-topbar">{header}</header> : null}
      <main className="dl-main">{data.sections.map((s) => renderDeckSection(s))}</main>
    </div>
  )
}
