import { Markdown } from '../../lib/Markdown'

/** Carte du jeu : URL type `/ai/generated-images/deck-cards/:fichier` (miroir après sync API). */
export type HeroDeckCard = {
  imageUrl: string
  alt: string
  caption?: string
}

export type HeroCardsFanProps = {
  title: string
  kicker: string
  bodyMarkdown: string
  ctaLabel: string
  ctaHref: string
  /** 3 à 7 cartes — disposition en éventail (origine bas centre). */
  cards: HeroDeckCard[]
}

export function HeroCardsFan({
  title,
  kicker,
  bodyMarkdown,
  ctaLabel,
  ctaHref,
  cards,
}: HeroCardsFanProps) {
  const slice = cards.slice(0, Math.min(7, Math.max(1, cards.length)))
  const spreadDeg = slice.length <= 1 ? 0 : Math.min(58, 22 + slice.length * 7)

  return (
    <section className="dl-hero dl-hero--cards-fan" aria-labelledby="dl-hero-fan-title">
      <div className="dl-hero__cards-fan-copy">
        <p className="dl-hero__cards-fan-kicker">{kicker}</p>
        <h1 id="dl-hero-fan-title" className="dl-hero__cards-fan-title">
          {title}
        </h1>
        <Markdown text={bodyMarkdown} className="dl-hero__cards-fan-body md" />
        <a className="dl-btn dl-hero__cards-fan-cta" href={ctaHref}>
          {ctaLabel}
        </a>
      </div>
      <div className="dl-hero__cards-fan-stage" aria-label="Aperçu des cartes du jeu">
        <ul className="dl-hero__cards-fan-list">
          {slice.map((c, i) => {
            const t = slice.length === 1 ? 0 : (i / (slice.length - 1)) * 2 - 1
            const rotate = t * (spreadDeg / 2)
            const mid = (slice.length - 1) / 2
            const z = 30 - Math.round(Math.abs(i - mid) * 3)
            return (
              <li
                key={`${c.imageUrl}-${i}`}
                className="dl-hero__cards-fan-item"
                style={{ zIndex: z }}
              >
                <div
                  className="dl-hero__cards-fan-pivot"
                  style={{ transform: `rotate(${rotate}deg)` }}
                >
                  <img
                    src={c.imageUrl}
                    alt={c.alt}
                    className="dl-hero__cards-fan-img"
                    loading="eager"
                  />
                  {c.caption ? (
                    <span className="dl-hero__cards-fan-cap">{c.caption}</span>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
