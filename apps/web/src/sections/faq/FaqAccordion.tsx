import { Markdown } from '../../lib/Markdown'

export type FaqEntry = {
  question: string
  answerMarkdown: string
}

export type FaqAccordionProps = {
  sectionTitle: string
  introMarkdown?: string
  items: FaqEntry[]
}

export function FaqAccordion({ sectionTitle, introMarkdown, items }: FaqAccordionProps) {
  return (
    <section id="faq" className="dl-faq dl-faq--accordion" aria-labelledby="dl-faq-acc-title">
      <h2 id="dl-faq-acc-title" className="dl-section-title">
        {sectionTitle}
      </h2>
      {introMarkdown ? <Markdown text={introMarkdown} className="dl-faq__intro md" /> : null}
      <div className="dl-faq__list">
        {items.map((it, i) => (
          <details key={i} className="dl-faq__details">
            <summary className="dl-faq__summary">{it.question}</summary>
            <div className="dl-faq__answer">
              <Markdown text={it.answerMarkdown} className="md" />
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
