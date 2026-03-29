import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SECTION_LABELS_FR } from '../lib/deckSectionCatalog'
import { DeckLandingView } from '../components/DeckLandingView'
import { isDeckModularLandingV1 } from '../lib/deckLandingGuards'
import type { DeckModularLandingV1 } from '../types/deckLanding'
import './landing-editor.css'

type ProjectDoc = {
  _id: string
  gameKey: string
  slug: string
  title?: string
}

type VersionRow = {
  _id: string
  projectId?: string
  versionNumber: number
  status: string
  label?: string
  sectionOrder?: string[]
  content?: Record<string, unknown>
}

type SectionEntry = { id: string; variant: string; raw: Record<string, unknown> }

function parseSections(content: Record<string, unknown> | undefined): SectionEntry[] {
  if (!content) return []
  const sections = content.sections
  if (!Array.isArray(sections)) return []
  const out: SectionEntry[] = []
  for (const s of sections) {
    if (!s || typeof s !== 'object') continue
    const sec = s as Record<string, unknown>
    const id = typeof sec.id === 'string' ? sec.id : ''
    const variant = typeof sec.variant === 'string' ? sec.variant : ''
    if (!id) continue
    out.push({ id, variant, raw: sec })
  }
  return out
}

export function LandingEditorVersionPage() {
  const { projectId, versionId } = useParams<{ projectId: string; versionId: string }>()
  const [project, setProject] = useState<ProjectDoc | null>(null)
  const [version, setVersion] = useState<VersionRow | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const afterLoadSelectId = useRef<string | null>(null)

  const load = useCallback(() => {
    if (!projectId || !versionId) return
    setErr(null)
    Promise.all([
      fetch(`/site/landing-storage/projects/${encodeURIComponent(projectId)}`).then((r) => {
        if (!r.ok) throw new Error(`projet ${r.status}`)
        return r.json()
      }),
      fetch(`/site/landing-storage/versions/${encodeURIComponent(versionId)}`).then((r) => {
        if (!r.ok) throw new Error(`version ${r.status}`)
        return r.json()
      }),
    ])
      .then(([p, v]) => {
        const vr = v as VersionRow
        const pid = String(vr.projectId ?? '')
        if (pid && pid !== projectId) {
          throw new Error('Cette version n’appartient pas au projet indiqué.')
        }
        setProject(p as ProjectDoc)
        setVersion(vr)
        const selId = afterLoadSelectId.current
        afterLoadSelectId.current = null
        if (selId) {
          const entries = parseSections(vr.content)
          const idx = entries.findIndex((e) => e.id === selId)
          if (idx >= 0) setSelectedIndex(idx)
        }
      })
      .catch(() => setErr('Chargement impossible.'))
  }, [projectId, versionId])

  useEffect(() => {
    load()
  }, [load])

  const sectionEntries = useMemo(() => parseSections(version?.content), [version?.content])

  const previewLanding = useMemo((): DeckModularLandingV1 | null => {
    const c = version?.content
    if (!c || !isDeckModularLandingV1(c)) return null
    return c
  }, [version?.content])

  useEffect(() => {
    if (selectedIndex >= sectionEntries.length) {
      setSelectedIndex(Math.max(0, sectionEntries.length - 1))
    }
  }, [sectionEntries.length, selectedIndex])

  const selectedSectionJson = useMemo(() => {
    const s = sectionEntries[selectedIndex]
    if (!s) return '— Aucune section —\n'
    try {
      return JSON.stringify(s.raw, null, 2)
    } catch {
      return String(s.raw)
    }
  }, [sectionEntries, selectedIndex])

  async function persistOrder(newIds: string[]) {
    if (!projectId || !versionId) return
    afterLoadSelectId.current = sectionEntries[selectedIndex]?.id ?? null
    setReordering(true)
    setErr(null)
    try {
      const r = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/reorder-sections`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sectionOrder: newIds }),
        },
      )
      const body = (await r.json().catch(() => ({}))) as { message?: string }
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      await load()
    } catch (e) {
      setErr((e as Error).message)
      afterLoadSelectId.current = null
    } finally {
      setReordering(false)
    }
  }

  function moveSection(index: number, delta: -1 | 1) {
    const j = index + delta
    if (j < 0 || j >= sectionEntries.length) return
    const ids = sectionEntries.map((e) => e.id)
    const next = [...ids]
    const [removed] = next.splice(index, 1)
    next.splice(j, 0, removed)
    void persistOrder(next)
  }

  if (!projectId || !versionId) {
    return (
      <p className="le__err">
        Paramètres manquants. <Link to="/admin/landing-editor">Retour</Link>
      </p>
    )
  }

  return (
    <div className="le le--fluid le--ve">
      <header className="le__head le__head--tight">
        <h1 className="le__title le__title--sm">Éditeur de version</h1>
        <nav className="le__nav">
          <Link to={`/admin/landing-editor/${encodeURIComponent(projectId)}`}>← Projet (versions & génération)</Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>

      {err ? <p className="le__err">{err}</p> : null}

      {!project || !version ? (
        <p className="le__muted">{err ? null : 'Chargement…'}</p>
      ) : (
        <>
          <div className="le__ve-context" aria-label="Contexte verrouillé">
            <div className="le__ve-context-inner">
              <p className="le__ve-context-title">
                <span className="le__pill">{version.status}</span> Version v{version.versionNumber}
                {version.label ? <span className="le__muted"> — {version.label}</span> : null}
              </p>
              <p className="le__ve-context-meta">
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
              <p className="le__muted le__ve-context-hint">
                Le projet et la version ne sont pas modifiables ici — retourne au projet pour structure, contenu et
                images.
              </p>
            </div>
            <div className="le__ve-context-actions">
              <Link
                className="le__btn le__btn--small le__btn--secondary"
                to={`/admin/landing-editor/${encodeURIComponent(projectId)}/preview/${encodeURIComponent(versionId)}`}
              >
                Prévisualiser plein écran
              </Link>
            </div>
          </div>

          <div className="le__split-root le__ve-split">
            <div className="le__split-preview">
              {previewLanding ? (
                <DeckLandingView
                  data={previewLanding}
                  fillViewport={false}
                  header={
                    <nav className="dl-topbar__nav" aria-label="Aperçu">
                      <span className="dl-topbar__slug">
                        Aperçu <code>{previewLanding.slug}</code>
                      </span>
                    </nav>
                  }
                />
              ) : (
                <p className="le__muted le__split-preview-placeholder">
                  Aperçu indisponible : contenu non valide (<code>DeckModularLandingV1</code>).
                </p>
              )}
            </div>
            <div className="le__split-panel le__ve-panel">
              <h2 className="le__ve-panel-title">Sections</h2>
              <p className="le__muted le__ve-panel-lead">
                Ordre d’affichage de la landing. Les boutons réécrivent <code>content.sections</code> et{' '}
                <code>sectionOrder</code>.
              </p>
              {sectionEntries.length === 0 ? (
                <p className="le__muted">Aucune section dans le JSON.</p>
              ) : (
                <ul className="le__ve-section-list">
                  {sectionEntries.map((entry, index) => {
                    const label =
                      entry.id in SECTION_LABELS_FR
                        ? SECTION_LABELS_FR[entry.id as keyof typeof SECTION_LABELS_FR]
                        : undefined
                    const on = index === selectedIndex
                    return (
                      <li key={`${entry.id}-${index}`} className={`le__ve-section-row${on ? ' le__ve-section-row--on' : ''}`}>
                        <button
                          type="button"
                          className="le__ve-section-select"
                          onClick={() => setSelectedIndex(index)}
                        >
                          <span className="le__ve-section-id">
                            <code>{entry.id}</code>
                          </span>
                          {label ? <span className="le__muted le__ve-section-label">{label}</span> : null}
                          <span className="le__ve-section-variant">
                            <code>{entry.variant}</code>
                          </span>
                        </button>
                        <div className="le__ve-section-move">
                          <button
                            type="button"
                            className="le__btn le__btn--small le__btn--secondary"
                            disabled={reordering || index === 0}
                            title="Monter"
                            aria-label={`Monter ${entry.id}`}
                            onClick={() => moveSection(index, -1)}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="le__btn le__btn--small le__btn--secondary"
                            disabled={reordering || index >= sectionEntries.length - 1}
                            title="Descendre"
                            aria-label={`Descendre ${entry.id}`}
                            onClick={() => moveSection(index, 1)}
                          >
                            ↓
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              <div className="le__ve-json-block">
                <h3 className="le__ve-json-title">JSON section (debug)</h3>
                <pre className="le__pre le__ve-json-pre" tabIndex={0}>
                  {selectedSectionJson}
                </pre>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
