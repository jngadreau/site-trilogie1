import { Markdown } from '../../lib/Markdown'

export type ForWhoTwoColumnsProps = {
  title: string
  leftMarkdown: string
  rightMarkdown: string
}

export function ForWhoTwoColumns({
  title,
  leftMarkdown,
  rightMarkdown,
}: ForWhoTwoColumnsProps) {
  return (
    <section className="dl-for" aria-labelledby="dl-for-title">
      <h2 id="dl-for-title" className="dl-section-title">
        {title}
      </h2>
      <div className="dl-for__grid">
        <Markdown text={leftMarkdown} />
        <Markdown text={rightMarkdown} />
      </div>
    </section>
  )
}
