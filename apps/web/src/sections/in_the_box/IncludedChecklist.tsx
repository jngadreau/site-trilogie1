import { Markdown } from '../../lib/Markdown'

export type IncludedChecklistItem = {
  title: string
  detailMarkdown?: string
}

export type IncludedChecklistProps = {
  sectionTitle: string
  introMarkdown?: string
  items: IncludedChecklistItem[]
}

export function IncludedChecklist({
  sectionTitle,
  introMarkdown,
  items,
}: IncludedChecklistProps) {
  return (
    <section
      id="contenu"
      className="dl-included dl-included--checklist"
      aria-labelledby="dl-included-cl-title"
    >
      <h2 id="dl-included-cl-title" className="dl-section-title">
        {sectionTitle}
      </h2>
      {introMarkdown ? (
        <Markdown text={introMarkdown} className="dl-included__intro md" />
      ) : null}
      <ul className="dl-included__checklist">
        {items.map((it, i) => (
          <li key={i} className="dl-included__check-item">
            <span className="dl-included__check-mark" aria-hidden="true" />
            <div className="dl-included__check-body">
              <span className="dl-included__check-title">{it.title}</span>
              {it.detailMarkdown ? (
                <Markdown text={it.detailMarkdown} className="dl-included__check-detail md" />
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
