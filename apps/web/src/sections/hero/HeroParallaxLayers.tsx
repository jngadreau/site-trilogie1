import { Markdown } from '../../lib/Markdown'

export type HeroParallaxLayersProps = {
  eyebrow: string
  title: string
  strapline: string
  bodyMarkdown: string
  ctaLabel: string
  ctaHref: string
  imageUrl: string
  imageAlt: string
  /** Court libellé vertical décoratif (ex. nom du deck), optionnel */
  spineLabel?: string
}

export function HeroParallaxLayers({
  eyebrow,
  title,
  strapline,
  bodyMarkdown,
  ctaLabel,
  ctaHref,
  imageUrl,
  imageAlt,
  spineLabel,
}: HeroParallaxLayersProps) {
  return (
    <section className="dl-hero dl-hero--parallax" aria-labelledby="dl-hero-pl-title">
      <div className="dl-hero__pl-stack" aria-hidden="true">
        <div className="dl-hero__pl-layer dl-hero__pl-layer--back">
          <img src={imageUrl} alt="" />
        </div>
        <div className="dl-hero__pl-layer dl-hero__pl-layer--mid">
          <img src={imageUrl} alt="" />
        </div>
        <div className="dl-hero__pl-layer dl-hero__pl-layer--front">
          <img src={imageUrl} alt="" />
        </div>
      </div>
      <div className="dl-hero__pl-scrim" aria-hidden="true" />
      {spineLabel ? (
        <span className="dl-hero__pl-spine" aria-hidden="true">
          {spineLabel}
        </span>
      ) : null}
      <div className="dl-hero__pl-content">
        <p className="dl-hero__pl-eyebrow">{eyebrow}</p>
        <h1 id="dl-hero-pl-title" className="dl-hero__pl-title">
          {title}
        </h1>
        <p className="dl-hero__pl-strapline">{strapline}</p>
        <Markdown text={bodyMarkdown} className="dl-hero__pl-body md" />
        <a className="dl-btn dl-btn--on-dark dl-hero__pl-cta" href={ctaHref}>
          {ctaLabel}
        </a>
      </div>
      <img src={imageUrl} alt={imageAlt} className="dl-sr-only" />
    </section>
  )
}
