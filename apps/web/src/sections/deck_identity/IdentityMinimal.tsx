import { Markdown } from '../../lib/Markdown'

export type IdentityMinimalProps = {
  eyebrow: string
  title: string
  oneLiner: string
}

export function IdentityMinimal({ eyebrow, title, oneLiner }: IdentityMinimalProps) {
  return (
    <section id="identite" className="dl-id dl-id--minimal" aria-labelledby="dl-id-min-title">
      <p className="dl-id__eyebrow">{eyebrow}</p>
      <h2 id="dl-id-min-title" className="dl-id__title-min">
        {title}
      </h2>
      <Markdown text={oneLiner} className="dl-id__one-liner" />
    </section>
  )
}
