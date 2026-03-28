import { Markdown } from '../../lib/Markdown'

export type CtaSplitActionProps = {
  title: string
  bodyMarkdown: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel?: string
  secondaryHref?: string
}

export function CtaSplitAction({
  title,
  bodyMarkdown,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: CtaSplitActionProps) {
  return (
    <section className="dl-cta dl-cta--split" aria-labelledby="dl-cta-split-title">
      <div className="dl-cta__split-copy">
        <h2 id="dl-cta-split-title" className="dl-section-title">
          {title}
        </h2>
        <Markdown text={bodyMarkdown} className="dl-cta__split-body md" />
      </div>
      <div className="dl-cta__split-actions">
        <a className="dl-btn" href={primaryHref}>
          {primaryLabel}
        </a>
        {secondaryLabel && secondaryHref ? (
          <a className="dl-btn dl-btn--ghost" href={secondaryHref}>
            {secondaryLabel}
          </a>
        ) : null}
      </div>
    </section>
  )
}
