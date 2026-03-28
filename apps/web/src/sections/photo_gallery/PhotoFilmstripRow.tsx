import { Markdown } from '../../lib/Markdown'

export type PhotoFilmstripItem = {
  imageUrl: string
  alt: string
  label?: string
}

export type PhotoFilmstripRowProps = {
  sectionTitle: string
  introMarkdown?: string
  /** 3 à 5 images en bandeau panoramique (ambiance, matière, lumière). */
  items: PhotoFilmstripItem[]
}

export function PhotoFilmstripRow({ sectionTitle, introMarkdown, items }: PhotoFilmstripRowProps) {
  return (
    <section
      id="bandeau-photos"
      className="dl-photo-gallery dl-photo-gallery--filmstrip"
      aria-labelledby="dl-photo-filmstrip-title"
    >
      <h2 id="dl-photo-filmstrip-title" className="dl-section-title">
        {sectionTitle}
      </h2>
      {introMarkdown ? <Markdown text={introMarkdown} className="dl-photo-gallery__intro md" /> : null}
      <ul className="dl-photo-gallery__film-row">
        {items.map((it, i) => (
          <li key={`${it.imageUrl}-${i}`} className="dl-photo-gallery__film-cell">
            <div className="dl-photo-gallery__film-frame">
              <img src={it.imageUrl} alt={it.alt} className="dl-photo-gallery__film-img" loading="lazy" />
            </div>
            {it.label ? <span className="dl-photo-gallery__film-label">{it.label}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
