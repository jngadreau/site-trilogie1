import { useEffect, useState, type FormEvent } from 'react'
import '../landing-editor.css'

export type ImageSlotRow = {
  sectionId: string
  sectionVariant: string
  slotId: string
  purpose?: string
  sceneDescription?: string
  resolvedUrl?: string
  resolvedAlt?: string
  promptAlternatives?: string[]
  primaryModel?: 'grok_imagine' | 'midjourney' | 'none'
}

export function collectImageSlotRows(content: Record<string, unknown> | undefined): ImageSlotRow[] {
  if (!content) return []
  const sections = content.sections
  if (!Array.isArray(sections)) return []
  const out: ImageSlotRow[] = []
  for (const s of sections) {
    if (!s || typeof s !== 'object') continue
    const sec = s as Record<string, unknown>
    const sectionId = typeof sec.id === 'string' ? sec.id : ''
    const sectionVariant = typeof sec.variant === 'string' ? sec.variant : ''
    const imageSlots = Array.isArray(sec.imageSlots) ? sec.imageSlots : []
    for (const sl of imageSlots) {
      if (!sl || typeof sl !== 'object') continue
      const slot = sl as Record<string, unknown>
      const slotId = typeof slot.slotId === 'string' ? slot.slotId : ''
      if (!sectionId || !slotId) continue
      const resolved =
        slot.resolved && typeof slot.resolved === 'object'
          ? (slot.resolved as Record<string, unknown>)
          : null
      const url = typeof resolved?.imageUrl === 'string' ? resolved.imageUrl : undefined
      const gen =
        slot.generation && typeof slot.generation === 'object'
          ? (slot.generation as Record<string, unknown>)
          : null
      const rawAlts = gen?.promptAlternativesEn
      const promptAlternatives = Array.isArray(rawAlts)
        ? rawAlts.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        : []
      const pm = gen?.primaryModel
      const primaryModel =
        pm === 'grok_imagine' || pm === 'midjourney' || pm === 'none' ? pm : undefined
      out.push({
        sectionId,
        sectionVariant,
        slotId,
        purpose: typeof slot.purpose === 'string' ? slot.purpose : undefined,
        sceneDescription: typeof slot.sceneDescription === 'string' ? slot.sceneDescription : undefined,
        resolvedUrl: url,
        resolvedAlt: typeof resolved?.imageAlt === 'string' ? resolved.imageAlt : undefined,
        ...(promptAlternatives.length > 0 ? { promptAlternatives } : {}),
        ...(primaryModel !== undefined ? { primaryModel } : {}),
      })
    }
  }
  return out
}

export function collectImageSlotRowsForSection(
  content: Record<string, unknown> | undefined,
  sectionId: string,
): ImageSlotRow[] {
  const sid = sectionId.trim()
  if (!sid) return []
  return collectImageSlotRows(content).filter((r) => r.sectionId === sid)
}

export function ImageSlotRowBlock(props: {
  row: ImageSlotRow
  projectId: string
  versionId: string
  storageReady: boolean
  disabled: boolean
  uploading: boolean
  onUpload: (file: File) => void
  onReload: () => void
  onMessage: (s: string) => void
  onError: (s: string) => void
}) {
  const {
    row,
    projectId,
    versionId,
    storageReady,
    disabled,
    uploading,
    onUpload,
    onReload,
    onMessage,
    onError,
  } = props
  const [sceneDraft, setSceneDraft] = useState(row.sceneDescription ?? '')
  const [altDraft, setAltDraft] = useState(row.resolvedAlt ?? '')
  const [savingScene, setSavingScene] = useState(false)
  const [savingAlt, setSavingAlt] = useState(false)

  useEffect(() => {
    setSceneDraft(row.sceneDescription ?? '')
    setAltDraft(row.resolvedAlt ?? '')
  }, [row.sectionId, row.slotId, row.sceneDescription, row.resolvedAlt])

  const [suggestingAlts, setSuggestingAlts] = useState(false)
  const [applyingScene, setApplyingScene] = useState(false)
  const [patchingModel, setPatchingModel] = useState(false)
  const [copyingPrompt, setCopyingPrompt] = useState(false)
  const [generatingImagine, setGeneratingImagine] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [applyingLanding, setApplyingLanding] = useState(false)
  const [freshGeneratedUrl, setFreshGeneratedUrl] = useState<string | null>(null)

  useEffect(() => {
    if (freshGeneratedUrl && row.resolvedUrl === freshGeneratedUrl) {
      setFreshGeneratedUrl(null)
    }
  }, [row.resolvedUrl, freshGeneratedUrl])

  useEffect(() => {
    if (!lightboxUrl) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxUrl(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxUrl])

  async function savePrimaryModel(m: 'grok_imagine' | 'midjourney' | 'none') {
    setPatchingModel(true)
    onError('')
    try {
      const r = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/image-slot`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId: row.sectionId,
            slotId: row.slotId,
            primaryModel: m,
          }),
        },
      )
      const body = (await r.json().catch(() => ({}))) as { message?: string }
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      onMessage(`Modèle préféré : ${m}`)
      onReload()
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setPatchingModel(false)
    }
  }

  async function copyAssembledPromptToClipboard() {
    setCopyingPrompt(true)
    onError('')
    try {
      const q = new URLSearchParams({
        sectionId: row.sectionId,
        slotId: row.slotId,
      })
      const r = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/assembled-image-prompt?${q.toString()}`,
      )
      const body = (await r.json().catch(() => ({}))) as {
        message?: string
        assembledPromptEn?: string
      }
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      const text = typeof body.assembledPromptEn === 'string' ? body.assembledPromptEn : ''
      if (!text) {
        throw new Error('Réponse sans prompt')
      }
      await navigator.clipboard.writeText(text)
      onMessage('Prompt Imagine (EN) copié — collage dans Midjourney ou autre outil.')
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setCopyingPrompt(false)
    }
  }

  async function copyPlainText(t: string) {
    onError('')
    try {
      await navigator.clipboard.writeText(t)
      onMessage('Texte copié dans le presse-papiers.')
    } catch {
      onError('Copie impossible (permissions navigateur).')
    }
  }

  async function suggestAlternatives() {
    setSuggestingAlts(true)
    onError('')
    try {
      const r = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/suggest-prompt-alternatives`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId: row.sectionId,
            slotId: row.slotId,
            count: 6,
          }),
        },
      )
      const body = (await r.json().catch(() => ({}))) as {
        message?: string
        promptAlternativesEn?: string[]
      }
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      const n = Array.isArray(body.promptAlternativesEn) ? body.promptAlternativesEn.length : 0
      onMessage(`Variantes Grok enregistrées (${n}) — ${row.sectionId} / ${row.slotId}`)
      onReload()
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setSuggestingAlts(false)
    }
  }

  async function applyAlternativeAsScene(text: string) {
    const sd = text.trim()
    if (!sd) return
    setApplyingScene(true)
    onError('')
    try {
      const r = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/image-slot`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId: row.sectionId,
            slotId: row.slotId,
            sceneDescription: sd,
          }),
        },
      )
      const body = (await r.json().catch(() => ({}))) as { message?: string }
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      setSceneDraft(sd)
      onMessage(`Scène remplacée par la variante — ${row.sectionId} / ${row.slotId}`)
      onReload()
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setApplyingScene(false)
    }
  }

  async function saveScene(e: FormEvent) {
    e.preventDefault()
    const sd = sceneDraft.trim()
    if (!sd) {
      onError('La description de scène ne peut pas être vide.')
      return
    }
    setSavingScene(true)
    onError('')
    try {
      const r = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/image-slot`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId: row.sectionId,
            slotId: row.slotId,
            sceneDescription: sd,
          }),
        },
      )
      const body = (await r.json().catch(() => ({}))) as { message?: string }
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      onMessage(`Scène enregistrée — ${row.sectionId} / ${row.slotId}`)
      onReload()
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setSavingScene(false)
    }
  }

  async function generateImagineToS3() {
    const sd = sceneDraft.trim()
    if (!sd) {
      onError('Saisis une description de scène avant de générer.')
      return
    }
    setGeneratingImagine(true)
    onError('')
    try {
      const r = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/generate-image-slot-imagine-s3`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId: row.sectionId,
            slotId: row.slotId,
            sceneDescription: sd,
          }),
        },
      )
      const body = (await r.json().catch(() => ({}))) as {
        message?: string
        publicUrl?: string
        model?: string
      }
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      const url = typeof body.publicUrl === 'string' ? body.publicUrl : ''
      if (!url) {
        throw new Error('Réponse sans publicUrl')
      }
      setFreshGeneratedUrl(url)
      onMessage(
        `Image générée (${typeof body.model === 'string' ? body.model : 'Imagine'}) — enregistrée pour ce slot.`,
      )
      onReload()
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setGeneratingImagine(false)
    }
  }

  async function applyImageToLanding(imageUrl: string) {
    const u = imageUrl.trim()
    if (!u) return
    setApplyingLanding(true)
    onError('')
    try {
      const r = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/image-slot`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId: row.sectionId,
            slotId: row.slotId,
            resolved: { imageUrl: u, source: 'grok_imagine' },
          }),
        },
      )
      const body = (await r.json().catch(() => ({}))) as { message?: string }
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      onMessage('Image appliquée sur la landing (sections + slot).')
      setFreshGeneratedUrl(null)
      onReload()
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setApplyingLanding(false)
    }
  }

  async function saveAlt(e: FormEvent) {
    e.preventDefault()
    const a = altDraft.trim()
    if (!a) {
      onError('Le texte alternatif ne peut pas être vide (utilise un espace significatif si besoin).')
      return
    }
    if (!row.resolvedUrl) {
      onError('Aucune image liée : texte alternatif non applicable.')
      return
    }
    setSavingAlt(true)
    onError('')
    try {
      const r = await fetch(
        `/site/landing-storage/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/image-slot`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId: row.sectionId,
            slotId: row.slotId,
            imageAlt: a,
          }),
        },
      )
      const body = (await r.json().catch(() => ({}))) as { message?: string }
      if (!r.ok) {
        const msg = body?.message
        throw new Error(typeof msg === 'string' ? msg : `${r.status}`)
      }
      onMessage(`Texte alternatif enregistré — ${row.sectionId} / ${row.slotId}`)
      onReload()
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setSavingAlt(false)
    }
  }

  return (
    <li className="le__slot-item">
      <div className="le__slot-head">
        <code className="le__mono">{row.sectionId}</code>
        <span className="le__muted">/</span>
        <code className="le__mono">{row.slotId}</code>
        {row.purpose ? <span className="le__slot-purpose">{row.purpose}</span> : null}
      </div>
      <div className="le__slot-model-row">
        <label className="le__label le__label--inline">
          <span className="le__muted">Modèle préféré</span>
          <select
            className="le__select le__select--compact"
            value={row.primaryModel ?? 'grok_imagine'}
            disabled={disabled || patchingModel || suggestingAlts || savingScene || applyingScene}
            onChange={(e) =>
              void savePrimaryModel(e.target.value as 'grok_imagine' | 'midjourney' | 'none')
            }
          >
            <option value="grok_imagine">Grok Imagine</option>
            <option value="midjourney">Midjourney (export prompt)</option>
            <option value="none">Aucun</option>
          </select>
        </label>
        <button
          type="button"
          className="le__btn le__btn--small le__btn--secondary"
          disabled={disabled || copyingPrompt || patchingModel}
          onClick={() => void copyAssembledPromptToClipboard()}
        >
          {copyingPrompt ? '…' : 'Copier le prompt Imagine (EN)'}
        </button>
      </div>
      <p className="le__muted le__slot-mj-hint">
        Même texte que pour la génération API ; utile pour Midjourney ou un autre service sans API ici.
      </p>
      <form className="le__slot-scene-form" onSubmit={saveScene}>
        <label className="le__label le__label--compact">
          Description de scène (Imagine / prompt)
          <textarea
            className="le__textarea le__textarea--compact"
            rows={3}
            value={sceneDraft}
            disabled={disabled || savingScene}
            onChange={(e) => setSceneDraft(e.target.value)}
          />
        </label>
        <div className="le__slot-scene-actions">
          <button type="submit" className="le__btn le__btn--small" disabled={disabled || savingScene || applyingScene}>
            {savingScene ? '…' : 'Enregistrer la scène'}
          </button>
          <button
            type="button"
            className="le__btn le__btn--small le__btn--secondary"
            disabled={disabled || suggestingAlts || savingScene || applyingScene}
            onClick={() => void suggestAlternatives()}
          >
            {suggestingAlts ? '…' : 'Variantes Grok (6)'}
          </button>
        </div>
      </form>
      <div className="le__slot-imagine-block">
        <button
          type="button"
          className="le__btn le__btn--small"
          disabled={
            disabled ||
            generatingImagine ||
            !storageReady ||
            (row.primaryModel ?? 'grok_imagine') === 'none' ||
            !sceneDraft.trim()
          }
          title={
            !storageReady
              ? 'Configure S3 côté API pour générer vers le stockage.'
              : (row.primaryModel ?? 'grok_imagine') === 'none'
                ? 'Modèle « Aucun » : choisis Grok Imagine pour activer la génération ici.'
                : undefined
          }
          onClick={() => void generateImagineToS3()}
        >
          {generatingImagine ? 'Génération…' : 'Générer l’image (Imagine → S3)'}
        </button>
        <p className="le__muted le__slot-imagine-hint">
          Utilise le texte ci-dessus comme scène (enregistré dans la version avec l’image). Nécessite S3 et le service
          Imagine côté API.
        </p>
      </div>
      {row.promptAlternatives && row.promptAlternatives.length > 0 ? (
        <div className="le__slot-alt-prompts">
          <p className="le__muted le__slot-alt-prompts-title">Variantes enregistrées (Mongo)</p>
          <ol className="le__slot-alt-prompts-list">
            {row.promptAlternatives.map((p, idx) => (
              <li key={idx} className="le__slot-alt-prompts-item">
                <p className="le__slot-alt-prompt-text">{p}</p>
                <div className="le__slot-alt-prompt-actions">
                  <button
                    type="button"
                    className="le__btn le__btn--small le__btn--secondary"
                    disabled={disabled || applyingScene || suggestingAlts}
                    onClick={() => void applyAlternativeAsScene(p)}
                  >
                    {applyingScene ? '…' : 'Utiliser comme scène'}
                  </button>
                  <button
                    type="button"
                    className="le__btn le__btn--small le__btn--secondary"
                    disabled={disabled}
                    onClick={() => void copyPlainText(p)}
                  >
                    Copier
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {freshGeneratedUrl || row.resolvedUrl ? (
        <div className="le__slot-result">
          <p className="le__muted le__slot-result-label">Image du slot</p>
          <div className="le__slot-result-preview">
            <button
              type="button"
              className="le__slot-result-img-btn"
              onClick={() => setLightboxUrl(freshGeneratedUrl || row.resolvedUrl || null)}
              title="Voir en grand"
            >
              <img
                src={freshGeneratedUrl || row.resolvedUrl}
                alt={row.resolvedAlt || 'Image du slot'}
                className="le__slot-result-img"
              />
            </button>
            <div className="le__slot-result-actions">
              <button
                type="button"
                className="le__btn le__btn--small le__btn--secondary"
                onClick={() => setLightboxUrl(freshGeneratedUrl || row.resolvedUrl || null)}
              >
                Voir en grand
              </button>
              <button
                type="button"
                className="le__btn le__btn--small le__btn--secondary"
                disabled={disabled || applyingLanding}
                onClick={() => void onReload()}
              >
                Actualiser l’aperçu
              </button>
              <button
                type="button"
                className="le__btn le__btn--small"
                disabled={disabled || applyingLanding || !(freshGeneratedUrl || row.resolvedUrl)}
                title="Réécrit l’URL dans les sections et le slot (utile si l’aperçu ne suit pas)."
                onClick={() => void applyImageToLanding(freshGeneratedUrl || row.resolvedUrl || '')}
              >
                {applyingLanding ? '…' : 'Utiliser sur la landing'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="le__slot-body">
        {freshGeneratedUrl || row.resolvedUrl ? (
          <div className="le__slot-thumb le__slot-thumb--empty le__slot-thumb--note">Aperçu ci-dessus</div>
        ) : (
          <div className="le__slot-thumb le__slot-thumb--empty">Aperçu</div>
        )}
        <div className="le__slot-side">
          <label className="le__slot-upload">
            <span className="le__muted le__slot-upload-label">
              {storageReady ? 'Remplacer (fichier image)' : 'Upload indisponible (S3)'}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,.webp,.jpg,.jpeg,.png"
              disabled={!storageReady || uploading || disabled}
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) onUpload(f)
              }}
            />
            {uploading ? <span className="le__muted">Envoi…</span> : null}
          </label>
          {row.resolvedUrl ? (
            <form className="le__slot-alt-form" onSubmit={saveAlt}>
              <label className="le__label le__label--compact">
                Texte alternatif (accessibilité)
                <input
                  type="text"
                  className="le__input le__input--compact"
                  value={altDraft}
                  disabled={disabled || savingAlt}
                  onChange={(e) => setAltDraft(e.target.value)}
                />
              </label>
              <button type="submit" className="le__btn le__btn--small le__btn--secondary" disabled={disabled || savingAlt}>
                {savingAlt ? '…' : 'Enregistrer l’alt'}
              </button>
            </form>
          ) : null}
        </div>
      </div>
      {lightboxUrl ? (
        <div
          className="le__lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Image en grand"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="le__lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <div className="le__lightbox-bar">
              <button type="button" className="le__btn le__btn--small le__btn--secondary" onClick={() => setLightboxUrl(null)}>
                Fermer
              </button>
            </div>
            <img src={lightboxUrl} alt={row.resolvedAlt || 'Image'} className="le__lightbox-img" />
          </div>
        </div>
      ) : null}
    </li>
  )
}
