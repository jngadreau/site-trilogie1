import { Markdown } from '../../lib/Markdown'

type PhotoMasonryCascadeItem = {
  imageUrl: string
  alt?: string
  imageAlt?: string
  title?: string
  captionMarkdown?: string
}

export type PhotoMasonryCascadeProps = {
  sectionTitle: string
  introMarkdown?: string
  photos: PhotoMasonryCascadeItem[]
}

function itemAlt(item: PhotoMasonryCascadeItem): string {
  return item.alt ?? item.imageAlt ?? ''
}

export function PhotoMasonryCascade({
  sectionTitle,
  introMarkdown,
  photos,
}: PhotoMasonryCascadeProps) {
  const visiblePhotos = photos.slice(0, 8)

  return (
    <section
      id="photo-masonry-cascade"
      className="dl-photo-gallery dl-photo-gallery--masonry"
      aria-labelledby="dl-photo-masonry-title"
    >
      <h2 id="dl-photo-masonry-title" className="dl-section-title">
        {sectionTitle}
      </h2>
      {introMarkdown ? <Markdown text={introMarkdown} className="dl-photo-gallery__intro md" /> : null}
      <ul className="dl-photo-gallery__masonry-grid">
        {visiblePhotos.map((item, i) => (
          <li key={`${item.imageUrl}-${i}`} className="dl-photo-gallery__masonry-cell">
            <figure className="dl-photo-gallery__masonry-fig">
              <img
                src={item.imageUrl}
                alt={itemAlt(item)}
                className="dl-photo-gallery__masonry-img"
                loading="lazy"
              />
              {(item.title || item.captionMarkdown) && (
                <figcaption className="dl-photo-gallery__masonry-cap">
                  {item.title ? <span className="dl-photo-gallery__masonry-title">{item.title}</span> : null}
                  {item.captionMarkdown ? (
                    <Markdown text={item.captionMarkdown} className="dl-photo-gallery__masonry-body md" />
                  ) : null}
                </figcaption>
              )}
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}
