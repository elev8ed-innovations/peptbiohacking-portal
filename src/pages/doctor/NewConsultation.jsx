import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../context/LanguageContext'

const COMMON_PEPTIDES = [
  'BPC-157', 'TB-500', 'Semaglutide', 'Tirzepatide', 'CJC-1295',
  'Ipamorelin', 'AOD-9604', 'PT-141', 'Sermorelin', 'GHK-Cu',
  'Epithalon', 'Selank', 'Semax', 'SS-31', 'MOTS-c',
]

export default function NewConsultation() {
  const navigate = useNavigate()
  const { t } = useLang()
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [notes, setNotes] = useState('')
  const [protocol, setProtocol] = useState([{ name: '', dose: '', frequency: '' }])
  const [photos, setPhotos] = useState([])
  const [saving, setSaving] = useState(false)
  const [doctorId, setDoctorId] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setDoctorId(user.id)
      const { data } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'patient')
      setPatients(data || [])
    }
    load()
  }, [])

  const addPeptide = () => setProtocol(p => [...p, { name: '', dose: '', frequency: '' }])
  const removePeptide = (i) => setProtocol(p => p.filter((_, idx) => idx !== i))
  const updatePeptide = (i, field, val) => setProtocol(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const handlePhotoUpload = async (files) => {
    const uploaded = []
    for (const file of files) {
      const fileName = `${doctorId}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('consult-photos').upload(fileName, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('consult-photos').getPublicUrl(fileName)
        uploaded.push(publicUrl)
      }
    }
    setPhotos(prev => [...prev, ...uploaded])
  }

  const save = async () => {
    if (!selectedPatient || !chiefComplaint) return
    setSaving(true)
    await supabase.from('consultations').insert({
      doctor_id: doctorId,
      patient_id: selectedPatient,
      chief_complaint: chiefComplaint,
      notes,
      peptide_protocol: protocol.filter(p => p.name),
      photos,
    })
    navigate('/doctor/dashboard')
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,194,168,0.2)',
    borderRadius: '8px', color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628' }}>
      <Navbar role="doctor" />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', color: '#fff', margin: '0 0 8px' }}>
          {t.newConsult}
        </h1>
        <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginBottom: '28px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Patient Select */}
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontFamily: 'Outfit, sans-serif', fontSize: '13px', marginBottom: '8px' }}>Patient</label>
            <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Select patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>)}
            </select>
          </div>

          {/* Chief Complaint */}
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontFamily: 'Outfit, sans-serif', fontSize: '13px', marginBottom: '8px' }}>Chief Complaint / Motivo de consulta</label>
            <textarea value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* Peptide Protocol */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Outfit, sans-serif', fontSize: '13px' }}>Peptide Protocol</label>
              <button onClick={addPeptide} style={{ background: 'rgba(0,194,168,0.1)', border: '1px solid rgba(0,194,168,0.3)', borderRadius: '6px', padding: '5px 12px', color: '#00C2A8', fontFamily: 'Outfit, sans-serif', fontSize: '12px', cursor: 'pointer' }}>+ Add</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {protocol.map((p, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                  <select value={p.name} onChange={e => updatePeptide(i, 'name', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select peptide...</option>
                    {COMMON_PEPTIDES.map(name => <option key={name} value={name}>{name}</option>)}
                    <option value="custom">Custom...</option>
                  </select>
                  {p.name === 'custom' ? (
                    <input placeholder="Name" onChange={e => updatePeptide(i, 'name', e.target.value)} style={inputStyle} />
                  ) : (
                    <input placeholder="Dose (e.g. 250mcg)" value={p.dose} onChange={e => updatePeptide(i, 'dose', e.target.value)} style={inputStyle} />
                  )}
                  <input placeholder="Frequency" value={p.frequency} onChange={e => updatePeptide(i, 'frequency', e.target.value)} style={inputStyle} />
                  <button onClick={() => removePeptide(i)} style={{ background: 'none', border: 'none', color: 'rgba(255,100,100,0.6)', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}>×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontFamily: 'Outfit, sans-serif', fontSize: '13px', marginBottom: '8px' }}>Clinical Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* Photos */}
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontFamily: 'Outfit, sans-serif', fontSize: '13px', marginBottom: '8px' }}>Photos / Attachments</label>
            <input type="file" multiple accept="image/*,.pdf" onChange={e => handlePhotoUpload(Array.from(e.target.files))}
              style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Outfit, sans-serif', fontSize: '13px' }} />
            {photos.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                {photos.map((url, i) => <img key={i} src={url} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />)}
              </div>
            )}
          </div>

          <button
            onClick={save}
            disabled={saving || !selectedPatient || !chiefComplaint}
            style={{
              padding: '14px', background: 'linear-gradient(135deg, #00C2A8, #00A891)',
              border: 'none', borderRadius: '10px', color: '#0A1628',
              fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
              opacity: (saving || !selectedPatient || !chiefComplaint) ? 0.5 : 1,
            }}
          >{saving ? '...' : t.save}</button>
        </div>
      </div>
    </div>
  )
}
