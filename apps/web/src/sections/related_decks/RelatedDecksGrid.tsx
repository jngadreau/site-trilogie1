import { Markdown } from '../../lib/Markdown'

export type RelatedDeckItem = {
  deckName: string
  tagline: string
  bodyMarkdown: string
  href: string
  ctaLabel?: string
}

export type RelatedDecksGridProps = {
  sectionTitle: string
  introMarkdown?: string
  decks: RelatedDeckItem[]
}

export function RelatedDecksGrid({ sectionTitle, introMarkdown, decks }: RelatedDecksGridProps) {
  const slice = decks.slice(0, 4)
  return (
    <section
      id="trilogie"
      className="dl-related dl-related--grid"
      aria-labelledby="dl-related-grid-title"
    >
      <h2 id="dl-related-grid-title" className="dl-section-title">
        {sectionTitle}
      </h2>
      {introMarkdown ? <Markdown text={introMarkdown} className="dl-related__intro md" /> : null}
      <ul className="dl-related__grid">
        {slice.map((d, i) => (
          <li key={i} className="dl-related__card">
            <h3 className="dl-related__card-name">{d.deckName}</h3>
            <p className="dl-related__card-tag">{d.tagline}</p>
            <Markdown text={d.bodyMarkdown} className="dl-related__card-body md" />
            <a className="dl-btn dl-btn--ghost dl-related__card-link" href={d.href}>
              {d.ctaLabel ?? 'Découvrir'}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
