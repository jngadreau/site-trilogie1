import { Markdown } from '../../lib/Markdown'

export type NewsletterInlineProps = {
  sectionTitle: string
  bodyMarkdown: string
  fieldLabel?: string
  buttonLabel: string
  /** Note sous le champ (ex. pas de spam, lien politique). */
  footnoteMarkdown?: string
}

export function NewsletterInline({
  sectionTitle,
  bodyMarkdown,
  fieldLabel = 'Votre e-mail',
  buttonLabel,
  footnoteMarkdown,
}: NewsletterInlineProps) {
  return (
    <section id="newsletter" className="dl-newsletter dl-newsletter--inline" aria-labelledby="dl-nl-inline-title">
      <div className="dl-newsletter__panel">
        <h2 id="dl-nl-inline-title" className="dl-newsletter__title">
          {sectionTitle}
        </h2>
        <Markdown text={bodyMarkdown} className="dl-newsletter__body md" />
        <form
          className="dl-newsletter__form"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <label className="dl-sr-only" htmlFor="dl-nl-inline-email">
            {fieldLabel}
          </label>
          <input
            id="dl-nl-inline-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder={fieldLabel}
            className="dl-newsletter__input"
          />
          <button type="submit" className="dl-btn dl-newsletter__btn">
            {buttonLabel}
          </button>
        </form>
        {footnoteMarkdown ? <Markdown text={footnoteMarkdown} className="dl-newsletter__foot md" /> : null}
      </div>
    </section>
  )
}
