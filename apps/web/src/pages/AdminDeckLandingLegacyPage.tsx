import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  DECK_SECTION_ORDER,
  SECTION_LABELS_FR,
  SECTION_ROLE_HINTS_FR,
  VARIANTS_BY_SECTION,
  type DeckSectionKey,
} from '../lib/deckSectionCatalog'
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

function defaultNv(): Record<DeckSectionKey, string> {
  return Object.fromEntries(
    DECK_SECTION_ORDER.map((k) => [k, VARIANTS_BY_SECTION[k][0]]),
  ) as Record<DeckSectionKey, string>
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

type SuggestCatalogResult = {
  variants: Record<string, string>
  rationaleMarkdown: string
  model: string
}

type ImageStudioVersion = {
  id: string
  imageUrl: string
  prompt: string
  model?: string
  createdAt: string
}

type ImageStudioState = {
  slug: string
  positions: Array<{
    positionKey: string
    label: string
    currentImageUrl: string | null
    promptInJson: string | null
    versions: ImageStudioVersion[]
  }>
}

export function AdminDeckLandingLegacyPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [planViewSlug, setPlanViewSlug] = useState<string>('')
  const [planDoc, setPlanDoc] = useState<PlanDoc | null>(null)
  const [planErr, setPlanErr] = useState<string | null>(null)
  const [queueJobs, setQueueJobs] = useState<QueueJobRow[]>([])

  const [suggestSlug, setSuggestSlug] = useState('')
  const [suggestBrief, setSuggestBrief] = useState('')
  const [suggestResult, setSuggestResult] = useState<SuggestCatalogResult | null>(null)

  const [workSlug, setWorkSlug] = useState('')
  const [imageStudio, setImageStudio] = useState<ImageStudioState | null>(null)
  const [heroPromptDraft, setHeroPromptDraft] = useState('')

  const [newSlug, setNewSlug] = useState('arbre-de-vie-')
  const [nv, setNv] = useState<Record<DeckSectionKey, string>>(defaultNv)
  const [editSlug, setEditSlug] = useState('')
  const [editNv, setEditNv] = useState<Record<DeckSectionKey, string>>(defaultNv)

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
    setWorkSlug((prev) => (prev && slugs.includes(prev) ? prev : slugs[0] ?? ''))
    setSuggestSlug((prev) => (prev && slugs.includes(prev) ? prev : slugs[0] ?? ''))
  }, [dashboard])

  const refreshImageStudio = useCallback(() => {
    if (!workSlug.trim()) {
      setImageStudio(null)
      return
    }
    fetch(`/site/deck-landing/${encodeURIComponent(workSlug.trim())}/image-studio`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((d: ImageStudioState) => {
        setImageStudio(d)
        const heroPos = d.positions?.find((p: ImageStudioState['positions'][number]) => p.positionKey === 'hero:hero')
        const p = heroPos?.promptInJson
        if (typeof p === 'string') setHeroPromptDraft(p)
      })
      .catch(() => setImageStudio(null))
  }, [workSlug])

  useEffect(() => {
    refreshImageStudio()
  }, [refreshImageStudio])

  useEffect(() => {
    if (!dashboard?.variants || !editSlug) return
    const row = dashboard.variants[editSlug]
    if (!row) return
    const next = defaultNv()
    for (const k of DECK_SECTION_ORDER) {
      if (row[k]) next[k] = row[k]
    }
    setEditNv(next)
  }, [dashboard, editSlug])

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

  async function runSuggestCatalog() {
    if (!suggestSlug.trim()) {
      setErr('Choisis un slug pour la suggestion.')
      return
    }
    setBusy('suggest-catalog')
    setMessage(null)
    setErr(null)
    setSuggestResult(null)
    try {
      const r = await fetch(
        `/site/suggest-deck-landing-variants/${encodeURIComponent(suggestSlug.trim())}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief: suggestBrief.trim() || undefined }),
        },
      )
      const body = (await r.json().catch(() => ({}))) as Record<string, unknown>
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      setSuggestResult({
        variants: (body.variants as Record<string, string>) ?? {},
        rationaleMarkdown: String(body.rationaleMarkdown ?? ''),
        model: String(body.model ?? ''),
      })
      setMessage(`Suggestion Grok OK — modèle ${String(body.model ?? '')}`)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function applySuggestCatalog() {
    if (!suggestResult?.variants || !suggestSlug.trim()) return
    const payload: Record<string, string> = { slug: suggestSlug.trim() }
    for (const k of DECK_SECTION_ORDER) {
      const v = suggestResult.variants[k]
      if (v) payload[k] = v
    }
    await postJson(
      '/site/deck-landing-variants/update',
      payload,
      'apply-suggest',
      () => `Variantes catalogue appliquées — ${suggestSlug}`,
    )
    setSuggestResult(null)
  }

  async function runElementsPipeline() {
    if (!workSlug.trim()) return
    await post(
      `/site/generate-deck-landing-section-elements-pipeline/${encodeURIComponent(workSlug.trim())}`,
      `elements-${workSlug}`,
      (b) =>
        typeof b.traceId === 'string'
          ? `Pipeline éléments — trace ${b.traceId} (${String(b.sectionsEnqueued ?? '')} sections)`
          : 'Pipeline éléments démarré',
    )
  }

  async function runHeroImagine(useDraftPrompt: boolean) {
    if (!workSlug.trim()) return
    setBusy('hero-studio')
    setMessage(null)
    setErr(null)
    try {
      const r = await fetch(
        `/site/generate-deck-landing-hero-image/${encodeURIComponent(workSlug.trim())}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            useDraftPrompt && heroPromptDraft.trim() ? { prompt: heroPromptDraft.trim() } : {},
          ),
        },
      )
      const body = (await r.json().catch(() => ({}))) as Record<string, unknown>
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      setMessage(`Imagine hero OK — ${String(body.imageUrl ?? '')}`)
      refresh()
      refreshImageStudio()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(null)
      refreshJobs()
    }
  }

  async function runAlternateHeroPrompt() {
    if (!workSlug.trim()) return
    setBusy('hero-alt-prompt')
    setErr(null)
    try {
      const r = await fetch(
        `/site/deck-landing/${encodeURIComponent(workSlug.trim())}/hero-image/alternate-prompt`,
        { method: 'POST' },
      )
      const body = (await r.json().catch(() => ({}))) as Record<string, unknown>
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      const alt = body.suggestedPrompt
      if (typeof alt === 'string') setHeroPromptDraft(alt)
      setMessage('Prompt alternatif proposé par Grok (modifiable avant Imagine).')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function selectHistoryVersion(positionKey: string, versionId: string) {
    if (!workSlug.trim()) return
    setBusy('select-history')
    setErr(null)
    try {
      const r = await fetch(
        `/site/deck-landing/${encodeURIComponent(workSlug.trim())}/image-history/select`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ positionKey, versionId }),
        },
      )
      const body = (await r.json().catch(() => ({}))) as Record<string, unknown>
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      setMessage('Version réactivée dans le JSON.')
      refresh()
      refreshImageStudio()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(null)
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

  async function submitUpdateVariants(e: FormEvent) {
    e.preventDefault()
    if (!editSlug.trim()) {
      setErr('Choisis un slug existant.')
      return
    }
    await postJson(
      '/site/deck-landing-variants/update',
      {
        slug: editSlug.trim(),
        ...editNv,
      },
      'update-variants',
      () => `Variantes mises à jour — ${editSlug}`,
    )
  }

  return (
    <div className="admin-dl">
      <header className="admin-dl__head">
        <h1 className="admin-dl__title">Legacy — landings deck (fichiers JSON)</h1>
        <nav className="admin-dl__nav">
          <Link to="/">Accueil</Link>
          <Link to="/demo/sections">Démos sections</Link>
          <Link to="/admin">Admin général</Link>
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
        <h2>Images cartes (miroir)</h2>
        <p className="admin-dl__muted">
          Copie les PNG/JPEG/WebP de <code>images-jeux/arbre_de_vie</code> vers le dossier{' '}
          <code>images/deck-cards</code> à côté des fichiers Grok. Les héros{' '}
          <code>HeroCardsFan</code> / <code>Strip</code> / <code>Mosaic</code> utilisent les URLs{' '}
          <code>/ai/generated-images/deck-cards/&lt;fichier&gt;</code>.
        </p>
        <button
          type="button"
          disabled={!!busy}
          onClick={() =>
            post(
              '/site/sync-deck-card-images',
              'sync-deck-cards',
              (b) =>
                typeof b.copied === 'number'
                  ? `Miroir OK — ${b.copied} copié(s), ${Number(b.skipped) || 0} ignoré(s)`
                  : 'OK',
            )
          }
        >
          {busy === 'sync-deck-cards' ? '…' : 'Synchroniser les images cartes'}
        </button>
      </section>

      <section className="admin-dl__section">
        <h2>Suggestion Grok (catalogue des sections)</h2>
        <p className="admin-dl__muted">
          Grok lit le **rôle** de chaque type de section (voir le catalogue ci-dessous) + le contexte deck, puis propose une combinaison de
          variantes React. Tu peux ensuite enregistrer avec « Appliquer » et enchaîner avec **Plan Grok**, **Pipeline** ou **Grok → JSON** comme
          d’habitude.
        </p>
        <details className="admin-dl__details">
          <summary>Catalogue — description courte par type de section</summary>
          <ul className="admin-dl__catalog">
            {DECK_SECTION_ORDER.map((key) => (
              <li key={key}>
                <strong>{SECTION_LABELS_FR[key]}</strong> (<code>{key}</code>) — {SECTION_ROLE_HINTS_FR[key]}
              </li>
            ))}
          </ul>
        </details>
        {!dashboard || slugsSorted.length === 0 ? (
          <p className="admin-dl__muted">Aucun slug.</p>
        ) : (
          <div className="admin-dl__suggest">
            <div className="admin-dl__register-row">
              <label htmlFor="suggest-slug">Slug</label>
              <select
                id="suggest-slug"
                value={suggestSlug}
                onChange={(e) => setSuggestSlug(e.target.value)}
              >
                {slugsSorted.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-dl__register-row admin-dl__register-row--stack">
              <label htmlFor="suggest-brief">Brief éditeur (optionnel)</label>
              <textarea
                id="suggest-brief"
                rows={3}
                value={suggestBrief}
                onChange={(e) => setSuggestBrief(e.target.value)}
                placeholder="Ex. ton plus méditatif, public débutant, mettre l’accent sur la trilogie…"
              />
            </div>
            <div className="admin-dl__register-actions">
              <button type="button" disabled={!!busy} onClick={() => runSuggestCatalog()}>
                {busy === 'suggest-catalog' ? '…' : 'Demander les variantes à Grok'}
              </button>
              <button
                type="button"
                disabled={!!busy || !suggestResult}
                onClick={() => applySuggestCatalog()}
              >
                {busy === 'apply-suggest' ? '…' : 'Appliquer à deck-landing-variants.json'}
              </button>
            </div>
            {suggestResult ? (
              <div className="admin-dl__suggest-out">
                <h3 className="admin-dl__h3">Rationale</h3>
                <Markdown text={suggestResult.rationaleMarkdown} />
                <h3 className="admin-dl__h3">Variantes proposées</h3>
                <pre className="admin-dl__pre admin-dl__pre--small">
                  {JSON.stringify(suggestResult.variants, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="admin-dl__section">
        <h2>Landing de travail — pipeline éléments & studio image hero</h2>
        <p className="admin-dl__muted">
          Choisis une landing : régénère **uniquement** le contenu des sections (sans nouvelle composition Grok des globals) puis gère la bannière
          hero (prompt visible, historique des PNG, sélection d’une version).
        </p>
        {!dashboard || slugsSorted.length === 0 ? (
          <p className="admin-dl__muted">Aucun slug.</p>
        ) : (
          <div className="admin-dl__work">
            <div className="admin-dl__register-row">
              <label htmlFor="work-slug">Slug focal</label>
              <select id="work-slug" value={workSlug} onChange={(e) => setWorkSlug(e.target.value)}>
                {slugsSorted.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-dl__register-actions">
              <button
                type="button"
                disabled={!!busy || !workSlug}
                title="Section elements → finalize → Imagine (sans job composition)"
                onClick={() => runElementsPipeline()}
              >
                {busy === `elements-${workSlug}` ? '…' : 'Pipeline : éléments seulement'}
              </button>
            </div>
            <div className="admin-dl__studio">
              <h3 className="admin-dl__h3">Studio bannière hero</h3>
              <p className="admin-dl__muted">
                Prompt envoyé à Imagine (anglais). Laisse vide pour le comportement API par défaut (slot média, JSON ou synthèse Grok).
              </p>
              <textarea
                className="admin-dl__prompt"
                rows={5}
                value={heroPromptDraft}
                onChange={(e) => setHeroPromptDraft(e.target.value)}
                spellCheck={false}
              />
              <div className="admin-dl__register-actions admin-dl__register-actions--wrap">
                <button
                  type="button"
                  disabled={!!busy || !workSlug}
                  onClick={() => runHeroImagine(false)}
                >
                  {busy === 'hero-studio' ? '…' : 'Imagine (prompt auto / JSON)'}
                </button>
                <button
                  type="button"
                  disabled={!!busy || !workSlug}
                  onClick={() => runHeroImagine(true)}
                >
                  Imagine avec le texte ci-dessus
                </button>
                <button
                  type="button"
                  disabled={!!busy || !workSlug}
                  onClick={() => runAlternateHeroPrompt()}
                >
                  {busy === 'hero-alt-prompt' ? '…' : 'Grok : prompt alternatif'}
                </button>
              </div>
              {imageStudio?.positions?.length ? (
                <div className="admin-dl__history">
                  {imageStudio.positions.map((pos: ImageStudioState['positions'][number]) => (
                    <div key={pos.positionKey}>
                      <p className="admin-dl__muted">
                        <strong>{pos.label}</strong> — <code>{pos.positionKey}</code>
                        {pos.currentImageUrl ? (
                          <>
                            {' '}
                            · actuel :{' '}
                            <a href={pos.currentImageUrl} target="_blank" rel="noreferrer">
                              voir
                            </a>
                          </>
                        ) : null}
                      </p>
                      {pos.versions.length === 0 ? (
                        <p className="admin-dl__muted">Aucune version en historique encore.</p>
                      ) : (
                        <ul className="admin-dl__history-grid">
                          {pos.versions.map((v: ImageStudioVersion) => {
                            const isCurrent = v.imageUrl === pos.currentImageUrl
                            return (
                              <li key={v.id} className="admin-dl__history-card">
                                <a href={v.imageUrl} target="_blank" rel="noreferrer" className="admin-dl__history-thumb-wrap">
                                  <img src={v.imageUrl} alt="" className="admin-dl__history-thumb" />
                                </a>
                                <p className="admin-dl__history-meta">
                                  {new Date(v.createdAt).toLocaleString()}
                                  {v.model ? ` · ${v.model}` : ''}
                                  {isCurrent ? (
                                    <>
                                      {' '}
                                      · <span className="admin-dl__pill">affiché</span>
                                    </>
                                  ) : null}
                                </p>
                                {v.prompt ? (
                                  <pre className="admin-dl__pre admin-dl__pre--tiny">{v.prompt}</pre>
                                ) : null}
                                <button
                                  type="button"
                                  className="admin-dl__history-select"
                                  disabled={!!busy || isCurrent}
                                  onClick={() => selectHistoryVersion(pos.positionKey, v.id)}
                                >
                                  {busy === 'select-history' ? '…' : 'Utiliser cette version'}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : workSlug ? (
                <p className="admin-dl__muted">Chargement du studio…</p>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <section className="admin-dl__section">
        <h2>Nouvelle variante (slug Arbre de vie)</h2>
        <p className="admin-dl__muted">
          Slug du type <code>arbre-de-vie-e</code>, puis les quatorze sections (hero → … → témoignages → newsletter → CTA). Ensuite : Grok → JSON
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
          {DECK_SECTION_ORDER.map((key) => (
            <div key={key} className="admin-dl__register-row">
              <label htmlFor={`nv-${key}`}>{SECTION_LABELS_FR[key]}</label>
              <select
                id={`nv-${key}`}
                value={nv[key]}
                onChange={(e) => setNv((prev) => ({ ...prev, [key]: e.target.value }))}
              >
                {VARIANTS_BY_SECTION[key].map((x) => (
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
        <h2>Modifier les variantes d’un slug existant</h2>
        <p className="admin-dl__muted">
          Met à jour <code>deck-landing-variants.json</code> pour le slug choisi. Le JSON de landing
          existant n’est pas régénéré : relance <strong>Grok → JSON</strong> ou le pipeline si tu veux
          du contenu aligné sur les nouveaux composants.
        </p>
        {!dashboard || slugsSorted.length === 0 ? (
          <p className="admin-dl__muted">Aucun slug à éditer.</p>
        ) : (
          <form className="admin-dl__register" onSubmit={submitUpdateVariants}>
            <div className="admin-dl__register-row">
              <label htmlFor="edit-slug">Slug</label>
              <select
                id="edit-slug"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
              >
                <option value="">— Choisir —</option>
                {slugsSorted.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {DECK_SECTION_ORDER.map((key) => (
              <div key={key} className="admin-dl__register-row">
                <label htmlFor={`edit-${key}`}>{SECTION_LABELS_FR[key]}</label>
                <select
                  id={`edit-${key}`}
                  value={editNv[key]}
                  disabled={!editSlug}
                  onChange={(e) => setEditNv((prev) => ({ ...prev, [key]: e.target.value }))}
                >
                  {VARIANTS_BY_SECTION[key].map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <div className="admin-dl__register-actions">
              <button type="submit" disabled={!!busy || !editSlug}>
                {busy === 'update-variants' ? '…' : 'Enregistrer les variantes'}
              </button>
            </div>
          </form>
        )}
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
                  ? DECK_SECTION_ORDER.map((k) => v[k]).filter(Boolean).join(' · ')
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
