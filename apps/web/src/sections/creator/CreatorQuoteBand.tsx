import { Markdown } from '../../lib/Markdown'

export type CreatorQuoteBandProps = {
  quoteMarkdown: string
  name: string
  roleLine: string
}

export function CreatorQuoteBand({ quoteMarkdown, name, roleLine }: CreatorQuoteBandProps) {
  return (
    <section id="createur" className="dl-creator dl-creator--quote">
      <blockquote
        className="dl-creator__quote-block"
        aria-label={`Citation de ${name}`}
      >
        <Markdown text={quoteMarkdown} className="dl-creator__quote-text md" />
        <footer className="dl-creator__quote-footer">
          <cite className="dl-creator__quote-name">{name}</cite>
          <span className="dl-creator__quote-role">{roleLine}</span>
        </footer>
      </blockquote>
    </section>
  )
}
