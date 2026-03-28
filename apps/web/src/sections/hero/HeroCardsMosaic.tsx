import { Markdown } from '../../lib/Markdown'
import type { HeroDeckCard } from './HeroCardsFan'

export type HeroCardsMosaicProps = {
  title: string
  tagline: string
  bodyMarkdown: string
  ctaLabel: string
  ctaHref: string
  /** 4 à 6 cartes — première en grand, les autres en mosaïque à droite. */
  cards: HeroDeckCard[]
}

export function HeroCardsMosaic({
  title,
  tagline,
  bodyMarkdown,
  ctaLabel,
  ctaHref,
  cards,
}: HeroCardsMosaicProps) {
  const n = Math.min(6, Math.max(4, cards.length))
  const slice = cards.slice(0, n)
  const [featured, ...rest] = slice

  return (
    <section className="dl-hero dl-hero--cards-mosaic" aria-labelledby="dl-hero-mosaic-title">
      <div className="dl-hero__cards-mosaic-grid">
        <div className="dl-hero__cards-mosaic-visual" aria-label="Mosaïque de cartes du jeu">
          <div className="dl-hero__cards-mosaic-feature">
            <img
              src={featured.imageUrl}
              alt={featured.alt}
              className="dl-hero__cards-mosaic-img dl-hero__cards-mosaic-img--feature"
              loading="eager"
            />
            {featured.caption ? (
              <span className="dl-hero__cards-mosaic-feature-cap">{featured.caption}</span>
            ) : null}
          </div>
          <div className="dl-hero__cards-mosaic-stack">
            {rest.map((c, i) => (
              <div key={`${c.imageUrl}-${i}`} className="dl-hero__cards-mosaic-mini">
                <img src={c.imageUrl} alt={c.alt} className="dl-hero__cards-mosaic-img" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
        <div className="dl-hero__cards-mosaic-copy">
          <p className="dl-hero__cards-mosaic-tag">{tagline}</p>
          <h1 id="dl-hero-mosaic-title" className="dl-hero__cards-mosaic-title">
            {title}
          </h1>
          <Markdown text={bodyMarkdown} className="dl-hero__cards-mosaic-body md" />
          <a className="dl-btn" href={ctaHref}>
            {ctaLabel}
          </a>
        </div>
      </div>
    </section>
  )
}
