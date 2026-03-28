import { Markdown } from '../../lib/Markdown'
import { resolveCardGalleryItems, type CardGalleryItemsSource } from './cardGalleryItems'

export type { CardGalleryItem, CardGallerySlot } from './cardGalleryItems'

export type CardGalleryGridProps = CardGalleryItemsSource & {
  sectionTitle: string
  introMarkdown?: string
}

export function CardGalleryGrid(props: CardGalleryGridProps) {
  const { sectionTitle, introMarkdown, ...source } = props
  const items = resolveCardGalleryItems(source)

  return (
    <section
      id="apercu-cartes"
      className="dl-card-gallery dl-card-gallery--grid"
      aria-labelledby="dl-card-gallery-grid-title"
    >
      <h2 id="dl-card-gallery-grid-title" className="dl-section-title">
        {sectionTitle}
      </h2>
      {introMarkdown ? <Markdown text={introMarkdown} className="dl-card-gallery__intro md" /> : null}
      <ul className="dl-card-gallery__grid">
        {items.map((c, i) => (
          <li key={`${c.imageUrl}-${i}`} className="dl-card-gallery__cell">
            <figure className="dl-card-gallery__fig">
              <div className="dl-card-gallery__img-frame">
                <img src={c.imageUrl} alt={c.alt} className="dl-card-gallery__img" loading="lazy" />
              </div>
              {c.captionMarkdown ? (
                <figcaption className="dl-card-gallery__figcaption">
                  <Markdown text={c.captionMarkdown} className="dl-card-gallery__cap md" />
                </figcaption>
              ) : null}
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}
