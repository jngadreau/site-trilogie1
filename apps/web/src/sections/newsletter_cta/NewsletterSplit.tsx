import { Markdown } from '../../lib/Markdown'

export type NewsletterSplitProps = {
  sectionTitle: string
  leadMarkdown: string
  fieldLabel?: string
  buttonLabel: string
  asideMarkdown?: string
}

export function NewsletterSplit({
  sectionTitle,
  leadMarkdown,
  fieldLabel = 'E-mail',
  buttonLabel,
  asideMarkdown,
}: NewsletterSplitProps) {
  return (
    <section id="newsletter" className="dl-newsletter dl-newsletter--split" aria-labelledby="dl-nl-split-title">
      <div className="dl-newsletter__split">
        <div className="dl-newsletter__split-copy">
          <h2 id="dl-nl-split-title" className="dl-newsletter__title">
            {sectionTitle}
          </h2>
          <Markdown text={leadMarkdown} className="dl-newsletter__body md" />
        </div>
        <div className="dl-newsletter__split-form-wrap">
          <form
            className="dl-newsletter__form dl-newsletter__form--stack"
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
            <label className="dl-sr-only" htmlFor="dl-nl-split-email">
              {fieldLabel}
            </label>
            <input
              id="dl-nl-split-email"
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
          {asideMarkdown ? <Markdown text={asideMarkdown} className="dl-newsletter__aside md" /> : null}
        </div>
      </div>
    </section>
  )
}
