import { Markdown } from '../../lib/Markdown'

export type IncludedHighlight = {
  title: string
  bodyMarkdown: string
}

export type IncludedHighlightGridProps = {
  sectionTitle: string
  introMarkdown?: string
  /** 2 à 6 blocs courts (format physique, livret, accessoires…). */
  highlights: IncludedHighlight[]
}

export function IncludedHighlightGrid({
  sectionTitle,
  introMarkdown,
  highlights,
}: IncludedHighlightGridProps) {
  const slice = highlights.slice(0, 6)
  return (
    <section
      id="contenu"
      className="dl-included dl-included--grid"
      aria-labelledby="dl-included-hg-title"
    >
      <h2 id="dl-included-hg-title" className="dl-section-title">
        {sectionTitle}
      </h2>
      {introMarkdown ? (
        <Markdown text={introMarkdown} className="dl-included__intro md" />
      ) : null}
      <ul className="dl-included__grid">
        {slice.map((h, i) => (
          <li key={i} className="dl-included__grid-cell">
            <h3 className="dl-included__grid-head">{h.title}</h3>
            <Markdown text={h.bodyMarkdown} className="dl-included__grid-body md" />
          </li>
        ))}
      </ul>
    </section>
  )
}
