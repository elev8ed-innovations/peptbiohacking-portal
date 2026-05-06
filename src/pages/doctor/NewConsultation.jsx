import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

const PEPTIDES = ['BPC-157', 'TB-500', 'CJC-1295', 'Ipamorelin', 'GHK-Cu', 'Semax', 'Selank', 'PT-141', 'Tirzepatide', 'Semaglutida', 'AOD-9604', 'Hexarelin', 'GHRP-6', 'GHRP-2', 'Tesamorelin']

const GOALS = ['Pérdida de peso', 'Ganancia muscular', 'Recuperación', 'Anti-envejecimiento', 'Energía y rendimiento', 'Salud hormonal', 'Salud cognitiva', 'Bienestar general']

export default function NewConsultation() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    patient_email: '',
    goals: [],
    weight: '',
    age: '',
    notes: '',
    peptides: [],
    dosage_notes: '',
    cycle_weeks: '12',
  })

  const toggleGoal = (g) => setForm(f => ({
    ...f, goals: f.goals.includes(g) ? f.goals.filter(x => x !== g) : [...f.goals, g]
  }))

  const togglePeptide = (p) => setForm(f => ({
    ...f, peptides: f.peptides.includes(p) ? f.peptides.filter(x => x !== p) : [...f.peptides, p]
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()

    // Find or look up patient by email
    const { data: patient } = await supabase.from('profiles').select('id').eq('email', form.patient_email).single()
    if (!patient) { setError('No se encontró un paciente con ese correo.'); setLoading(false); return }

    const { error: err } = await supabase.from('consultations').insert({
      doctor_id: user.id,
      patient_id: patient.id,
      goals: form.goals,
      weight: parseFloat(form.weight),
      age: parseInt(form.age),
      notes: form.notes,
      protocol: { peptides: form.peptides, dosage_notes: form.dosage_notes, cycle_weeks: form.cycle_weeks },
      status: 'active',
    })
    if (err) { setError(err.message); setLoading(false); return }
    navigate('/doctor')
  }

  return (
    <div className="min-h-screen bg-navy">
      <Navbar role="doctor" />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-white font-light">Nueva <span className="text-teal">Consulta</span></h1>
          <p className="text-white/40 mt-1 text-sm">Completa el protocolo para el paciente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient info */}
          <div className="card">
            <h2 className="font-display text-lg text-white mb-4">Datos del paciente</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-white/60 text-xs uppercase tracking-wide mb-1.5">Correo del paciente</label>
                <input type="email" className="input-field" placeholder="paciente@ejemplo.com"
                  value={form.patient_email} onChange={e => setForm({ ...form, patient_email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wide mb-1.5">Edad</label>
                <input type="number" className="input-field" placeholder="35"
                  value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} required />
              </div>
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wide mb-1.5">Peso (kg)</label>
                <input type="number" className="input-field" placeholder="75"
                  value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} required />
              </div>
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wide mb-1.5">Ciclo (semanas)</label>
                <select className="input-field" value={form.cycle_weeks} onChange={e => setForm({ ...form, cycle_weeks: e.target.value })}>
                  {['4','8','12','16','24'].map(w => <option key={w} value={w}>{w} semanas</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="card">
            <h2 className="font-display text-lg text-white mb-4">Objetivos del paciente</h2>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(g => (
                <button key={g} type="button" onClick={() => toggleGoal(g)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all duration-200 ${
                    form.goals.includes(g) ? 'bg-teal/20 border-teal text-teal' : 'border-white/10 text-white/40 hover:border-white/30'
                  }`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Protocol */}
          <div className="card">
            <h2 className="font-display text-lg text-white mb-4">Protocolo de péptidos</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {PEPTIDES.map(p => (
                <button key={p} type="button" onClick={() => togglePeptide(p)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all duration-200 ${
                    form.peptides.includes(p) ? 'bg-gold/20 border-gold text-gold' : 'border-white/10 text-white/40 hover:border-white/30'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wide mb-1.5">Notas de dosificación</label>
              <textarea className="input-field h-24 resize-none" placeholder="Ej: BPC-157 500mcg AM subcutáneo, 5 días ON / 2 días OFF..."
                value={form.dosage_notes} onChange={e => setForm({ ...form, dosage_notes: e.target.value })} />
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <h2 className="font-display text-lg text-white mb-4">Notas clínicas</h2>
            <textarea className="input-field h-32 resize-none" placeholder="Observaciones, condiciones previas, indicaciones especiales..."
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/doctor')} className="btn-outline flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar consulta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
