import { Markdown } from '../../lib/Markdown'

export type NumberedStep = { title: string; bodyMarkdown: string }

export type HowToNumberedProps = {
  title: string
  introMarkdown?: string
  steps: NumberedStep[]
}

export function HowToNumbered({ title, introMarkdown, steps }: HowToNumberedProps) {
  return (
    <section className="dl-how dl-how--numbered" aria-labelledby="dl-how-num-title">
      <h2 id="dl-how-num-title" className="dl-section-title">
        {title}
      </h2>
      {introMarkdown ? <Markdown text={introMarkdown} className="dl-how__intro" /> : null}
      <ol className="dl-steps-num">
        {steps.map((s, i) => (
          <li key={i} className="dl-steps-num__item">
            <h3 className="dl-steps-num__head">{s.title}</h3>
            <Markdown text={s.bodyMarkdown} />
          </li>
        ))}
      </ol>
    </section>
  )
}
