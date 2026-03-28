import { Markdown } from '../../lib/Markdown'

export type PhotoSpotlightItem = {
  imageUrl: string
  alt: string
  title?: string
  captionMarkdown?: string
}

export type PhotoSpotlightGridProps = {
  sectionTitle: string
  introMarkdown?: string
  /** 2 à 6 visuels : ambiance, coffret, détails — URLs relatives `/ai/generated-images/…`. */
  photos: PhotoSpotlightItem[]
}

export function PhotoSpotlightGrid({ sectionTitle, introMarkdown, photos }: PhotoSpotlightGridProps) {
  return (
    <section
      id="galerie-photos"
      className="dl-photo-gallery dl-photo-gallery--spotlight"
      aria-labelledby="dl-photo-spotlight-title"
    >
      <h2 id="dl-photo-spotlight-title" className="dl-section-title">
        {sectionTitle}
      </h2>
      {introMarkdown ? <Markdown text={introMarkdown} className="dl-photo-gallery__intro md" /> : null}
      <ul className="dl-photo-gallery__spot-grid">
        {photos.map((p, i) => (
          <li key={`${p.imageUrl}-${i}`} className="dl-photo-gallery__spot-cell">
            <figure className="dl-photo-gallery__spot-fig">
              <img src={p.imageUrl} alt={p.alt} className="dl-photo-gallery__spot-img" loading="lazy" />
              <figcaption className="dl-photo-gallery__spot-cap">
                {p.title ? <span className="dl-photo-gallery__spot-title">{p.title}</span> : null}
                {p.captionMarkdown ? (
                  <Markdown text={p.captionMarkdown} className="dl-photo-gallery__spot-body md" />
                ) : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}
