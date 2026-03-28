import { Markdown } from '../../lib/Markdown'

export type TestimonialSpotlightProps = {
  sectionTitle: string
  introMarkdown?: string
  quoteMarkdown: string
  name: string
  roleLine?: string
  imageUrl?: string
  imageAlt?: string
}

export function TestimonialSpotlight({
  sectionTitle,
  introMarkdown,
  quoteMarkdown,
  name,
  roleLine,
  imageUrl,
  imageAlt,
}: TestimonialSpotlightProps) {
  return (
    <section
      id="temoignage"
      className="dl-testimonial dl-testimonial--spotlight"
      aria-labelledby="dl-testimonial-spot-title"
    >
      <h2 id="dl-testimonial-spot-title" className="dl-section-title">
        {sectionTitle}
      </h2>
      {introMarkdown ? <Markdown text={introMarkdown} className="dl-testimonial__intro md" /> : null}
      <div className="dl-testimonial__spot-inner">
        {imageUrl ? (
          <div className="dl-testimonial__spot-visual">
            <img src={imageUrl} alt={imageAlt ?? ''} className="dl-testimonial__spot-img" loading="lazy" />
          </div>
        ) : null}
        <div className="dl-testimonial__spot-copy">
          <blockquote className="dl-testimonial__spot-quote">
            <Markdown text={quoteMarkdown} className="md" />
          </blockquote>
          <footer className="dl-testimonial__spot-footer">
            <cite className="dl-testimonial__name">{name}</cite>
            {roleLine ? <span className="dl-testimonial__role">{roleLine}</span> : null}
          </footer>
        </div>
      </div>
    </section>
  )
}
