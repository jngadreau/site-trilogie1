import { Markdown } from '../../lib/Markdown'

export type SignalItem = {
  label: string
  detailMarkdown: string
}

export type OutcomesSignalStripProps = {
  sectionTitle: string
  introMarkdown: string
  signals: SignalItem[]
}

export function OutcomesSignalStrip({
  sectionTitle,
  introMarkdown,
  signals,
}: OutcomesSignalStripProps) {
  return (
    <section id="bienfaits" className="dl-outcomes dl-signal" aria-labelledby="dl-signal-title">
      <div className="dl-signal__head">
        <h2 id="dl-signal-title" className="dl-section-title">
          {sectionTitle}
        </h2>
        <Markdown text={introMarkdown} className="dl-signal__intro md" />
      </div>
      <ul className="dl-signal__list">
        {signals.map((s, i) => (
          <li key={i} className="dl-signal__item">
            <span className="dl-signal__pulse" aria-hidden="true" />
            <div className="dl-signal__text">
              <span className="dl-signal__label">{s.label}</span>
              <Markdown text={s.detailMarkdown} className="dl-signal__detail md" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
