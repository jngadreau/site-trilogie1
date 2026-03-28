import { Markdown } from '../../lib/Markdown'

export type BentoCell = {
  title: string
  bodyMarkdown: string
  /** `wide` | `tall` | `featured` — contrôle la taille dans la grille */
  span?: 'wide' | 'tall' | 'featured'
}

export type OutcomesBentoGridProps = {
  sectionTitle: string
  introMarkdown: string
  cells: BentoCell[]
}

export function OutcomesBentoGrid({ sectionTitle, introMarkdown, cells }: OutcomesBentoGridProps) {
  return (
    <section id="bienfaits" className="dl-outcomes dl-bento" aria-labelledby="dl-bento-title">
      <h2 id="dl-bento-title" className="dl-section-title">
        {sectionTitle}
      </h2>
      <Markdown text={introMarkdown} className="dl-bento__intro md" />
      <ul className="dl-bento__grid">
        {cells.map((c, i) => {
          const span = c.span ? `dl-bento__cell--${c.span}` : ''
          return (
            <li key={i} className={`dl-bento__cell ${span}`.trim()}>
              <h3 className="dl-bento__cell-title">{c.title}</h3>
              <Markdown text={c.bodyMarkdown} className="dl-bento__cell-body md" />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
