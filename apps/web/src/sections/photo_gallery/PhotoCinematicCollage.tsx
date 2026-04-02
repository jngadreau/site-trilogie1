import { Markdown } from '../../lib/Markdown'

type PhotoCinematicCollageItem = {
  imageUrl: string
  alt?: string
  imageAlt?: string
  title?: string
  captionMarkdown?: string
}

export type PhotoCinematicCollageProps = {
  sectionTitle: string
  introMarkdown?: string
  headline?: string
  bodyMarkdown?: string
  ctaLabel?: string
  ctaHref?: string
  /** Utilise `photos` pour rester compatible avec le patch automatique imageSlots (`photo-<index>`). */
  photos: PhotoCinematicCollageItem[]
}

function imageAlt(item: PhotoCinematicCollageItem): string {
  return item.alt ?? item.imageAlt ?? ''
}

export function PhotoCinematicCollage({
  sectionTitle,
  introMarkdown,
  headline,
  bodyMarkdown,
  ctaLabel,
  ctaHref,
  photos,
}: PhotoCinematicCollageProps) {
  const [lead, ...supporting] = photos
  if (!lead) {
    return null
  }
  const supportingCards = supporting.slice(0, 4)

  return (
    <section
      id="photo-cinematic-collage"
      className="dl-photo-gallery dl-photo-gallery--cinematic"
      aria-labelledby="dl-photo-cinematic-title"
    >
      <h2 id="dl-photo-cinematic-title" className="dl-section-title">
        {sectionTitle}
      </h2>
      {introMarkdown ? <Markdown text={introMarkdown} className="dl-photo-gallery__intro md" /> : null}
      <div className="dl-photo-gallery__cinematic-grid">
        <figure className="dl-photo-gallery__cinematic-lead">
          <img
            src={lead.imageUrl}
            alt={imageAlt(lead)}
            className="dl-photo-gallery__cinematic-lead-img"
            loading="lazy"
          />
          {(lead.title || lead.captionMarkdown) && (
            <figcaption className="dl-photo-gallery__cinematic-lead-cap">
              {lead.title ? <p className="dl-photo-gallery__cinematic-lead-title">{lead.title}</p> : null}
              {lead.captionMarkdown ? (
                <Markdown text={lead.captionMarkdown} className="dl-photo-gallery__cinematic-lead-body md" />
              ) : null}
            </figcaption>
          )}
        </figure>
        <aside className="dl-photo-gallery__cinematic-side">
          {(headline || bodyMarkdown) && (
            <div className="dl-photo-gallery__cinematic-copy">
              {headline ? <p className="dl-photo-gallery__cinematic-headline">{headline}</p> : null}
              {bodyMarkdown ? <Markdown text={bodyMarkdown} className="dl-photo-gallery__cinematic-body md" /> : null}
              {ctaLabel && ctaHref ? (
                <a className="dl-btn dl-photo-gallery__cinematic-cta" href={ctaHref}>
                  {ctaLabel}
                </a>
              ) : null}
            </div>
          )}
          {supportingCards.length > 0 ? (
            <ul className="dl-photo-gallery__cinematic-mini-grid">
              {supportingCards.map((item, i) => (
                <li key={`${item.imageUrl}-${i}`} className="dl-photo-gallery__cinematic-mini-cell">
                  <figure className="dl-photo-gallery__cinematic-mini-fig">
                    <img
                      src={item.imageUrl}
                      alt={imageAlt(item)}
                      className="dl-photo-gallery__cinematic-mini-img"
                      loading="lazy"
                    />
                    {(item.title || item.captionMarkdown) && (
                      <figcaption className="dl-photo-gallery__cinematic-mini-cap">
                        {item.title ? (
                          <span className="dl-photo-gallery__cinematic-mini-title">{item.title}</span>
                        ) : null}
                        {item.captionMarkdown ? (
                          <Markdown text={item.captionMarkdown} className="dl-photo-gallery__cinematic-mini-body md" />
                        ) : null}
                      </figcaption>
                    )}
                  </figure>
                </li>
              ))}
            </ul>
          ) : null}
        </aside>
      </div>
    </section>
  )
}
