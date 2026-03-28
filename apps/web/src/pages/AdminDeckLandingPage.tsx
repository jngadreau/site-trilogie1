import { useCallback, useEffect, useState } from 'react'
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

const SLUGS = ['arbre-de-vie-a', 'arbre-de-vie-b', 'arbre-de-vie-c'] as const

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
  const [planC, setPlanC] = useState<PlanDoc | null>(null)
  const [planErr, setPlanErr] = useState<string | null>(null)
  const [queueJobs, setQueueJobs] = useState<QueueJobRow[]>([])

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

  useEffect(() => {
    fetch('/site/deck-landing-variant-plan/arbre-de-vie-c')
      .then((r) => {
        if (!r.ok) {
          setPlanC(null)
          setPlanErr(r.status === 404 ? 'Pas encore de plan pour C.' : `${r.status}`)
          return null
        }
        return r.json()
      })
      .then((p: PlanDoc | null) => {
        if (p) {
          setPlanC(p)
          setPlanErr(null)
        }
      })
      .catch(() => setPlanErr('Erreur chargement plan'))
  }, [dashboard])

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

  return (
    <div className="admin-dl">
      <header className="admin-dl__head">
        <h1 className="admin-dl__title">Admin — landings deck modulaires</h1>
        <nav className="admin-dl__nav">
          <a href="/">Accueil</a>
          <a href="/deck/arbre-de-vie-a">A</a>
          <a href="/deck/arbre-de-vie-b">B</a>
          <a href="/deck/arbre-de-vie-c">C</a>
        </nav>
      </header>

      <p className="admin-dl__hint">
        API <strong>3040</strong>, <code>GROK_API_KEY</code>, <code>GROK_IMAGE_MODEL</code>. Pipeline
        BullMQ : <strong>Redis</strong> (<code>REDIS_URL</code> ou <code>REDIS_HOST</code>) + workers API
        actifs. Jobs rafraîchis toutes les 5 s.
      </p>

      {err ? <p className="admin-dl__err">{err}</p> : null}
      {message ? <p className="admin-dl__ok">{message}</p> : null}

      <section className="admin-dl__section">
        <h2>État des landings</h2>
        {!dashboard ? (
          <p>Chargement…</p>
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
              {SLUGS.map((slug) => {
                const v = dashboard.variants[slug]
                const vStr = v
                  ? `${v.hero} · ${v.deck_identity} · ${v.for_who} · ${v.how_to_use}`
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
                      <a href={`/deck/${slug}`}>Prévisualiser</a>
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
        <h2>Variante C — plan (Grok + specs MD)</h2>
        <p>
          Lit les 8 fichiers <code>*.spec.md</code> sous <code>apps/web/src/sections/</code>, le
          contexte deck, et les combinaisons A/B ; écrit{' '}
          <code>deck-landing-plans/arbre-de-vie-c.json</code> et met à jour{' '}
          <code>deck-landing-variants.json</code>.
        </p>
        <button
          type="button"
          disabled={!!busy}
          onClick={() =>
            post(
              '/site/generate-deck-landing-variant-plan/arbre-de-vie-c',
              'plan-c',
            )
          }
        >
          {busy === 'plan-c' ? '…' : 'Générer / mettre à jour le plan C'}
        </button>

        {planErr && !planC ? <p className="admin-dl__muted">{planErr}</p> : null}
        {planC ? (
          <div className="admin-dl__plan">
            <h3>Rationale</h3>
            <Markdown text={planC.rationaleMarkdown} />
            <h3>Variantes retenues</h3>
            <pre className="admin-dl__pre">{JSON.stringify(planC.variants, null, 2)}</pre>
          </div>
        ) : null}
      </section>
    </div>
  )
}
