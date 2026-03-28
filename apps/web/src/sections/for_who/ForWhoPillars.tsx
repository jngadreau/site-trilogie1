import { Markdown } from '../../lib/Markdown'

export type Pillar = { title: string; bodyMarkdown: string }

export type ForWhoPillarsProps = {
  title: string
  introMarkdown: string
  pillars: Pillar[]
}

export function ForWhoPillars({ title, introMarkdown, pillars }: ForWhoPillarsProps) {
  return (
    <section className="dl-for dl-for--pillars" aria-labelledby="dl-pillars-title">
      <h2 id="dl-pillars-title" className="dl-section-title">
        {title}
      </h2>
      <Markdown text={introMarkdown} className="dl-for__intro" />
      <ul className="dl-pillars">
        {pillars.map((p, i) => (
          <li key={i} className="dl-pillars__item">
            <h3 className="dl-pillars__head">{p.title}</h3>
            <Markdown text={p.bodyMarkdown} />
          </li>
        ))}
      </ul>
    </section>
  )
}
