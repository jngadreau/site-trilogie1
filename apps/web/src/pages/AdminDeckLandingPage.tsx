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

export function AdminDeckLandingPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [planC, setPlanC] = useState<PlanDoc | null>(null)
  const [planErr, setPlanErr] = useState<string | null>(null)

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

  useEffect(() => {
    refresh()
  }, [refresh])

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

  async function post(path: string, label: string) {
    setBusy(label)
    setMessage(null)
    setErr(null)
    try {
      const r = await fetch(path, { method: 'POST' })
      const body = await r.json().catch(() => ({}))
      if (!r.ok) {
        throw new Error(body?.message || `${r.status}`)
      }
      setMessage(typeof body?.path === 'string' ? `OK — ${body.path}` : 'OK')
      refresh()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(null)
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
        Nécessite l’API sur le port <strong>3040</strong> et <code>GROK_API_KEY</code> pour les boutons
        Grok.
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
                        Grok → JSON
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
