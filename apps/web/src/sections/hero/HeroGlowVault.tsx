import type { CSSProperties } from 'react'
import { Markdown } from '../../lib/Markdown'

export type HeroGlowVaultProps = {
  kicker: string
  title: string
  bodyMarkdown: string
  ctaLabel: string
  ctaHref: string
  imageUrl: string
  imageAlt: string
  /** 0.35–0.95 — intensité du halo radial sur l’image */
  glowIntensity: number
}

export function HeroGlowVault({
  kicker,
  title,
  bodyMarkdown,
  ctaLabel,
  ctaHref,
  imageUrl,
  imageAlt,
  glowIntensity,
}: HeroGlowVaultProps) {
  const g = Math.min(0.95, Math.max(0.35, glowIntensity))
  const style = {
    ['--dl-vault-glow' as string]: String(g),
  } as CSSProperties

  return (
    <section className="dl-hero dl-hero--vault" aria-labelledby="dl-hero-vault-title" style={style}>
      <img src={imageUrl} alt={imageAlt} className="dl-hero__vault-bg" />
      <div className="dl-hero__vault-aurora" aria-hidden="true" />
      <div className="dl-hero__vault-vignette" aria-hidden="true" />
      <div className="dl-hero__vault-inner">
        <div className="dl-hero__vault-glass">
          <p className="dl-hero__vault-kicker">{kicker}</p>
          <h1 id="dl-hero-vault-title" className="dl-hero__vault-title">
            {title}
          </h1>
          <Markdown text={bodyMarkdown} className="dl-hero__vault-body md" />
          <a className="dl-btn dl-hero__vault-cta" href={ctaHref}>
            {ctaLabel}
          </a>
        </div>
      </div>
    </section>
  )
}
