import { Markdown } from '../../lib/Markdown'

export type FaqColumnItem = {
  question: string
  answerMarkdown: string
}

export type FaqTwoColumnProps = {
  sectionTitle: string
  introMarkdown?: string
  leftColumnTitle?: string
  rightColumnTitle?: string
  leftItems: FaqColumnItem[]
  rightItems: FaqColumnItem[]
}

export function FaqTwoColumn({
  sectionTitle,
  introMarkdown,
  leftColumnTitle,
  rightColumnTitle,
  leftItems,
  rightItems,
}: FaqTwoColumnProps) {
  return (
    <section id="faq" className="dl-faq dl-faq--twocol" aria-labelledby="dl-faq-tc-title">
      <h2 id="dl-faq-tc-title" className="dl-section-title">
        {sectionTitle}
      </h2>
      {introMarkdown ? <Markdown text={introMarkdown} className="dl-faq__intro md" /> : null}
      <div className="dl-faq__twocol">
        <div className="dl-faq__col">
          {leftColumnTitle ? <h3 className="dl-faq__col-title">{leftColumnTitle}</h3> : null}
          <ul className="dl-faq__stack">
            {leftItems.map((it, i) => (
              <li key={i} className="dl-faq__stack-item">
                <p className="dl-faq__q">{it.question}</p>
                <Markdown text={it.answerMarkdown} className="dl-faq__a md" />
              </li>
            ))}
          </ul>
        </div>
        <div className="dl-faq__col">
          {rightColumnTitle ? <h3 className="dl-faq__col-title">{rightColumnTitle}</h3> : null}
          <ul className="dl-faq__stack">
            {rightItems.map((it, i) => (
              <li key={i} className="dl-faq__stack-item">
                <p className="dl-faq__q">{it.question}</p>
                <Markdown text={it.answerMarkdown} className="dl-faq__a md" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
