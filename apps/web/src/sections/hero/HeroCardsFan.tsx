import { Markdown } from '../../lib/Markdown'

/** Carte du jeu servie par l’API sous `/cards/arbre-de-vie/:fichier`. */
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
  const n = Math.min(7, Math.max(3, cards.length))
  const slice = cards.slice(0, n)
  const spreadDeg = Math.min(52, 18 + slice.length * 7)

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
            const tx = t * 36
            const z = i
            return (
              <li
                key={`${c.imageUrl}-${i}`}
                className="dl-hero__cards-fan-item"
                style={{
                  transform: `rotate(${rotate}deg) translateX(${tx}px)`,
                  zIndex: z,
                }}
              >
                <figure className="dl-hero__cards-fan-fig">
                  <img
                    src={c.imageUrl}
                    alt={c.alt}
                    className="dl-hero__cards-fan-img"
                    loading="eager"
                  />
                  {c.caption ? <figcaption className="dl-hero__cards-fan-cap">{c.caption}</figcaption> : null}
                </figure>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
