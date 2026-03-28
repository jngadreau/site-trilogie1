import { Markdown } from '../../lib/Markdown'

export type HeroSplitImageRightProps = {
  title: string
  subtitle: string
  bodyMarkdown: string
  ctaLabel: string
  ctaHref: string
  imageUrl: string
  imageAlt: string
}

export function HeroSplitImageRight({
  title,
  subtitle,
  bodyMarkdown,
  ctaLabel,
  ctaHref,
  imageUrl,
  imageAlt,
}: HeroSplitImageRightProps) {
  return (
    <section className="dl-hero dl-hero--split" aria-labelledby="dl-hero-title">
      <div className="dl-hero__copy">
        <p className="dl-hero__subtitle">{subtitle}</p>
        <h1 id="dl-hero-title" className="dl-hero__title">
          {title}
        </h1>
        <Markdown text={bodyMarkdown} className="dl-hero__body" />
        <a className="dl-btn dl-hero__cta" href={ctaHref}>
          {ctaLabel}
        </a>
      </div>
      <div className="dl-hero__visual">
        <img src={imageUrl} alt={imageAlt} className="dl-hero__img" loading="eager" />
      </div>
    </section>
  )
}
