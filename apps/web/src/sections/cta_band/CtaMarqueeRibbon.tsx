export type CtaMarqueeRibbonProps = {
  eyebrow: string
  headline: string
  subline: string
  ctaLabel: string
  ctaHref: string
  /** Texte défilant répété (ex. mots-clés séparés par des points centrés) */
  marqueeText: string
}

export function CtaMarqueeRibbon({
  eyebrow,
  headline,
  subline,
  ctaLabel,
  ctaHref,
  marqueeText,
}: CtaMarqueeRibbonProps) {
  const repeated = `${marqueeText} · ${marqueeText} · ${marqueeText} · `
  return (
    <section className="dl-cta dl-cta--ribbon" aria-labelledby="dl-cta-ribbon-title">
      <div className="dl-cta__marquee" aria-hidden="true">
        <div className="dl-cta__marquee-track">{repeated}</div>
      </div>
      <div className="dl-cta__ribbon-inner">
        <p className="dl-cta__eyebrow">{eyebrow}</p>
        <h2 id="dl-cta-ribbon-title" className="dl-cta__headline">
          {headline}
        </h2>
        <p className="dl-cta__subline">{subline}</p>
        <a className="dl-btn dl-cta__btn" href={ctaHref}>
          {ctaLabel}
        </a>
      </div>
    </section>
  )
}
