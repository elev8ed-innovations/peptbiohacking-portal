import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

const metrics = [
  { key: 'energy', label: 'Energía', desc: '¿Cómo estuvo tu nivel de energía hoy?' },
  { key: 'mood', label: 'Ánimo', desc: '¿Cómo estuvo tu estado de ánimo?' },
  { key: 'sleep', label: 'Sueño', desc: '¿Cómo dormiste anoche?' },
  { key: 'recovery', label: 'Recuperación', desc: '¿Cómo se siente tu cuerpo físicamente?' },
]

function Slider({ label, desc, value, onChange }) {
  return (
    <div className="p-5 rounded-xl border border-white/10 bg-navy">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white font-medium text-sm">{label}</p>
          <p className="text-white/40 text-xs mt-0.5">{desc}</p>
        </div>
        <span className="font-display text-2xl text-teal">{value}</span>
      </div>
      <input type="range" min={1} max={10} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full accent-teal cursor-pointer" />
      <div className="flex justify-between text-white/20 text-xs mt-1">
        <span>Muy bajo</span><span>Excelente</span>
      </div>
    </div>
  )
}

export default function WellnessCheckin() {
  const navigate = useNavigate()
  const [values, setValues] = useState({ energy: 7, mood: 7, sleep: 7, recovery: 7 })
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('wellness_checkins').insert({
      patient_id: user.id,
      ...values,
      notes,
    })
    setDone(true)
    setLoading(false)
  }

  if (done) return (
    <div className="min-h-screen bg-navy">
      <Navbar role="patient" />
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-teal/10 border border-teal/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="font-display text-2xl text-white mb-2">¡Check-in registrado!</h2>
        <p className="text-white/40 text-sm mb-6">Tu reporte fue enviado al Dr. Valenzuela.</p>
        <button onClick={() => navigate('/patient')} className="btn-primary">Volver al portal</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-navy">
      <Navbar role="patient" />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-white font-light">Check-in <span className="text-teal">diario</span></h1>
          <p className="text-white/40 mt-1 text-sm">{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {metrics.map(m => (
            <Slider key={m.key} label={m.label} desc={m.desc} value={values[m.key]}
              onChange={v => setValues({ ...values, [m.key]: v })} />
          ))}

          <div className="card">
            <label className="block text-white/60 text-xs uppercase tracking-wide mb-2">Notas adicionales (opcional)</label>
            <textarea className="input-field h-24 resize-none" placeholder="¿Algún síntoma, efecto o comentario para el doctor?"
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Enviando...' : 'Enviar check-in'}
          </button>
        </form>
      </div>
    </div>
  )
}
