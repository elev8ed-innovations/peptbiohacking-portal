import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { attachmentPath } from '../lib/attachmentPath'

export default function ConsultationAttachments({ photos, patientId }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!Array.isArray(photos) || !photos.length) return null

  async function openFile(value) {
    setError('')
    const path = attachmentPath(value, import.meta.env.VITE_SUPABASE_URL, patientId)
    if (!path) { setError('No se pudo identificar el archivo de este paciente.'); return }
    const preview = window.open('about:blank', '_blank')
    if (preview) preview.opener = null
    setBusy(true)
    try {
      const { data, error: signError } = await supabase.storage.from('lab-uploads').createSignedUrl(path, 300)
      if (signError || !data?.signedUrl) throw signError || new Error('Missing URL')
      if (preview) preview.location.replace(data.signedUrl)
      else setError('Permite ventanas emergentes y vuelve a abrir el archivo.')
    } catch {
      preview?.close()
      setError('No se pudo abrir el archivo. Intenta de nuevo.')
    } finally { setBusy(false) }
  }

  return <div>
    {photos.map((value, i) => <button type="button" key={i} disabled={busy} onClick={() => openFile(value)} style={{ margin: '6px', padding: '8px' }}>Abrir archivo {i + 1}</button>)}
    {error && <p role="alert">{error}</p>}
  </div>
}
