import { Markdown } from '../../lib/Markdown'

export type TestimonialStripQuote = {
  quoteMarkdown: string
  name?: string
  role?: string
}

export type TestimonialStripProps = {
  sectionTitle: string
  introMarkdown?: string
  quotes: TestimonialStripQuote[]
}

export function TestimonialStrip({ sectionTitle, introMarkdown, quotes }: TestimonialStripProps) {
  const slice = quotes.slice(0, 5)
  return (
    <section
      id="temoignages"
      className="dl-testimonial dl-testimonial--strip"
      aria-labelledby="dl-testimonial-strip-title"
    >
      <h2 id="dl-testimonial-strip-title" className="dl-section-title">
        {sectionTitle}
      </h2>
      {introMarkdown ? <Markdown text={introMarkdown} className="dl-testimonial__intro md" /> : null}
      <ul className="dl-testimonial__strip-grid">
        {slice.map((q, i) => (
          <li key={i} className="dl-testimonial__strip-card">
            <blockquote className="dl-testimonial__quote">
              <Markdown text={q.quoteMarkdown} className="md" />
            </blockquote>
            {(q.name || q.role) && (
              <footer className="dl-testimonial__attr">
                {q.name ? <cite className="dl-testimonial__name">{q.name}</cite> : null}
                {q.role ? <span className="dl-testimonial__role">{q.role}</span> : null}
              </footer>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
