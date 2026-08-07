import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../context/LanguageContext'
import ProgressDashboard from '../../components/ProgressDashboard'
import ConsultationHistory from '../../components/ConsultationHistory'
import { calculateBmi, isPlausibleBmi, toNumber, validateBodyMetricInput } from '../../lib/healthMetrics'

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useLang()
  const [patient, setPatient] = useState(null)
  const requestedTab = searchParams.get('tab')
  const [tab, setTab] = useState(['messages', 'labs', 'body_metrics', 'consultations'].includes(requestedTab) ? requestedTab : 'messages')
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [labs, setLabs] = useState([])
  const [consults, setConsults] = useState([])
  const [consultLoading, setConsultLoading] = useState(true)
  const [consultError, setConsultError] = useState('')
  const [bodyMetrics, setBodyMetrics] = useState([])
  const [checkins, setCheckins] = useState([])
  const [bmLoading, setBmLoading] = useState(false)
  const [bmForm, setBmForm] = useState({
    weight_kg: '',
    height_cm: '',
    body_fat_pct: '',
    bmi: '',
    bmi_override: false,
    bmi_override_reason: '',
    muscle_kg: '',
    waist_cm: '',
    notes: ''
  })
  const [bmSaving, setBmSaving] = useState(false)
  const [bmError, setBmError] = useState('')
  const [bmConsultationId, setBmConsultationId] = useState('')
  const [doctorId, setDoctorId] = useState(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const refreshConsultations = async () => {
    setConsultLoading(true)
    setConsultError('')
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: false })
    setConsults(data || [])
    setConsultError(error?.message || '')
    setConsultLoading(false)
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setDoctorId(user.id)

      const [{ data: prof }, { data: msgs }, { data: labData }, consultResult, { data: checkinData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('messages').select('*')
          .or(`sender_id.eq.${id},receiver_id.eq.${id}`)
          .order('created_at', { ascending: true }),
        supabase.storage.from('lab-uploads').list(id, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } }),
        supabase.from('consultations').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
        supabase.from('wellness_checkins').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
      ])

      setPatient(prof)
      setMessages(msgs || [])

      // Medical documents live in a private bucket. Generate short-lived URLs
      // after the doctor's authenticated list request succeeds.
      const labsWithUrls = await Promise.all(
        (labData || []).map(async (f) => {
          const path = `${id}/${f.name}`
          const { data: signed, error: signedUrlError } = await supabase.storage
            .from('lab-uploads')
            .createSignedUrl(path, 3600)
          return {
            file_name: f.name,
            uploaded_at: f.created_at,
            displayUrl: signedUrlError ? '' : (signed?.signedUrl || ''),
          }
        })
      )
      setLabs(labsWithUrls)
      setConsults(consultResult.data || [])
      setConsultError(consultResult.error?.message || '')
      setConsultLoading(false)
      setCheckins(checkinData || [])
      if (user) {
        const { data: bm } = await supabase
          .from('body_metrics')
          .select('*')
          .eq('patient_id', id)
          .order('recorded_at', { ascending: false })
        setBodyMetrics(bm || [])
        if (bm?.[0]?.height_cm) setBmForm(form => ({ ...form, height_cm: bm[0].height_cm }))
      }
    }
    load()
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleBodyMetricSubmit = async () => {
    if (bmSaving) return
    const validationError = validateBodyMetricInput(bmForm)
    if (validationError) { setBmError(validationError); return }
    const payload = {}
    let hasValue = false
    const numericFields = ['weight_kg', 'height_cm', 'body_fat_pct', 'muscle_kg', 'waist_cm']
    numericFields.forEach(k => {
      const v = parseFloat(bmForm[k])
      if (!isNaN(v)) { payload[k] = v; hasValue = true }
    })
    const calculatedBmi = calculateBmi(bmForm.weight_kg, bmForm.height_cm)
    if (bmForm.bmi_override) {
      payload.bmi = toNumber(bmForm.bmi)
      payload.bmi_override = true
      payload.bmi_override_reason = bmForm.bmi_override_reason.trim()
      hasValue = true
    } else if (calculatedBmi !== null) {
      payload.bmi = calculatedBmi
      payload.bmi_override = false
    }
    if (bmForm.notes.trim()) { payload.notes = bmForm.notes.trim(); hasValue = true }
    if (!hasValue) {
      setBmError('Ingresa al menos una medición antes de guardar.')
      return
    }
    setBmError('')
    setBmSaving(true)
    const { data, error } = await supabase.from('body_metrics').insert({
      patient_id: id,
      recorded_by: doctorId,
      consultation_id: bmConsultationId || null,
      ...payload
    }).select()
    if (!error) {
      setBodyMetrics(prev => [...(data || []), ...prev])
      setBmForm(form => ({ weight_kg: '', height_cm: form.height_cm, body_fat_pct: '', bmi: '', bmi_override: false, bmi_override_reason: '', muscle_kg: '', waist_cm: '', notes: '' }))
      setBmConsultationId('')
    } else {
      setBmError(error.message || 'No se pudo guardar la medición.')
    }
    setBmSaving(false)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return
    setSending(true)
    await supabase.from('messages').insert({
      sender_id: doctorId,
      receiver_id: id,
      content: newMessage.trim(),
    })
    setNewMessage('')
    setSending(false)
    const { data, error } = await supabase.from('messages')
      .select('*')
      .or(`sender_id.eq.${id},receiver_id.eq.${id}`)
      .order('created_at', { ascending: true })
    if (!error) setMessages(data || [])
  }

  const tabs = ['messages', 'labs', 'body_metrics', 'consultations']

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <Navbar role="doctor" />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <button
            onClick={() => navigate('/doctor/dashboard')}
            style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '10px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A1628', cursor: 'pointer', fontSize: '18px', flexShrink: 0 }}
          >←</button>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #00C2A8, #C9A84C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: '#0A1628', fontWeight: 700,
          }}>{patient?.full_name?.[0] || 'P'}</div>
          <div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: '#0A1628', margin: 0 }}>
              {patient?.full_name || 'Patient'}
            </h1>
            <div style={{ color: '#2A2A2A', opacity: 0.4, fontFamily: 'Outfit, sans-serif', fontSize: '13px' }}>{patient?.email}</div>
          </div>
        </div>

        {/* Tabs — scrollable on mobile */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
          {tabs.map(tab_ => (
            <button
              key={tab_}
              onClick={() => setTab(tab_)}
              style={{
                padding: '9px 20px', minHeight: '40px', whiteSpace: 'nowrap',
                borderRadius: '10px', flexShrink: 0,
                background: tab === tab_ ? '#0A1628' : '#fff',
                border: tab === tab_ ? 'none' : '1px solid #E5E5E5',
                color: tab === tab_ ? '#fff' : '#2A2A2A',
                fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {tab_ === 'messages' ? t.messages : tab_ === 'labs' ? t.labs : tab_ === 'body_metrics' ? (t.progress || 'Progreso') : t.consultations}
            </button>
          ))}
        </div>

        {/* Messages Tab */}
        {tab === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              background: '#fff', border: '1px solid #E5E5E5',
              borderRadius: '16px', padding: '20px', minHeight: '400px', maxHeight: '500px',
              overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              {messages.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <p style={{ color: '#2A2A2A', opacity: 0.4, fontFamily: 'Outfit, sans-serif' }}>{t.noMessages}</p>
                </div>
              ) : messages.map((msg, i) => {
                const isDoctor = msg.sender_id === doctorId
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: isDoctor ? 'row-reverse' : 'row', gap: '10px', alignItems: 'flex-end' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      background: isDoctor ? '#C9A84C' : '#0A1628',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 700, color: '#fff',
                    }}>{isDoctor ? 'Dr' : (patient?.full_name?.[0] || 'P')}</div>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px',
                      borderRadius: isDoctor ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isDoctor ? '#00C2A8' : '#FAF7F2',
                      border: isDoctor ? 'none' : '1px solid #E5E5E5',
                    }}>
                      <p style={{ color: isDoctor ? '#fff' : '#2A2A2A', fontFamily: 'Outfit, sans-serif', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>{msg.content}</p>
                      <div style={{ fontSize: '11px', color: isDoctor ? 'rgba(255,255,255,0.6)' : 'rgba(42,42,42,0.35)', marginTop: '4px', textAlign: isDoctor ? 'right' : 'left' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={t.messagePlaceholder}
                style={{
                  flex: 1, padding: '12px 16px', minHeight: '48px',
                  background: '#fff', border: '1px solid #E5E5E5',
                  borderRadius: '12px', color: '#2A2A2A',
                  fontFamily: 'Outfit, sans-serif', fontSize: '14px', outline: 'none',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                style={{
                  padding: '12px 24px', minHeight: '48px',
                  background: '#0A1628', border: 'none',
                  borderRadius: '12px', color: '#fff',
                  fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                  opacity: sending || !newMessage.trim() ? 0.45 : 1,
                }}
              >{t.send}</button>
            </div>
          </div>
        )}

        {/* Labs Tab */}
        {tab === 'labs' && (
          <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            {labs.length === 0 ? (
              <p style={{ color: '#2A2A2A', opacity: 0.4, fontFamily: 'Outfit, sans-serif', textAlign: 'center', padding: '40px 0' }}>{t.noLabs}</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
                {labs.map((file, i) => (
                  <a key={i} href={file.displayUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <div style={{ background: '#FAF7F2', border: '1px solid #E5E5E5', borderRadius: '10px', padding: '14px', cursor: 'pointer' }}>
                      <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', borderRadius: '6px', overflow: 'hidden', background: '#F5F5F0' }}>
                        {file.file_name?.toLowerCase().endsWith('.pdf')
                          ? <span style={{ fontSize: '32px' }}>📄</span>
                          : <img src={file.displayUrl} alt={file.file_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        }
                      </div>
                      <p style={{ color: '#0A1628', fontFamily: 'Outfit, sans-serif', fontSize: '12px', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{file.file_name}</p>
                      <p style={{ color: '#2A2A2A', opacity: 0.4, fontSize: '11px', fontFamily: 'Outfit, sans-serif', margin: 0 }}>{new Date(file.uploaded_at).toLocaleDateString()}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Body Metrics Tab */}
        {tab === 'body_metrics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <ProgressDashboard bodyMetrics={bodyMetrics} checkins={checkins} role="doctor" />
            {/* Input Form */}
            <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: '#0A1628', margin: '0 0 4px' }}>
                {'Registrar Metricas Corporales'}
              </h3>
              <p style={{ color: '#2A2A2A', opacity: 0.45, fontFamily: 'Outfit, sans-serif', fontSize: '13px', margin: '0 0 20px' }}>
                {'Ingresa las mediciones del paciente durante esta consulta'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                {[
                  { key: 'weight_kg', label: 'Peso', unit: 'kg', placeholder: '70.0' },
                  { key: 'height_cm', label: 'Estatura', unit: 'cm', placeholder: '170' },
                  { key: 'body_fat_pct', label: 'Grasa Corporal', unit: '%', placeholder: '15.0' },
                  { key: 'muscle_kg', label: 'Masa Muscular', unit: 'kg', placeholder: '35.0' },
                  { key: 'waist_cm', label: 'Cintura', unit: 'cm', placeholder: '80' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0A1628', marginBottom: '6px', fontFamily: 'Outfit, sans-serif' }}>
                      {f.label}{f.unit ? <span style={{ opacity: 0.4, marginLeft: '4px' }}>({f.unit})</span> : ''}
                    </label>
                    <input
                      type="number" step="0.1"
                      value={bmForm[f.key]}
                      onChange={e => setBmForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{
                        width: '100%', padding: '10px 12px', minHeight: '44px',
                        background: '#FAF7F2', border: '1px solid #E5E5E5',
                        borderRadius: '10px', color: '#0A1628',
                        fontFamily: 'Outfit, sans-serif', fontSize: '14px', outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '16px', padding: '14px', background: 'rgba(0,194,168,.05)', border: '1px solid rgba(0,194,168,.18)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#2A2A2A', opacity: .5, textTransform: 'uppercase', letterSpacing: '.08em' }}>IMC calculado</div>
                    <strong style={{ color: '#0A1628', fontSize: '22px' }}>{calculateBmi(bmForm.weight_kg, bmForm.height_cm) ?? '—'}</strong>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#0A1628', cursor: 'pointer' }}>
                    <input type="checkbox" checked={bmForm.bmi_override} onChange={e => setBmForm(form => ({ ...form, bmi_override: e.target.checked, bmi: '', bmi_override_reason: '' }))} style={{ accentColor: '#C9A84C' }} />
                    Ajuste médico manual
                  </label>
                </div>
                {bmForm.bmi_override && (
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', marginTop: '12px' }}>
                    <input type="number" step="0.1" placeholder="IMC" value={bmForm.bmi} onChange={e => setBmForm(form => ({ ...form, bmi: e.target.value }))} style={{ padding: '10px 12px', border: '1px solid #E5E5E5', borderRadius: '8px' }} />
                    <input placeholder="Motivo clínico obligatorio" value={bmForm.bmi_override_reason} onChange={e => setBmForm(form => ({ ...form, bmi_override_reason: e.target.value }))} style={{ padding: '10px 12px', border: '1px solid #E5E5E5', borderRadius: '8px' }} />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0A1628', marginBottom: '6px', fontFamily: 'Outfit, sans-serif' }}>
                  {'Vincular a consulta (opcional)'}
                </label>
                <select
                  value={bmConsultationId}
                  onChange={e => setBmConsultationId(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', minHeight: '44px',
                    background: '#FAF7F2', border: '1px solid #E5E5E5',
                    borderRadius: '10px', color: '#0A1628',
                    fontFamily: 'Outfit, sans-serif', fontSize: '14px', outline: 'none',
                  }}
                >
                  <option value="">Sin vínculo — solo progreso</option>
                  {consults.filter(c => c.status !== 'voided').map(c => (
                    <option key={c.id} value={c.id}>
                      {new Date(c.created_at).toLocaleDateString('es-MX')} — {c.chief_complaint || 'Consulta clínica'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0A1628', marginBottom: '6px', fontFamily: 'Outfit, sans-serif' }}>
                  {'Notas (opcional)'}
                </label>
                <textarea
                  value={bmForm.notes}
                  onChange={e => setBmForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder={'Notas adicionales sobre las mediciones...'}
                  rows="2"
                  style={{
                    width: '100%', padding: '10px 12px', minHeight: '44px',
                    background: '#FAF7F2', border: '1px solid #E5E5E5',
                    borderRadius: '10px', color: '#0A1628',
                    fontFamily: 'Outfit, sans-serif', fontSize: '14px', outline: 'none', resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {bmError && (
                <p style={{ color: '#e53e3e', fontSize: '13px', fontFamily: 'Outfit, sans-serif', marginBottom: '12px' }}>
                  {bmError}
                </p>
              )}
              <button
                onClick={handleBodyMetricSubmit}
                disabled={bmSaving}
                style={{
                  padding: '12px 28px', minHeight: '48px',
                  background: 'linear-gradient(135deg, #00C2A8, #2A7C6F)',
                  border: 'none', borderRadius: '12px',
                  color: '#fff', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '14px',
                  cursor: 'pointer', opacity: bmSaving ? 0.45 : 1,
                }}
              >{bmSaving ? 'Guardando...' : 'Guardar Mediciones'}</button>
            </div>

            {/* History */}
            <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #F0EFEA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', color: '#0A1628', margin: 0 }}>
                  {'Historial de Mediciones'}
                </h3>
                <span style={{ fontSize: '12px', color: '#2A2A2A', opacity: 0.4, fontFamily: 'Outfit, sans-serif' }}>
                  {bodyMetrics.length} {bodyMetrics.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>
              {bodyMetrics.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <p style={{ color: '#2A2A2A', opacity: 0.4, fontFamily: 'Outfit, sans-serif', fontSize: '14px', margin: 0 }}>
                    {'Aun no hay mediciones registradas'}
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E5E5E5' }}>
                        <th style={{ padding: '10px 16px', textAlign: 'left', color: '#2A2A2A', opacity: 0.45, fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>{'Fecha'}</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right', color: '#2A2A2A', opacity: 0.45, fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>{'Peso'}</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right', color: '#2A2A2A', opacity: 0.45, fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>{'Estatura'}</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right', color: '#2A2A2A', opacity: 0.45, fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>{'Grasa'}</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right', color: '#2A2A2A', opacity: 0.45, fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>{'IMC'}</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right', color: '#2A2A2A', opacity: 0.45, fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>{'Musculo'}</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right', color: '#2A2A2A', opacity: 0.45, fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>{'Cintura'}</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right', color: '#2A2A2A', opacity: 0.45, fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>{'Notas'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bodyMetrics.map((m, i) => (
                        <tr key={m.id} style={{ borderBottom: i < bodyMetrics.length - 1 ? '1px solid #F5F4F0' : 'none' }}>
                          <td style={{ padding: '10px 16px', color: '#0A1628', fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif' }}>
                            {new Date(m.recorded_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'Outfit, sans-serif' }}>
                            <span style={{ fontWeight: 600 }}>{m.weight_kg ?? '--'}</span>
                            {m.weight_kg != null && <span style={{ color: '#2A2A2A', opacity: 0.4, marginLeft: '2px' }}>kg</span>}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'Outfit, sans-serif' }}>
                            <span style={{ fontWeight: 600 }}>{m.height_cm ?? '--'}</span>
                            {m.height_cm != null && <span style={{ color: '#2A2A2A', opacity: 0.4, marginLeft: '2px' }}>cm</span>}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'Outfit, sans-serif' }}>
                            <span style={{ fontWeight: 600 }}>{m.body_fat_pct ?? '--'}</span>
                            {m.body_fat_pct != null && <span style={{ color: '#2A2A2A', opacity: 0.4, marginLeft: '2px' }}>%</span>}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'Outfit, sans-serif' }}>
                            <span style={{ fontWeight: 600, color: m.bmi != null && !isPlausibleBmi(m.bmi, m.bmi_override) ? '#b45309' : 'inherit' }}>{m.bmi ?? '--'}</span>
                            {m.bmi_override && <span title={m.bmi_override_reason || ''} style={{ color: '#C9A84C', marginLeft: '4px' }}>†</span>}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'Outfit, sans-serif' }}>
                            <span style={{ fontWeight: 600 }}>{m.muscle_kg ?? '--'}</span>
                            {m.muscle_kg != null && <span style={{ color: '#2A2A2A', opacity: 0.4, marginLeft: '2px' }}>kg</span>}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'Outfit, sans-serif' }}>
                            <span style={{ fontWeight: 600 }}>{m.waist_cm ?? '--'}</span>
                            {m.waist_cm != null && <span style={{ color: '#2A2A2A', opacity: 0.4, marginLeft: '2px' }}>cm</span>}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: '#2A2A2A', opacity: 0.5, fontFamily: 'Outfit, sans-serif', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.notes || '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Consultations Tab */}
        {tab === 'consultations' && (
          <ConsultationHistory
            patientId={id}
            consultations={consults}
            bodyMetrics={bodyMetrics}
            loading={consultLoading}
            error={consultError}
            initialConsultationId={searchParams.get('consultation')}
            onRefresh={refreshConsultations}
          />
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
