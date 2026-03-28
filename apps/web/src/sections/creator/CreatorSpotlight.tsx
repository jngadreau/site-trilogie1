import { Markdown } from '../../lib/Markdown'

export type CreatorSpotlightProps = {
  sectionTitle: string
  name: string
  roleLabel: string
  bodyMarkdown: string
  imageUrl?: string
  imageAlt?: string
  ctaLabel?: string
  ctaHref?: string
}

export function CreatorSpotlight({
  sectionTitle,
  name,
  roleLabel,
  bodyMarkdown,
  imageUrl,
  imageAlt,
  ctaLabel,
  ctaHref,
}: CreatorSpotlightProps) {
  return (
    <section id="createur" className="dl-creator dl-creator--spotlight" aria-labelledby="dl-creator-sp-title">
      <h2 id="dl-creator-sp-title" className="dl-section-title">
        {sectionTitle}
      </h2>
      <div className={`dl-creator__spot-inner${imageUrl ? ' dl-creator__spot-inner--split' : ''}`}>
        {imageUrl ? (
          <div className="dl-creator__spot-visual">
            <img src={imageUrl} alt={imageAlt ?? ''} className="dl-creator__spot-img" loading="lazy" />
          </div>
        ) : null}
        <div className="dl-creator__spot-copy">
          <p className="dl-creator__spot-name">{name}</p>
          <p className="dl-creator__spot-role">{roleLabel}</p>
          <Markdown text={bodyMarkdown} className="dl-creator__spot-body md" />
          {ctaLabel && ctaHref ? (
            <a className="dl-btn dl-creator__spot-cta" href={ctaHref}>
              {ctaLabel}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  )
}
