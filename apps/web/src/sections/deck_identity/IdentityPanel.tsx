import { Markdown } from '../../lib/Markdown'

export type IdentityPanelProps = {
  deckName: string
  tagline: string
  bodyMarkdown: string
  badge?: string
}

export function IdentityPanel({
  deckName,
  tagline,
  bodyMarkdown,
  badge,
}: IdentityPanelProps) {
  return (
    <section id="identite" className="dl-id dl-id--panel" aria-labelledby="dl-id-title">
      <div className="dl-id__card">
        {badge ? <span className="dl-id__badge">{badge}</span> : null}
        <h2 id="dl-id-title" className="dl-id__name">
          {deckName}
        </h2>
        <p className="dl-id__tagline">{tagline}</p>
        <Markdown text={bodyMarkdown} />
      </div>
    </section>
  )
}
