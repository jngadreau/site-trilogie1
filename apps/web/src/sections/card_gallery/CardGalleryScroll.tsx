import { Markdown } from '../../lib/Markdown'
import { resolveCardGalleryItems, type CardGalleryItemsSource } from './cardGalleryItems'

export type CardGalleryScrollProps = CardGalleryItemsSource & {
  sectionTitle: string
  introMarkdown?: string
}

export function CardGalleryScroll(props: CardGalleryScrollProps) {
  const { sectionTitle, introMarkdown, ...source } = props
  const items = resolveCardGalleryItems(source)

  return (
    <section
      id="defile-cartes"
      className="dl-card-gallery dl-card-gallery--scroll"
      aria-labelledby="dl-card-gallery-scroll-title"
    >
      <h2 id="dl-card-gallery-scroll-title" className="dl-section-title">
        {sectionTitle}
      </h2>
      {introMarkdown ? <Markdown text={introMarkdown} className="dl-card-gallery__intro md" /> : null}
      <div className="dl-card-gallery__scroll-wrap" tabIndex={0} role="region" aria-label={sectionTitle}>
        <ul className="dl-card-gallery__scroll-rail">
          {items.map((c, i) => (
            <li key={`${c.imageUrl}-${i}`} className="dl-card-gallery__scroll-item">
              <figure className="dl-card-gallery__fig dl-card-gallery__fig--scroll">
                <div className="dl-card-gallery__img-frame">
                  <img src={c.imageUrl} alt={c.alt} className="dl-card-gallery__img" loading="lazy" />
                </div>
                {c.captionMarkdown ? (
                  <figcaption className="dl-card-gallery__figcaption dl-card-gallery__figcaption--compact">
                    <Markdown text={c.captionMarkdown} className="dl-card-gallery__cap md" />
                  </figcaption>
                ) : null}
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
