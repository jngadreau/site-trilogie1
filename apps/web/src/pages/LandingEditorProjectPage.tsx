import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  DECK_SECTION_ORDER,
  SECTION_LABELS_FR,
  VARIANTS_BY_SECTION,
  type DeckSectionKey,
} from '../lib/deckSectionCatalog'
import { Markdown } from '../lib/Markdown'
import { ImageSlotRowBlock, collectImageSlotRows } from './landing-editor/ImageSlotRowBlock'
import './landing-editor.css'

type ProjectDoc = {
  _id: string
  gameKey: string
  slug: string
  title?: string
  description?: string
  sectionDescriptions?: Record<string, string>
  currentDraftVersionId?: string
  publishedVersionId?: string
}

type VersionRow = {
  _id: string
  versionNumber: number
  status: string
  label?: string
  sectionOrder?: string[]
  variantsBySection?: Record<string, string>
  content?: Record<string, unknown>
  buildOptions?: Record<string, unknown>
  createdAt?: string
}

type SuggestStructureResult = {
  sectionOrder: string[]
  variantsBySection: Record<string, string>
  rationaleMarkdown: string
  model: string
}

const EMPTY_LANDING_STUB = (slug: string) => ({
  version: 1,
  slug,
  globals: {
    accent: '#2d5a4a',
    background: '#f6f3ef',
    surface: '#ffffff',
    text: '#1a1a1a',
    textMuted: '#5c5c5c',
    fontHeading: 'Georgia, serif',
    fontBody: 'system-ui, sans-serif',
    radius: '12px',
  },
  sections: [] as unknown[],
})

export function LandingEditorProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<ProjectDoc | null>(null)
  const [versions, setVersions] = useState<VersionRow[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [versionDetail, setVersionDetail] = useState<VersionRow | null>(null)

  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [structureMode, setStructureMode] = useState<'auto' | 'manual'>('auto')
  const [brief, setBrief] = useState('')
  const [suggestResult, setSuggestResult] = useState<SuggestStructureResult | null>(null)

  const [populateBrief, setPopulateBrief] = useState('')
  /** Un seul prochain appel populate : n’envoie pas `skipAutoImagine` si false. */
  const [skipAutoImagineOnce, setSkipAutoImagineOnce] = useState(false)

  const [storageStatus, setStorageStatus] = useState<{ storageReady: boolean } | null>(null)
  /** `sectionId:slotId` pendant upload S3 + PATCH slot */
  const [slotUploadingKey, setSlotUploadingKey] = useState<string | null>(null)

  const [manualSelected, setManualSelected] = useState<Record<string, boolean>>({})
  const [manualVariants, setManualVariants] = useState<Record<string, string>>({})

  const imageSlotRows = useMemo(() => {
    const c = versionDetail?.content
    if (!c || typeof c !== 'object') return []
    return collectImageSlotRows(c as Record<string, unknown>)
  }, [versionDetail?.content])

  const visualBriefFromContent = useMemo(() => {
    const c = versionDetail?.content
    if (!c || typeof c !== 'object') return ''
    const g = (c as Record<string, unknown>).globals
    if (!g || typeof g !== 'object') return ''
    const vb = (g as Record<string, unknown>).visualBrief
    return typeof vb === 'string' ? vb : ''
  }, [versionDetail?.content])

  const [visualBriefDraft, setVisualBriefDraft] = useState('')
  useEffect(() => {
    setVisualBriefDraft(visualBriefFromContent)
  }, [visualBriefFromContent])

  const pageBgUrlFromContent = useMemo(() => {
    const c = versionDetail?.content
    if (!c || typeof c !== 'object') return ''
    const g = (c as Record<string, unknown>).globals
    if (!g || typeof g !== 'object') return ''
    const bg = (g as Record<string, unknown>).backgroundImage
    if (!bg || typeof bg !== 'object') return ''
    const u = (bg as Record<string, unknown>).imageUrl
    return typeof u === 'string' ? u : ''
  }, [versionDetail?.content])

  const pageBgAltFromContent = useMemo(() => {
    const c = versionDetail?.content
    if (!c || typeof c !== 'object') return ''
    const g = (c as Record<string, unknown>).globals
    if (!g || typeof g !== 'object') return ''
    const bg = (g as Record<string, unknown>).backgroundImage
    if (!bg || typeof bg !== 'object') return ''
    const a = (bg as Record<string, unknown>).imageAlt
    return typeof a === 'string' ? a : ''
  }, [versionDetail?.content])

  const [pageBgUrlDraft, setPageBgUrlDraft] = useState('')
  const [pageBgAltDraft, setPageBgAltDraft] = useState('')
  useEffect(() => {
    setPageBgUrlDraft(pageBgUrlFromContent)
    setPageBgAltDraft(pageBgAltFromContent)
  }, [pageBgUrlFromContent, pageBgAltFromContent])

  const load = useCallback(() => {
    if (!projectId) return
    setErr(null)
    Promise.all([
      fetch(`/site/landing-storage/projects/${encodeURIComponent(projectId)}`).then((r) => {
        if (!r.ok) throw new Error(`projet ${r.status}`)
        return r.json()
      }),
      fetch(`/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions`).then((r) => {
        if (!r.ok) throw new Error(`versions ${r.status}`)
        return r.json()
      }),
    ])
      .then(([p, v]) => {
        setProject(p as ProjectDoc)
        setVersions(Array.isArray(v) ? v : [])
      })
      .catch(() => setErr('Chargement impossible.'))
  }, [projectId])

  const loadVersionDetail = useCallback(
    (vid: string) => {
      fetch(`/site/landing-storage/versions/${encodeURIComponent(vid)}`)
        .then((r) => {
          if (!r.ok) throw new Error(`${r.status}`)
          return r.json()
        })
        .then((row: VersionRow) => {
          setVersionDetail(row)
          const order = row.sectionOrder ?? []
          const variants = row.variantsBySection ?? {}
          const sel: Record<string, boolean> = {}
          for (const id of order) sel[id] = true
          setManualSelected(sel)
          setManualVariants({ ...variants })
          setSuggestResult(null)
        })
        .catch(() => setErr('Version introuvable.'))
    },
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    fetch('/site/landing-storage/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && typeof j === 'object' && 'storageReady' in j) {
          setStorageStatus({ storageReady: Boolean((j as { storageReady?: boolean }).storageReady) })
        }
      })
      .catch(() => setStorageStatus(null))
  }, [])

  useEffect(() => {
    if (selectedVersionId) loadVersionDetail(selectedVersionId)
    else setVersionDetail(null)
  }, [selectedVersionId, loadVersionDetail])

  async function addDraftVersion() {
    if (!projectId || !project) return
    setBusy(true)
    setMessage(null)
    setErr(null)
    try {
      const r = await fetch(`/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'draft',
          label: 'Brouillon initial',
          sectionOrder: [],
          variantsBySection: {},
          content: EMPTY_LANDING_STUB(project.slug),
        }),
      })
      const body = (await r.json().catch(() => ({}))) as Record<string, unknown>
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      setMessage(`Version ${String(body.versionNumber ?? '')} créée.`)
      const newId = typeof body._id === 'string' ? body._id : null
      await load()
      if (newId) setSelectedVersionId(newId)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function patchVersion(body: Record<string, unknown>) {
    if (!projectId || !selectedVersionId) return
    setBusy(true)
    setMessage(null)
    setErr(null)
    try {
      const r = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(selectedVersionId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      )
      const res = (await r.json().catch(() => ({}))) as Record<string, unknown>
      if (!r.ok) {
        const msg = res?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      setMessage('Structure enregistrée (Mongo + squelette sections).')
      load()
      loadVersionDetail(selectedVersionId)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function runSuggestStructure() {
    if (!projectId || !selectedVersionId) return
    setBusy(true)
    setErr(null)
    setSuggestResult(null)
    try {
      const r = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(selectedVersionId)}/suggest-structure`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief: brief.trim() || undefined }),
        },
      )
      const body = (await r.json().catch(() => ({}))) as Record<string, unknown>
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      setSuggestResult(body as unknown as SuggestStructureResult)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function applySuggestToVersion() {
    if (!suggestResult) return
    void patchVersion({
      sectionOrder: suggestResult.sectionOrder,
      variantsBySection: suggestResult.variantsBySection,
      rebuildContentSections: true,
    })
  }

  function toggleManualSection(id: DeckSectionKey, on: boolean) {
    setManualSelected((prev) => ({ ...prev, [id]: on }))
    setManualVariants((prev) => {
      if (!on) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      if (prev[id]) return prev
      const first = VARIANTS_BY_SECTION[id][0]
      return { ...prev, [id]: first }
    })
  }

  function setManualVariant(id: DeckSectionKey, variant: string) {
    setManualVariants((prev) => ({ ...prev, [id]: variant }))
  }

  async function runGenerateAllImagineS3() {
    if (!projectId || !selectedVersionId) return
    setBusy(true)
    setErr(null)
    setMessage(null)
    try {
      const r = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(selectedVersionId)}/generate-all-imagine-s3`,
        { method: 'POST' },
      )
      const body = (await r.json().catch(() => ({}))) as {
        generated?: unknown[]
        skipped?: { sectionId: string; slotId: string; reason: string }[]
      }
      if (!r.ok) {
        const msg = (body as Record<string, unknown>)?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      const n = Array.isArray(body.generated) ? body.generated.length : 0
      const sk = Array.isArray(body.skipped) ? body.skipped.length : 0
      setMessage(
        `Imagine → S3 : ${n} image(s) générée(s)${sk > 0 ? `, ${sk} slot(s) ignorée(s) ou en échec (voir réponse API).` : '.'}`,
      )
      load()
      loadVersionDetail(selectedVersionId)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function runHydrateImageUrlsS3() {
    if (!projectId || !selectedVersionId) return
    setBusy(true)
    setErr(null)
    setMessage(null)
    try {
      const r = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(selectedVersionId)}/hydrate-image-urls-s3`,
        { method: 'POST' },
      )
      const body = (await r.json().catch(() => ({}))) as {
        replaced?: unknown[]
        skipped?: unknown[]
      }
      if (!r.ok) {
        const msg = (body as Record<string, unknown>)?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      const n = Array.isArray(body.replaced) ? body.replaced.length : 0
      const sk = Array.isArray(body.skipped) ? body.skipped.length : 0
      setMessage(
        `Hydratation S3 : ${n} URL remplacée(s) dans le JSON${sk > 0 ? `, ${sk} ignorée(s).` : '.'}`,
      )
      load()
      loadVersionDetail(selectedVersionId)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function runPopulateContent() {
    if (!projectId || !selectedVersionId) return
    setBusy(true)
    setErr(null)
    setMessage(null)
    try {
      const r = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(selectedVersionId)}/populate-content`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brief: populateBrief.trim() || undefined,
            ...(skipAutoImagineOnce ? { skipAutoImagine: true } : {}),
          }),
        },
      )
      const body = (await r.json().catch(() => ({}))) as Record<string, unknown> & {
        autoImagine?: { generated?: number; skipped?: number }
      }
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      const ai = body.autoImagine
      const aiLine =
        ai && typeof ai.generated === 'number'
          ? ` — Imagine auto (S3) : ${ai.generated} générée(s), ${typeof ai.skipped === 'number' ? ai.skipped : '?'} ignorée(s).`
          : ''
      setMessage(
        `Contenu généré — ${String(body.sectionCount ?? '?')} sections (modèle ${String(body.model ?? '')}).${aiLine}`,
      )
      setSkipAutoImagineOnce(false)
      load()
      loadVersionDetail(selectedVersionId)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function saveVisualBrief() {
    if (!projectId || !selectedVersionId) return
    setBusy(true)
    setErr(null)
    setMessage(null)
    try {
      const r = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(selectedVersionId)}/content-globals`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visualBrief: visualBriefDraft.trim() || '' }),
        },
      )
      const body = (await r.json().catch(() => ({}))) as { message?: string }
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      setMessage('Brief visuel enregistré dans content.globals.')
      load()
      loadVersionDetail(selectedVersionId)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function savePageBackground() {
    if (!projectId || !selectedVersionId) return
    setBusy(true)
    setErr(null)
    setMessage(null)
    try {
      const url = pageBgUrlDraft.trim()
      const body: Record<string, unknown> = url
        ? {
            backgroundImage: {
              imageUrl: url,
              ...(pageBgAltDraft.trim() ? { imageAlt: pageBgAltDraft.trim() } : {}),
            },
          }
        : { clearBackgroundImage: true }
      const r = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(selectedVersionId)}/content-globals`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      )
      const res = (await r.json().catch(() => ({}))) as { message?: string }
      if (!r.ok) {
        const msg = res?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      setMessage(url ? 'Fond de page enregistré (globals.backgroundImage).' : 'Fond de page retiré.')
      load()
      loadVersionDetail(selectedVersionId)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function uploadAndAssignSlot(sectionId: string, slotId: string, file: File) {
    if (!projectId || !selectedVersionId) return
    const key = `${sectionId}:${slotId}`
    setSlotUploadingKey(key)
    setErr(null)
    setMessage(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const up = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(selectedVersionId)}/assets`,
        { method: 'POST', body: fd },
      )
      const upBody = (await up.json().catch(() => ({}))) as { publicUrl?: string; message?: string }
      if (!up.ok) {
        const msg = upBody?.message
        throw new Error(typeof msg === 'string' ? msg : `upload ${up.status}`)
      }
      const publicUrl = typeof upBody.publicUrl === 'string' ? upBody.publicUrl : ''
      if (!publicUrl) {
        throw new Error('Réponse upload sans publicUrl')
      }
      const patch = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(selectedVersionId)}/image-slot`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId,
            slotId,
            resolved: { imageUrl: publicUrl, source: 'upload' },
          }),
        },
      )
      const patchBody = (await patch.json().catch(() => ({}))) as { message?: string }
      if (!patch.ok) {
        const msg = patchBody?.message
        throw new Error(typeof msg === 'string' ? msg : `patch ${patch.status}`)
      }
      setMessage(`Image liée — ${sectionId} / ${slotId}`)
      load()
      loadVersionDetail(selectedVersionId)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setSlotUploadingKey(null)
    }
  }

  async function saveAutoImagineAfterPopulate(on: boolean) {
    if (!projectId || !selectedVersionId || !versionDetail) return
    setBusy(true)
    setErr(null)
    setMessage(null)
    try {
      const prev =
        versionDetail.buildOptions && typeof versionDetail.buildOptions === 'object'
          ? { ...versionDetail.buildOptions }
          : {}
      const r = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(selectedVersionId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buildOptions: { ...prev, autoGenerateImages: on } }),
        },
      )
      const res = (await r.json().catch(() => ({}))) as Record<string, unknown>
      if (!r.ok) {
        const msg = res?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      setMessage(on ? 'Imagine auto après remplissage : activé.' : 'Imagine auto après remplissage : désactivé.')
      load()
      loadVersionDetail(selectedVersionId)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function applyManualStructure() {
    const order = DECK_SECTION_ORDER.filter((id) => manualSelected[id])
    const variants: Record<string, string> = {}
    for (const id of order) {
      const v = manualVariants[id]
      if (!v) {
        setErr(`Choisis une variante pour ${id}.`)
        return
      }
      variants[id] = v
    }
    if (order.length === 0) {
      setErr('Coche au moins une section.')
      return
    }
    setErr(null)
    void patchVersion({
      sectionOrder: order,
      variantsBySection: variants,
      rebuildContentSections: true,
    })
  }

  if (!projectId) {
    return (
      <p className="le__err">
        Identifiant manquant. <Link to="/admin/landing-editor">Retour</Link>
      </p>
    )
  }

  const newVersionButton = (
    <button type="button" className="le__btn le__btn--secondary" disabled={busy} onClick={() => addDraftVersion()}>
      {busy ? '…' : 'Nouvelle version'}
    </button>
  )

  const versionList = (
    <>
      {newVersionButton}
      {versions.length === 0 ? (
        <p className="le__muted">Aucune version.</p>
      ) : (
        <ul className="le__list">
          {versions.map((v) => {
            const active = selectedVersionId === v._id
            return (
              <li key={v._id} className="le__list-item">
                <button
                  type="button"
                  className={active ? 'le__version-pick le__version-pick--on' : 'le__version-pick'}
                  onClick={() => setSelectedVersionId(v._id)}
                >
                  <span className="le__pill">{v.status}</span> v{v.versionNumber}
                  {v.label ? <span className="le__muted"> — {v.label}</span> : null}
                  {v.createdAt ? (
                    <span className="le__muted le__list-meta"> · {new Date(v.createdAt).toLocaleString()}</span>
                  ) : null}
                </button>
                <code className="le__mono"> {v._id}</code>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )

  return (
    <div className={`le${selectedVersionId ? ' le--fluid' : ''}`}>
      <header className={`le__head${selectedVersionId ? ' le__head--tight' : ''}`}>
        <h1 className={`le__title${selectedVersionId ? ' le__title--sm' : ''}`}>Projet landing</h1>
        <nav className="le__nav">
          <Link to="/admin/landing-editor">← Liste</Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>

      {err ? <p className="le__err">{err}</p> : null}
      {message ? <p className="le__ok">{message}</p> : null}

      {!project && !err ? <p className="le__muted">Chargement…</p> : null}

      {project ? (
        <>
          {!selectedVersionId ? (
            <>
              <section className="le__section">
                <h2>
                  <code>{project.slug}</code>
                </h2>
                <p className="le__muted">
                  Jeu : <code>{project.gameKey}</code>
                </p>
                {project.title ? <p>{project.title}</p> : null}
                {project.description ? <p className="le__desc">{project.description}</p> : null}
              </section>

              <section className="le__section">
                <h2>Versions</h2>
                <p className="le__muted">
                  Sélectionne une version pour l’étape <strong>Structure</strong> (Grok automatique ou cases à cocher). Les
                  sections ne sont pas obligatoirement toutes présentes ni dans l’ordre catalogue.
                </p>
                {versionList}
              </section>
            </>
          ) : null}

          {selectedVersionId && project && versionDetail ? (
            <div className="le__hub-context">
              <div className="le__hub-context-inner">
                <p className="le__hub-context-version">
                  <span className="le__pill">{versionDetail.status}</span> Version v{versionDetail.versionNumber}
                  {versionDetail.label ? <span className="le__muted"> — {versionDetail.label}</span> : null}
                </p>
                <p className="le__hub-context-meta">
                  Projet <code className="le__mono">{project.slug}</code>
                  <span className="le__muted"> · jeu </span>
                  <code className="le__mono">{project.gameKey}</code>
                  {project.title ? (
                    <>
                      <span className="le__muted"> — </span>
                      {project.title}
                    </>
                  ) : null}
                </p>
              </div>
              <div className="le__hub-context-actions">
                <Link
                  className="le__btn le__btn--small le__btn--secondary"
                  to={`/admin/landing-editor/${encodeURIComponent(projectId)}/preview/${encodeURIComponent(selectedVersionId)}`}
                >
                  Prévisualiser
                </Link>
                <Link
                  className="le__btn le__btn--small"
                  to={`/admin/landing-editor/${encodeURIComponent(projectId)}/version/${encodeURIComponent(selectedVersionId)}/edit`}
                >
                  Éditeur (ordre + JSON)
                </Link>
              </div>
            </div>
          ) : null}

          {selectedVersionId ? (
            <section className="le__section le__hub-version-pick">
              <h2 className="le__h3">Versions du projet</h2>
              <p className="le__muted le__hub-version-pick-hint">
                Choisis une autre version pour la structure et la génération, ou ouvre la prévisualisation / l’éditeur
                ci-dessus.
              </p>
              {versionList}
            </section>
          ) : null}

          {selectedVersionId ? (
            <div className="le__editor-single">
              <div className="le__editor-single-inner">
                {versionDetail ? (
            <section className="le__section le__section--wizard">
              <h2>Étape structure — version v{versionDetail.versionNumber}</h2>

              <fieldset className="le__fieldset">
                <legend className="le__legend">Mode</legend>
                <label className="le__radio">
                  <input
                    type="radio"
                    name="struct-mode"
                    checked={structureMode === 'auto'}
                    onChange={() => setStructureMode('auto')}
                  />
                  Automatique (Grok propose un sous-ensemble + ordre + variantes)
                </label>
                <label className="le__radio">
                  <input
                    type="radio"
                    name="struct-mode"
                    checked={structureMode === 'manual'}
                    onChange={() => setStructureMode('manual')}
                  />
                  Manuel (cocher les sections, choisir chaque variante)
                </label>
              </fieldset>

              {structureMode === 'auto' ? (
                <div className="le__wizard-block">
                  <label className="le__label">
                    Brief pour Grok (optionnel)
                    <textarea className="le__textarea" rows={3} value={brief} onChange={(e) => setBrief(e.target.value)} />
                  </label>
                  <button type="button" className="le__btn" disabled={busy} onClick={() => runSuggestStructure()}>
                    {busy ? '…' : 'Demander une structure à Grok'}
                  </button>
                  {suggestResult ? (
                    <div className="le__suggest-out">
                      <h3 className="le__h3">Proposition</h3>
                      <Markdown text={suggestResult.rationaleMarkdown} />
                      <p className="le__muted">
                        Modèle : <code>{suggestResult.model}</code>
                      </p>
                      <pre className="le__pre">{JSON.stringify(suggestResult.sectionOrder, null, 2)}</pre>
                      <pre className="le__pre le__pre--small">{JSON.stringify(suggestResult.variantsBySection, null, 2)}</pre>
                      <button type="button" className="le__btn" disabled={busy} onClick={() => applySuggestToVersion()}>
                        Appliquer à cette version
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="le__wizard-block">
                  <p className="le__muted">
                    Ordre d’affichage : même ordre que la liste ci-dessous (catalogue). Décoche les sections à exclure.
                  </p>
                  <ul className="le__manual-list">
                    {DECK_SECTION_ORDER.map((id) => (
                      <li key={id} className="le__manual-row">
                        <label className="le__check-label">
                          <input
                            type="checkbox"
                            checked={!!manualSelected[id]}
                            onChange={(e) => toggleManualSection(id, e.target.checked)}
                          />
                          <span>
                            {SECTION_LABELS_FR[id]} (<code>{id}</code>)
                          </span>
                        </label>
                        {manualSelected[id] ? (
                          <select
                            className="le__select"
                            value={manualVariants[id] ?? VARIANTS_BY_SECTION[id][0]}
                            onChange={(e) => setManualVariant(id, e.target.value)}
                          >
                            {VARIANTS_BY_SECTION[id].map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="le__btn" disabled={busy} onClick={() => applyManualStructure()}>
                    Appliquer la structure manuelle
                  </button>
                </div>
              )}

              {versionDetail.sectionOrder && versionDetail.sectionOrder.length > 0 ? (
                <div className="le__current">
                  <h3 className="le__h3">Structure actuelle en base</h3>
                  <pre className="le__pre le__pre--small">{JSON.stringify(versionDetail.sectionOrder, null, 2)}</pre>
                  <pre className="le__pre le__pre--tiny">{JSON.stringify(versionDetail.variantsBySection, null, 2)}</pre>
                </div>
              ) : null}

              {versionDetail.sectionOrder && versionDetail.sectionOrder.length > 0 ? (
                <div className="le__populate">
                  <h3 className="le__h3">Étape contenu (Grok)</h3>
                  <p className="le__muted">
                    Remplit <code>globals</code> (dont <code>visualBrief</code>), <code>imagePrompts</code>, les{' '}
                    <code>props</code> / <code>media</code>, puis dérive <code>imageSlots</code> (purpose, génération). Nécessite
                    une structure déjà appliquée.
                  </p>
                  <div className="le__visual-brief">
                    <label className="le__label">
                      Brief visuel global (<code>globals.visualBrief</code>)
                      <textarea
                        className="le__textarea"
                        rows={4}
                        value={visualBriefDraft}
                        disabled={busy}
                        onChange={(e) => setVisualBriefDraft(e.target.value)}
                        placeholder="Ton, ambiance, cohérence avec le jeu — utilisé pour assembler les prompts image."
                      />
                    </label>
                    <button
                      type="button"
                      className="le__btn le__btn--secondary"
                      disabled={busy}
                      onClick={() => void saveVisualBrief()}
                    >
                      {busy ? '…' : 'Enregistrer le brief visuel'}
                    </button>
                    <p className="le__muted le__visual-brief-hint">
                      Enregistre dans Mongo sans relancer Grok. Laisser vide puis enregistrer retire le champ.
                    </p>
                    <div className="le__page-bg-editor">
                      <label className="le__label">
                        Fond de page (<code>globals.backgroundImage.imageUrl</code>)
                        <input
                          type="text"
                          className="le__input"
                          value={pageBgUrlDraft}
                          disabled={busy}
                          onChange={(e) => setPageBgUrlDraft(e.target.value)}
                          placeholder="/site/landing-storage/.../assets/file/... ou URL publique"
                        />
                      </label>
                      <label className="le__label">
                        Texte alternatif du fond (optionnel)
                        <input
                          type="text"
                          className="le__input"
                          value={pageBgAltDraft}
                          disabled={busy}
                          onChange={(e) => setPageBgAltDraft(e.target.value)}
                        />
                      </label>
                      <div className="le__page-bg-actions">
                        <button
                          type="button"
                          className="le__btn le__btn--secondary"
                          disabled={busy}
                          onClick={() => void savePageBackground()}
                        >
                          {busy ? '…' : 'Enregistrer le fond'}
                        </button>
                        <p className="le__muted le__page-bg-hint">
                          URL vide + enregistrer retire le fond. Les sections peuvent avoir{' '}
                          <code>backgroundImage</code> dans le JSON (rendu plein cadre + voile surface).
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="le__populate-flags">
                    <label className="le__check-label le__check-label--block">
                      <input
                        type="checkbox"
                        checked={versionDetail.buildOptions?.autoGenerateImages !== false}
                        disabled={busy}
                        onChange={(e) => void saveAutoImagineAfterPopulate(e.target.checked)}
                      />
                      <span>
                        Après remplissage : lancer <strong>Imagine → S3</strong> pour les slots mappés
                        {storageStatus?.storageReady ? '' : ' (stockage fichiers indisponible : étape ignorée)'}.
                      </span>
                    </label>
                    <label className="le__check-label le__check-label--block">
                      <input
                        type="checkbox"
                        checked={skipAutoImagineOnce}
                        disabled={busy}
                        onChange={(e) => setSkipAutoImagineOnce(e.target.checked)}
                      />
                      <span>Prochain remplissage seulement : ne pas lancer Imagine (même si l’option ci-dessus est cochée).</span>
                    </label>
                  </div>
                  <label className="le__label">
                    Brief (optionnel)
                    <textarea
                      className="le__textarea"
                      rows={2}
                      value={populateBrief}
                      onChange={(e) => setPopulateBrief(e.target.value)}
                      placeholder="Ex. ton plus intime, mettre l’accent sur le livret…"
                    />
                  </label>
                  <button type="button" className="le__btn" disabled={busy} onClick={() => runPopulateContent()}>
                    {busy ? '…' : 'Générer le contenu avec Grok'}
                  </button>
                  <p className="le__muted le__populate-meta le__hub-open-row">
                    <Link
                      className="le__link"
                      to={`/admin/landing-editor/${encodeURIComponent(projectId!)}/preview/${encodeURIComponent(selectedVersionId)}`}
                    >
                      Prévisualiser
                    </Link>
                    <span className="le__muted"> · </span>
                    <Link
                      className="le__link"
                      to={`/admin/landing-editor/${encodeURIComponent(projectId!)}/version/${encodeURIComponent(selectedVersionId)}/edit`}
                    >
                      Éditeur (ordre des sections + JSON)
                    </Link>
                  </p>
                  {storageStatus?.storageReady ? (
                    <div className="le__media-s3">
                      <p className="le__muted">
                        Tous les slots <code>media</code> avec <code>sceneDescription</code> : Grok Imagine → S3 → champs{' '}
                        <code>imageUrl</code> (hero, créateur, galerie, etc.). Les fichiers uploadés passent déjà par S3 (
                        <code>POST …/assets</code>) ; pour les placeholders <code>/ai/generated-images/…</code>, cartes
                        miroir ou URLs externes, utilise l’hydratation.
                      </p>
                      <div className="le__media-s3-row">
                        <button
                          type="button"
                          className="le__btn le__btn--secondary"
                          disabled={busy}
                          onClick={() => runGenerateAllImagineS3()}
                        >
                          {busy ? '…' : 'Générer toutes les images IA (Imagine → S3)'}
                        </button>
                        <button
                          type="button"
                          className="le__btn le__btn--secondary"
                          disabled={busy}
                          onClick={() => runHydrateImageUrlsS3()}
                        >
                          {busy ? '…' : 'Pousser les imageUrl existantes vers S3'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="le__muted le__populate-meta">
                      S3 non configuré : configure les variables dans l’API pour activer Imagine → S3.
                    </p>
                  )}
                  {imageSlotRows.length > 0 ? (
                    <div className="le__image-slots">
                      <h3 className="le__h3">Slots image</h3>
                      <p className="le__muted">
                        Liste dérivée de <code>imageSlots</code> (après remplissage). <strong>Variantes Grok</strong> enregistre
                        des prompts EN dans Mongo ; « Utiliser comme scène » met à jour <code>sceneDescription</code> (
                        <code>media</code> inclus). Upload : S3 puis <code>PATCH …/image-slot</code>.
                      </p>
                      <ul className="le__slot-list">
                        {imageSlotRows.map((row) => {
                          const rowKey = `${row.sectionId}:${row.slotId}`
                          const uploading = slotUploadingKey === rowKey
                          return (
                            <ImageSlotRowBlock
                              key={rowKey}
                              row={row}
                              projectId={projectId!}
                              versionId={selectedVersionId!}
                              storageReady={!!storageStatus?.storageReady}
                              disabled={busy}
                              uploading={uploading}
                              onUpload={(file) => void uploadAndAssignSlot(row.sectionId, row.slotId, file)}
                              onReload={() => {
                                load()
                                loadVersionDetail(selectedVersionId!)
                              }}
                              onMessage={(s) => {
                                setMessage(s)
                                setErr(null)
                              }}
                              onError={(s) => {
                                setErr(s)
                                setMessage(null)
                              }}
                            />
                          )
                        })}
                      </ul>
                    </div>
                  ) : null}
                  {Array.isArray(versionDetail.content?.sections) &&
                  (versionDetail.content?.sections as unknown[]).length > 0 ? (
                    <p className="le__muted le__populate-meta">
                      JSON actuel :{' '}
                      <strong>{(versionDetail.content?.sections as unknown[]).length}</strong> section(s) dans{' '}
                      <code>content.sections</code>
                      {(versionDetail.content?.sections as unknown[]).some(
                        (s) =>
                          s &&
                          typeof s === 'object' &&
                          Object.keys((s as Record<string, unknown>).props ?? {}).length > 0,
                      )
                        ? ' (certaines props non vides)'
                        : ' (squelettes vides si pas encore lancé)'}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>
                ) : (
                  <p className="le__muted">Chargement de la version…</p>
                )}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
