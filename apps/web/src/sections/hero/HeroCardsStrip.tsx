import { Markdown } from '../../lib/Markdown'
import type { HeroDeckCard } from './HeroCardsFan'

export type HeroCardsStripProps = {
  title: string
  subtitle: string
  bodyMarkdown: string
  ctaLabel: string
  ctaHref: string
  /** 4 à 9 cartes en bandeau horizontal (scroll sur mobile). */
  cards: HeroDeckCard[]
}

export function HeroCardsStrip({
  title,
  subtitle,
  bodyMarkdown,
  ctaLabel,
  ctaHref,
  cards,
}: HeroCardsStripProps) {
  const slice = cards.slice(0, 9)

  return (
    <section className="dl-hero dl-hero--cards-strip" aria-labelledby="dl-hero-strip-title">
      <div className="dl-hero__cards-strip-head">
        <p className="dl-hero__cards-strip-sub">{subtitle}</p>
        <h1 id="dl-hero-strip-title" className="dl-hero__cards-strip-title">
          {title}
        </h1>
        <Markdown text={bodyMarkdown} className="dl-hero__cards-strip-body md" />
        <a className="dl-btn dl-hero__cards-strip-cta" href={ctaHref}>
          {ctaLabel}
        </a>
      </div>
      <div className="dl-hero__cards-strip-rail" role="list">
        {slice.map((c, i) => (
          <div key={`${c.imageUrl}-${i}`} className="dl-hero__cards-strip-card" role="listitem">
            <img src={c.imageUrl} alt={c.alt} className="dl-hero__cards-strip-img" loading="lazy" />
            {c.caption ? <span className="dl-hero__cards-strip-cap">{c.caption}</span> : null}
          </div>
        ))}
      </div>
    </section>
  )
}
