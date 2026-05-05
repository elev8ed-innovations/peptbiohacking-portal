import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import ProtocolBuilder from '../../components/ProtocolBuilder'

export default function NewConsultation({ profile }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    patient_email: '',
    chief_complaint: '',
    goals: '',
    health_history: '',
    current_meds: '',
    peptide_protocol: [],
    notes: '',
    follow_up_date: '',
    photos: [],
  })

  function set(field, val) { setForm(f => ({ ...f, [field]: val })) }

  async function handleSubmit() {
    setSaving(true)
    // Find patient by email
    const { data: patient } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', form.patient_email)
      .single()

    const payload = {
      doctor_id: profile.id,
      patient_id: patient?.id || null,
      patient_email: form.patient_email,
      chief_complaint: form.chief_complaint,
      goals: form.goals,
      health_history: form.health_history,
      current_meds: form.current_meds,
      peptide_protocol: form.peptide_protocol,
      notes: form.notes,
      follow_up_date: form.follow_up_date || null,
      status: 'active',
    }

    const { error } = await supabase.from('consultations').insert(payload)
    setSaving(false)
    if (!error) navigate('/doctor')
  }

  return (
    <div className="min-h-screen">
      <Navbar profile={profile} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/doctor')} className="text-white/40 hover:text-white">←</button>
          <h1 className="font-display text-3xl text-white">Nueva Consulta</h1>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${step >= s ? 'bg-teal' : 'bg-white/10'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="card space-y-4">
            <h2 className="font-display text-xl text-gold">Datos del Paciente</h2>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Email del paciente</label>
              <input value={form.patient_email} onChange={e => set('patient_email', e.target.value)} type="email" className="input-field" placeholder="paciente@email.com" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Motivo de consulta</label>
              <textarea value={form.chief_complaint} onChange={e => set('chief_complaint', e.target.value)} className="input-field h-24 resize-none" placeholder="Describe el motivo principal..." />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Objetivos del paciente</label>
              <textarea value={form.goals} onChange={e => set('goals', e.target.value)} className="input-field h-24 resize-none" placeholder="Pérdida de peso, recuperación, anti-aging..." />
            </div>
            <button onClick={() => setStep(2)} className="w-full btn-primary">Siguiente →</button>
          </div>
        )}

        {step === 2 && (
          <div className="card space-y-4">
            <h2 className="font-display text-xl text-gold">Historial Médico</h2>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Historial de salud</label>
              <textarea value={form.health_history} onChange={e => set('health_history', e.target.value)} className="input-field h-28 resize-none" placeholder="Condiciones previas, cirugías, alergias..." />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Medicamentos actuales</label>
              <textarea value={form.current_meds} onChange={e => set('current_meds', e.target.value)} className="input-field h-20 resize-none" placeholder="Lista de medicamentos o suplementos actuales..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 btn-secondary">← Atrás</button>
              <button onClick={() => setStep(3)} className="flex-1 btn-primary">Siguiente →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card space-y-4">
            <h2 className="font-display text-xl text-gold">Protocolo de Péptidos</h2>
            <ProtocolBuilder value={form.peptide_protocol} onChange={val => set('peptide_protocol', val)} />
            <div>
              <label className="text-xs text-white/50 mb-1 block">Notas adicionales</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="input-field h-20 resize-none" placeholder="Instrucciones especiales, observaciones..." />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Fecha de seguimiento</label>
              <input value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} type="date" className="input-field" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 btn-secondary">← Atrás</button>
              <button onClick={handleSubmit} disabled={saving} className="flex-1 btn-primary">
                {saving ? 'Guardando...' : '✓ Guardar Consulta'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
