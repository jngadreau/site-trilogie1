import { Markdown } from '../../lib/Markdown'

export type RelatedDeckInlineItem = {
  label: string
  descriptionMarkdown: string
  href: string
}

export type RelatedDecksInlineProps = {
  sectionTitle: string
  introMarkdown?: string
  items: RelatedDeckInlineItem[]
}

export function RelatedDecksInline({ sectionTitle, introMarkdown, items }: RelatedDecksInlineProps) {
  return (
    <section
      id="trilogie"
      className="dl-related dl-related--inline"
      aria-labelledby="dl-related-inline-title"
    >
      <h2 id="dl-related-inline-title" className="dl-section-title">
        {sectionTitle}
      </h2>
      {introMarkdown ? <Markdown text={introMarkdown} className="dl-related__intro md" /> : null}
      <ul className="dl-related__inline-list">
        {items.map((it, i) => (
          <li key={i} className="dl-related__inline-item">
            <a className="dl-related__inline-link" href={it.href}>
              {it.label}
            </a>
            <Markdown text={it.descriptionMarkdown} className="dl-related__inline-desc md" />
          </li>
        ))}
      </ul>
    </section>
  )
}
