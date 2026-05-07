import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../context/LanguageContext'

export default function LabResults() {
  const { t } = useLang()
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      await fetchFiles(user.id)
      setLoading(false)
    }
    load()
  }, [])

  const fetchFiles = async (uid) => {
    const { data } = await supabase
      .from('lab_uploads')
      .select('*')
      .eq('patient_id', uid)
      .order('uploaded_at', { ascending: false })
    setFiles(data || [])
  }

  const handleUpload = async (file) => {
    if (!file || !userId) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('consult-photos')
      .upload(`labs/${fileName}`, file)

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('consult-photos')
        .getPublicUrl(`labs/${fileName}`)

      await supabase.from('lab_uploads').insert({
        patient_id: userId,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        uploaded_at: new Date().toISOString(),
      })

      await fetchFiles(userId)
    }
    setUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const isPDF = (url) => url?.toLowerCase().includes('.pdf') || url?.toLowerCase().endsWith('pdf')

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628' }}>
      <Navbar role="patient" />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', color: '#fff', margin: '0 0 8px' }}>
          {t.labsTitle}
        </h1>
        <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginBottom: '8px' }} />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Outfit, sans-serif', fontSize: '14px', marginBottom: '28px' }}>
          {t.uploadHint}
        </p>

        {/* Upload Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? '#00C2A8' : 'rgba(0,194,168,0.3)'}`,
            borderRadius: '12px', padding: '40px',
            textAlign: 'center', marginBottom: '28px',
            background: dragOver ? 'rgba(0,194,168,0.05)' : 'rgba(13,31,60,0.5)',
            transition: 'all 0.2s', cursor: 'pointer',
          }}
          onClick={() => document.getElementById('lab-file-input').click()}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📁</div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Outfit, sans-serif', fontSize: '15px', margin: '0 0 16px' }}>
            {uploading ? t.uploading : 'Drag & drop or click to upload'}
          </p>
          <button
            style={{
              background: 'linear-gradient(135deg, #00C2A8, #00A891)',
              border: 'none', borderRadius: '8px',
              padding: '10px 24px', color: '#0A1628',
              fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '14px',
              cursor: 'pointer', opacity: uploading ? 0.6 : 1,
            }}
          >{uploading ? t.uploading : t.uploadLab}</button>
          <input
            id="lab-file-input" type="file"
            accept=".pdf,.jpg,.jpeg,.png,.heic"
            style={{ display: 'none' }}
            onChange={e => e.target.files[0] && handleUpload(e.target.files[0])}
          />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'Outfit, sans-serif', marginTop: '10px' }}>
            PDF, JPG, PNG, HEIC
          </p>
        </div>

        {/* Files Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div style={{ width: '32px', height: '32px', border: '2px solid rgba(0,194,168,0.2)', borderTop: '2px solid #00C2A8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit, sans-serif' }}>
            {t.noLabs}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {files.map((file, i) => (
              <a
                key={i}
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: 'rgba(13,31,60,0.8)', border: '1px solid rgba(0,194,168,0.15)',
                  borderRadius: '10px', padding: '16px', cursor: 'pointer',
                  transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '10px',
                }}>
                  <div style={{
                    height: '80px', borderRadius: '6px', overflow: 'hidden',
                    background: 'rgba(0,194,168,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isPDF(file.file_url) ? (
                      <span style={{ fontSize: '36px' }}>📄</span>
                    ) : (
                      <img src={file.file_url} alt={file.file_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div>
                    <p style={{ color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '13px', margin: '0 0 4px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.file_name}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit, sans-serif', fontSize: '11px', margin: 0 }}>
                      {new Date(file.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
