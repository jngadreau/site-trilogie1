import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Markdown } from '../lib/Markdown'
import './admin-deck-landing.css'

type Dashboard = {
  variants: Record<string, Record<string, string>>
  plans: Record<string, { exists: boolean }>
  landings: Record<string, { exists: boolean; bytes?: number }>
}

type PlanDoc = {
  version: number
  slug: string
  variants: Record<string, string>
  rationaleMarkdown: string
}

const NV_SECTION_ORDER = [
  'hero',
  'deck_identity',
  'for_who',
  'outcomes',
  'how_to_use',
  'cta_band',
] as const

const VARIANT_PICKS: Record<(typeof NV_SECTION_ORDER)[number], readonly string[]> = {
  hero: [
    'HeroSplitImageRight',
    'HeroFullBleed',
    'HeroGlowVault',
    'HeroParallaxLayers',
    'HeroCardsFan',
    'HeroCardsStrip',
    'HeroCardsMosaic',
  ],
  deck_identity: ['IdentityPanel', 'IdentityMinimal'],
  for_who: ['ForWhoTwoColumns', 'ForWhoPillars'],
  outcomes: ['OutcomesBentoGrid', 'OutcomesSignalStrip'],
  how_to_use: ['HowToNumbered', 'HowToTimeline'],
  cta_band: ['CtaMarqueeRibbon', 'CtaSplitAction'],
}

const NV_LABELS: Record<(typeof NV_SECTION_ORDER)[number], string> = {
  hero: 'Hero',
  deck_identity: 'Identité deck',
  for_who: 'Pour qui',
  outcomes: 'Bienfaits (outcomes)',
  how_to_use: 'Comment utiliser',
  cta_band: 'Bandeau CTA',
}

function defaultNv(): Record<(typeof NV_SECTION_ORDER)[number], string> {
  return Object.fromEntries(
    NV_SECTION_ORDER.map((k) => [k, VARIANT_PICKS[k][0]]),
  ) as Record<(typeof NV_SECTION_ORDER)[number], string>
}

type QueueJobRow = {
  queue: string
  id: string
  name: string
  state: string
  data: unknown
  returnvalue?: unknown
  failedReason?: string
  timestamp?: number
  processedOn?: number
  finishedOn?: number
}

export function AdminDeckLandingPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [planViewSlug, setPlanViewSlug] = useState<string>('')
  const [planDoc, setPlanDoc] = useState<PlanDoc | null>(null)
  const [planErr, setPlanErr] = useState<string | null>(null)
  const [queueJobs, setQueueJobs] = useState<QueueJobRow[]>([])

  const [newSlug, setNewSlug] = useState('arbre-de-vie-')
  const [nv, setNv] = useState<Record<(typeof NV_SECTION_ORDER)[number], string>>(defaultNv)

  const refresh = useCallback(() => {
    setErr(null)
    fetch('/site/deck-modular-landing-dashboard')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((d: Dashboard) => setDashboard(d))
      .catch((e: Error) => setErr(e.message))
  }, [])

  const refreshJobs = useCallback(() => {
    fetch('/site/deck-landing-pipeline-jobs?limit=45')
      .then((r) => r.json())
      .then((j: { jobs?: QueueJobRow[] }) => setQueueJobs(j.jobs ?? []))
      .catch(() => setQueueJobs([]))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    refreshJobs()
    const id = setInterval(refreshJobs, 5000)
    return () => clearInterval(id)
  }, [refreshJobs])

  const slugsSorted = dashboard
    ? Object.keys(dashboard.variants).sort((a, b) => a.localeCompare(b))
    : []

  useEffect(() => {
    if (!dashboard) return
    const slugs = Object.keys(dashboard.variants).sort()
    setPlanViewSlug((prev) => (prev && slugs.includes(prev) ? prev : slugs[0] ?? ''))
  }, [dashboard])

  useEffect(() => {
    if (!planViewSlug) {
      setPlanDoc(null)
      setPlanErr(null)
      return
    }
    let cancelled = false
    fetch(`/site/deck-landing-variant-plan/${encodeURIComponent(planViewSlug)}`)
      .then((r) => {
        if (!r.ok) {
          if (!cancelled) {
            setPlanDoc(null)
            setPlanErr(r.status === 404 ? 'Pas encore de plan pour ce slug.' : `${r.status}`)
          }
          return null
        }
        return r.json()
      })
      .then((p: PlanDoc | null) => {
        if (cancelled || !p) return
        setPlanDoc(p)
        setPlanErr(null)
      })
      .catch(() => {
        if (!cancelled) setPlanErr('Erreur chargement plan')
      })
    return () => {
      cancelled = true
    }
  }, [planViewSlug, dashboard])

  async function post(
    path: string,
    label: string,
    formatSuccess?: (body: Record<string, unknown>) => string,
  ) {
    setBusy(label)
    setMessage(null)
    setErr(null)
    try {
      const r = await fetch(path, { method: 'POST' })
      const body = (await r.json().catch(() => ({}))) as Record<string, unknown>
      if (!r.ok) {
        const msg = body?.message
        throw new Error(
          typeof msg === 'string' ? msg : Array.isArray(msg) ? msg.join(', ') : `${r.status}`,
        )
      }
      const custom = formatSuccess?.(body)
      if (custom) {
        setMessage(custom)
      } else if (typeof body.path === 'string') {
        setMessage(`OK — ${body.path}`)
      } else {
        setMessage('OK')
      }
      refresh()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(null)
      refreshJobs()
    }
  }

  async function postJson(
    path: string,
    body: Record<string, string>,
    label: string,
    formatSuccess?: (b: Record<string, unknown>) => string,
  ) {
    setBusy(label)
    setMessage(null)
    setErr(null)
    try {
      const r = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const res = (await r.json().catch(() => ({}))) as Record<string, unknown>
      if (!r.ok) {
        const msg = res?.message
        const detail =
          typeof msg === 'string'
            ? msg
            : Array.isArray(msg)
              ? msg.map((x: unknown) => (typeof x === 'object' && x && 'constraints' in x ? JSON.stringify((x as { constraints: unknown }).constraints) : String(x))).join(', ')
              : `${r.status}`
        throw new Error(detail)
      }
      const custom = formatSuccess?.(res)
      if (custom) setMessage(custom)
      else if (typeof res.variantsPath === 'string') {
        setMessage(`OK — ${res.variantsPath}`)
      } else {
        setMessage('OK')
      }
      refresh()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(null)
      refreshJobs()
    }
  }

  async function submitNewVariant(e: FormEvent) {
    e.preventDefault()
    await postJson(
      '/site/deck-landing-variants/register',
      {
        slug: newSlug.trim(),
        ...nv,
      },
      'register-variant',
    )
  }

  return (
    <div className="admin-dl">
      <header className="admin-dl__head">
        <h1 className="admin-dl__title">Admin — landings deck modulaires</h1>
        <nav className="admin-dl__nav">
          <Link to="/">Accueil</Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>

      <p className="admin-dl__hint">
        API <strong>3040</strong>, <code>GROK_API_KEY</code>, <code>GROK_IMAGE_MODEL</code>. Pipeline
        BullMQ : <strong>Redis</strong> (<code>REDIS_URL</code> ou <code>REDIS_HOST</code>) + workers API
        actifs. Jobs rafraîchis toutes les 5 s. Les landings deck s’ouvrent depuis{' '}
        <Link to="/">l’accueil</Link> (cartes).
      </p>

      {err ? <p className="admin-dl__err">{err}</p> : null}
      {message ? <p className="admin-dl__ok">{message}</p> : null}

      <section className="admin-dl__section">
        <h2>Nouvelle variante (slug Arbre de vie)</h2>
        <p className="admin-dl__muted">
          Slug du type <code>arbre-de-vie-e</code>, puis les six sections (hero → CTA). Ensuite : Grok → JSON
          ou pipeline depuis le tableau ci-dessous.
        </p>
        <form className="admin-dl__register" onSubmit={submitNewVariant}>
          <div className="admin-dl__register-row">
            <label htmlFor="nv-slug">Slug</label>
            <input
              id="nv-slug"
              name="slug"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              autoComplete="off"
              placeholder="arbre-de-vie-e"
            />
          </div>
          {NV_SECTION_ORDER.map((key) => (
            <div key={key} className="admin-dl__register-row">
              <label htmlFor={`nv-${key}`}>{NV_LABELS[key]}</label>
              <select
                id={`nv-${key}`}
                value={nv[key]}
                onChange={(e) => setNv((prev) => ({ ...prev, [key]: e.target.value }))}
              >
                {VARIANT_PICKS[key].map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="admin-dl__register-actions">
            <button type="submit" disabled={!!busy}>
              {busy === 'register-variant' ? '…' : 'Enregistrer la variante'}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-dl__section">
        <h2>État des landings</h2>
        {!dashboard ? (
          <p>Chargement…</p>
        ) : slugsSorted.length === 0 ? (
          <p className="admin-dl__muted">Aucun slug dans deck-landing-variants.json.</p>
        ) : (
          <table className="admin-dl__table">
            <thead>
              <tr>
                <th>Slug</th>
                <th>Variantes (hero → …)</th>
                <th>Plan</th>
                <th>JSON landing</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slugsSorted.map((slug) => {
                const v = dashboard.variants[slug]
                const vStr = v
                  ? NV_SECTION_ORDER.map((k) => v[k]).filter(Boolean).join(' · ')
                  : '—'
                const pl = dashboard.plans[slug]
                const ld = dashboard.landings[slug]
                return (
                  <tr key={slug}>
                    <td>
                      <code>{slug}</code>
                    </td>
                    <td className="admin-dl__mono">{vStr}</td>
                    <td>{pl?.exists ? 'oui' : 'non'}</td>
                    <td>
                      {ld?.exists ? `oui (${ld.bytes ?? '?'} o)` : 'non'}
                    </td>
                    <td className="admin-dl__actions">
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() =>
                          post(`/site/generate-deck-landing/${slug}`, `landing-${slug}`)
                        }
                      >
                        Grok → JSON (sync)
                      </button>
                      <button
                        type="button"
                        disabled={!!busy}
                        title="Composition → 4× sections → finalize → images (BullMQ)"
                        onClick={() =>
                          post(
                            `/site/generate-deck-landing-pipeline/${encodeURIComponent(slug)}`,
                            `pipe-${slug}`,
                            (b) =>
                              typeof b.traceId === 'string' && typeof b.jobId === 'string'
                                ? `Pipeline — trace ${b.traceId} job ${b.jobId}`
                                : 'Pipeline démarré',
                          )
                        }
                      >
                        Pipeline BullMQ
                      </button>
                      <button
                        type="button"
                        disabled={!!busy}
                        title="Grok Imagine 16:9 + mise à jour imageUrl dans le JSON"
                        onClick={() =>
                          post(
                            `/site/generate-deck-landing-hero-image/${encodeURIComponent(slug)}`,
                            `hero-${slug}`,
                            (b) => {
                              const url = b.imageUrl
                              const src = b.promptSource
                              return typeof url === 'string'
                                ? `Image hero OK — ${url} (prompt: ${String(src)})`
                                : 'Image hero OK'
                            },
                          )
                        }
                      >
                        Imagine hero
                      </button>
                      <button
                        type="button"
                        disabled={!!busy}
                        title="Specs MD + contexte + A/B → plan + mise à jour variants.json"
                        onClick={() =>
                          post(
                            `/site/generate-deck-landing-variant-plan/${encodeURIComponent(slug)}`,
                            `plan-${slug}`,
                          )
                        }
                      >
                        Plan Grok (variantes)
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="admin-dl__section">
        <h2>Jobs BullMQ (pipeline + images)</h2>
        <p className="admin-dl__muted">
          <button type="button" className="admin-dl__linkish" onClick={() => refreshJobs()}>
            Rafraîchir maintenant
          </button>
        </p>
        {queueJobs.length === 0 ? (
          <p className="admin-dl__muted">Aucun job récent (ou Redis indisponible).</p>
        ) : (
          <div className="admin-dl__jobs-wrap">
            <table className="admin-dl__table admin-dl__jobs">
              <thead>
                <tr>
                  <th>État</th>
                  <th>File</th>
                  <th>Nom</th>
                  <th>id</th>
                  <th>Données / erreur</th>
                </tr>
              </thead>
              <tbody>
                {queueJobs.map((j) => (
                  <tr key={`${j.queue}-${j.id}`}>
                    <td>
                      <span className={`admin-dl__state admin-dl__state--${j.state}`}>{j.state}</span>
                    </td>
                    <td className="admin-dl__mono">{j.queue}</td>
                    <td>{j.name}</td>
                    <td className="admin-dl__mono">{j.id}</td>
                    <td className="admin-dl__job-detail">
                      {j.state === 'failed' && j.failedReason ? (
                        <span className="admin-dl__err-inline">{j.failedReason}</span>
                      ) : null}
                      {j.returnvalue != null ? (
                        <pre className="admin-dl__pre admin-dl__pre--tiny">
                          {JSON.stringify(j.returnvalue).slice(0, 400)}
                        </pre>
                      ) : null}
                      {j.data != null && j.state !== 'completed' ? (
                        <pre className="admin-dl__pre admin-dl__pre--tiny">
                          {JSON.stringify(j.data).slice(0, 320)}
                        </pre>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-dl__section">
        <h2>Plans Grok (specs MD + contexte deck)</h2>
        <p className="admin-dl__muted">
          Fichiers sous <code>deck-landing-plans/</code> ; mise à jour de{' '}
          <code>deck-landing-variants.json</code>. Génération : bouton « Plan Grok » par slug ci-dessus.
        </p>
        {planViewSlug ? (
          <p>
            <label htmlFor="plan-slug" className="admin-dl__muted">
              Consulter le plan pour{' '}
            </label>
            <select
              id="plan-slug"
              value={planViewSlug}
              onChange={(e) => setPlanViewSlug(e.target.value)}
            >
              {slugsSorted.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </p>
        ) : null}

        {planErr && !planDoc ? <p className="admin-dl__muted">{planErr}</p> : null}
        {planDoc ? (
          <div className="admin-dl__plan">
            <h3>Rationale — {planDoc.slug}</h3>
            <Markdown text={planDoc.rationaleMarkdown} />
            <h3>Variantes retenues</h3>
            <pre className="admin-dl__pre">{JSON.stringify(planDoc.variants, null, 2)}</pre>
          </div>
        ) : null}
      </section>
    </div>
  )
}
