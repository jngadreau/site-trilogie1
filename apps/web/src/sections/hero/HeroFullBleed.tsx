import { Markdown } from '../../lib/Markdown'

export type HeroFullBleedProps = {
  title: string
  tagline: string
  bodyMarkdown: string
  ctaLabel: string
  ctaHref: string
  imageUrl: string
  imageAlt: string
  overlayOpacity: number
}

export function HeroFullBleed({
  title,
  tagline,
  bodyMarkdown,
  ctaLabel,
  ctaHref,
  imageUrl,
  imageAlt,
  overlayOpacity,
}: HeroFullBleedProps) {
  const opacity = Math.min(0.75, Math.max(0.25, overlayOpacity))
  return (
    <section className="dl-hero dl-hero--bleed" aria-labelledby="dl-hero-bleed-title">
      <img src={imageUrl} alt={imageAlt} className="dl-hero__bleed-bg" />
      <div className="dl-hero__bleed-overlay" style={{ opacity }} aria-hidden="true" />
      <div className="dl-hero__bleed-inner">
        <p className="dl-hero__tagline">{tagline}</p>
        <h1 id="dl-hero-bleed-title" className="dl-hero__title dl-hero__title--on-dark">
          {title}
        </h1>
        <Markdown text={bodyMarkdown} className="dl-hero__body dl-hero__body--on-dark" />
        <a className="dl-btn dl-btn--on-dark dl-hero__cta" href={ctaHref}>
          {ctaLabel}
        </a>
      </div>
    </section>
  )
}
