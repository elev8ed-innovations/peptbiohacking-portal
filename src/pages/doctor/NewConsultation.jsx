import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../context/LanguageContext'

const COMMON_PEPTIDES = [
  'BPC-157', 'TB-500', 'Semaglutide', 'Tirzepatide', 'CJC-1295',
  'Ipamorelin', 'AOD-9604', 'PT-141', 'Sermorelin', 'GHK-Cu',
  'Epithalon', 'Selank', 'Semax', 'SS-31', 'MOTS-c',
  'Retatrutide',
]

const inp = {
  width: '100%', padding: '11px 14px',
  background: '#fff', border: '1px solid #E5E5E5',
  borderRadius: '10px', color: '#2A2A2A',
  fontFamily: 'Outfit, sans-serif', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box', minHeight: '44px',
}

export default function NewConsultation() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useLang()
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(searchParams.get('patient_id') || '')
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [notes, setNotes] = useState('')
  const [protocol, setProtocol] = useState([{ name: '', dose: '', frequency: '' }])
  const [photos, setPhotos] = useState([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [doctorId, setDoctorId] = useState(null)

  const appointmentId = searchParams.get('appointment_id')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setDoctorId(user.id)
      const { data } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'patient')
      setPatients(data || [])

      // Pre-fill from appointment if provided
      if (appointmentId) {
        const { data: appt } = await supabase.from('appointments').select('*').eq('id', appointmentId).single()
        if (appt) {
          if (appt.patient_id) setSelectedPatient(appt.patient_id)
          if (appt.intake_data?.chief_complaint) setChiefComplaint(appt.intake_data.chief_complaint)
        }
      }
    }
    load()
  }, [appointmentId])

  const addPeptide = () => setProtocol(p => [...p, { name: '', dose: '', frequency: '' }])
  const removePeptide = (i) => setProtocol(p => p.filter((_, idx) => idx !== i))
  const updatePeptide = (i, field, val) => setProtocol(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const handlePhotoUpload = async (files) => {
    if (!selectedPatient) {
      setSaveError('Select a patient first before uploading files.')
      return
    }
    const uploaded = []
    for (const file of files) {
      const fileName = `${selectedPatient}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('lab-uploads').upload(fileName, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('lab-uploads').getPublicUrl(fileName)
        uploaded.push(publicUrl)
      }
    }
    setPhotos(prev => [...prev, ...uploaded])
  }

  const save = async () => {
    if (!selectedPatient || !chiefComplaint) return
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)

    const { error } = await supabase.from('consultations').insert({
      doctor_id: doctorId,
      patient_id: selectedPatient,
      chief_complaint: chiefComplaint,
      notes,
      peptide_protocol: protocol.filter(p => p.name),
      photos,
      appointment_id: appointmentId || null,
    })

    setSaving(false)

    if (error) {
      console.error('Save consultation error:', error)
      setSaveError(error.message || 'Error al guardar la consulta. Intente de nuevo.')
      return
    }

    setSaveSuccess(true)
    setTimeout(() => navigate('/doctor/dashboard'), 800)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <Navbar role="doctor" />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', marginBottom: '8px' }}>Doctor</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '38px', color: '#0A1628', margin: '0 0 8px' }}>
          {t.newConsult}
        </h1>
        <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginBottom: '32px' }} />

        {appointmentId && (
          <div style={{ background: 'rgba(0,194,168,0.06)', border: '1px solid rgba(0,194,168,0.25)', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#00A891' }}>
            📅 Linked to today's appointment
          </div>
        )}

        <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Patient Select */}
          <div>
            <label style={{ display: 'block', color: '#2A2A2A', opacity: 0.7, fontFamily: 'Outfit, sans-serif', fontSize: '13px', marginBottom: '8px' }}>Patient</label>
            <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option value="">Select patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>)}
            </select>
          </div>

          {/* Chief Complaint */}
          <div>
            <label style={{ display: 'block', color: '#2A2A2A', opacity: 0.7, fontFamily: 'Outfit, sans-serif', fontSize: '13px', marginBottom: '8px' }}>Chief Complaint / Motivo de consulta</label>
            <textarea value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)} rows={3} style={{ ...inp, resize: 'vertical', minHeight: '80px' }} />
          </div>

          {/* Peptide Protocol */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ color: '#2A2A2A', opacity: 0.7, fontFamily: 'Outfit, sans-serif', fontSize: '13px' }}>Peptide Protocol</label>
              <button onClick={addPeptide} style={{
                background: 'rgba(0,194,168,0.08)', border: '1px solid rgba(0,194,168,0.3)',
                borderRadius: '8px', padding: '6px 14px', minHeight: '36px',
                color: '#00A891', fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}>+ Add</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {protocol.map((p, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                  <select value={p.name} onChange={e => updatePeptide(i, 'name', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">Select peptide...</option>
                    {COMMON_PEPTIDES.map(name => <option key={name} value={name}>{name}</option>)}
                    <option value="custom">Custom...</option>
                  </select>
                  {p.name === 'custom' ? (
                    <input placeholder="Name" onChange={e => updatePeptide(i, 'name', e.target.value)} style={inp} />
                  ) : (
                    <input placeholder="Dose (e.g. 250mcg)" value={p.dose} onChange={e => updatePeptide(i, 'dose', e.target.value)} style={inp} />
                  )}
                  <input placeholder="Frequency" value={p.frequency} onChange={e => updatePeptide(i, 'frequency', e.target.value)} style={inp} />
                  <button onClick={() => removePeptide(i)} style={{ background: 'none', border: 'none', color: 'rgba(200,50,50,0.6)', cursor: 'pointer', fontSize: '20px', padding: '0 4px', lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', color: '#2A2A2A', opacity: 0.7, fontFamily: 'Outfit, sans-serif', fontSize: '13px', marginBottom: '8px' }}>Clinical Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} style={{ ...inp, resize: 'vertical', minHeight: '100px' }} />
          </div>

          {/* Photos */}
          <div>
            <label style={{ display: 'block', color: '#2A2A2A', opacity: 0.7, fontFamily: 'Outfit, sans-serif', fontSize: '13px', marginBottom: '8px' }}>Photos / Attachments</label>
            <input type="file" multiple accept="image/*,.pdf" onChange={e => handlePhotoUpload(Array.from(e.target.files))}
              style={{ color: '#2A2A2A', opacity: 0.7, fontFamily: 'Outfit, sans-serif', fontSize: '13px' }} />
            {photos.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                {photos.map((url, i) => <img key={i} src={url} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #E5E5E5' }} />)}
              </div>
            )}
          </div>

          {saveError && (
            <div style={{
              padding: '12px 16px', background: 'rgba(200,50,50,0.08)',
              border: '1px solid rgba(200,50,50,0.25)', borderRadius: '10px',
              color: '#CC3333', fontFamily: 'Outfit, sans-serif', fontSize: '13px',
            }}>
              ❌ {saveError}
            </div>
          )}

          {saveSuccess && (
            <div style={{
              padding: '12px 16px', background: 'rgba(0,194,168,0.08)',
              border: '1px solid rgba(0,194,168,0.25)', borderRadius: '10px',
              color: '#00A891', fontFamily: 'Outfit, sans-serif', fontSize: '13px',
            }}>
              ✅ Consulta guardada con éxito. Redirigiendo...
            </div>
          )}

          <button
            onClick={save}
            disabled={saving || !selectedPatient || !chiefComplaint}
            style={{
              padding: '15px', minHeight: '50px',
              background: '#0A1628',
              border: 'none', borderRadius: '12px', color: '#fff',
              fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
              opacity: (saving || !selectedPatient || !chiefComplaint) ? 0.45 : 1,
            }}
          >{saving ? '...' : t.save}</button>
        </div>
      </div>
    </div>
  )
}
