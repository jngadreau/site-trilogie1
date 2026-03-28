import { Markdown } from '../../lib/Markdown'

export type TimelineStep = { label: string; detailMarkdown: string }

export type HowToTimelineProps = {
  title: string
  introMarkdown: string
  steps: TimelineStep[]
}

export function HowToTimeline({ title, introMarkdown, steps }: HowToTimelineProps) {
  return (
    <section className="dl-how dl-how--timeline" aria-labelledby="dl-how-tl-title">
      <h2 id="dl-how-tl-title" className="dl-section-title">
        {title}
      </h2>
      <Markdown text={introMarkdown} className="dl-how__intro" />
      <ul className="dl-timeline">
        {steps.map((s, i) => (
          <li key={i} className="dl-timeline__item">
            <span className="dl-timeline__dot" aria-hidden="true" />
            <div className="dl-timeline__content">
              <p className="dl-timeline__label">{s.label}</p>
              <Markdown text={s.detailMarkdown} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
