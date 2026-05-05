import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

function Slider({ label, value, onChange, emoji }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/70 text-sm">{emoji} {label}</span>
        <span className="font-display text-2xl text-teal">{value}</span>
      </div>
      <input
        type="range" min="1" max="10" value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-teal"
      />
      <div className="flex justify-between text-white/20 text-xs mt-1"><span>1</span><span>10</span></div>
    </div>
  )
}

export default function WellnessCheckin({ profile }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ energy_level: 5, sleep_quality: 5, overall_feeling: 5, notes: '' })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  function set(field, val) { setForm(f => ({ ...f, [field]: val })) }

  async function handleSubmit() {
    setSaving(true)
    await supabase.from('wellness_checkins').insert({
      patient_id: profile.id,
      energy_level: form.energy_level,
      sleep_quality: form.sleep_quality,
      overall_feeling: form.overall_feeling,
      notes: form.notes,
    })
    setSaving(false)
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card text-center max-w-sm w-full">
        <div className="text-5xl mb-4">🎯</div>
        <h2 className="font-display text-2xl text-gold mb-2">¡Check-in registrado!</h2>
        <p className="text-white/50 text-sm mb-6">Tu bienestar de hoy ha sido guardado.</p>
        <button onClick={() => navigate('/patient')} className="btn-primary w-full">Volver al inicio</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <Navbar profile={profile} />
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/patient')} className="text-white/40 hover:text-white">←</button>
          <h1 className="font-display text-3xl text-white">Check-in Diario</h1>
        </div>

        <div className="space-y-4">
          <Slider label="Nivel de Energía" emoji="⚡" value={form.energy_level} onChange={v => set('energy_level', v)} />
          <Slider label="Calidad del Sueño" emoji="🌙" value={form.sleep_quality} onChange={v => set('sleep_quality', v)} />
          <Slider label="Bienestar General" emoji="💚" value={form.overall_feeling} onChange={v => set('overall_feeling', v)} />

          <div className="card">
            <label className="text-white/50 text-sm mb-2 block">📝 Notas del día (opcional)</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="input-field h-20 resize-none"
              placeholder="¿Cómo te sentiste hoy? ¿Algo notable?"
            />
          </div>

          <button onClick={handleSubmit} disabled={saving} className="w-full btn-primary">
            {saving ? 'Guardando...' : '✓ Guardar Check-in'}
          </button>
        </div>
      </div>
    </div>
  )
}
