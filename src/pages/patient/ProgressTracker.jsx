import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export default function ProgressTracker({ profile }) {
  const [checkins, setCheckins] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('wellness_checkins')
      .select('*')
      .eq('patient_id', profile.id)
      .order('created_at', { ascending: true })
      .limit(30)
      .then(({ data }) => setCheckins(data || []))
  }, [profile.id])

  const avg = (arr, key) => arr.length ? (arr.reduce((s, i) => s + (i[key] || 0), 0) / arr.length).toFixed(1) : '—'

  return (
    <div className="min-h-screen">
      <Navbar profile={profile} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/patient')} className="text-white/40 hover:text-white">←</button>
          <h1 className="font-display text-3xl text-white">Tu Progreso</h1>
        </div>

        {checkins.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-white/40">Sin datos todavía.</p>
            <p className="text-white/30 text-xs mt-2">Completa tu primer check-in diario.</p>
            <button onClick={() => navigate('/patient/checkin')} className="btn-primary mt-4 text-sm">Hacer Check-in</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Energía Prom.', val: avg(checkins, 'energy_level'), color: 'text-teal' },
                { label: 'Sueño Prom.', val: avg(checkins, 'sleep_quality'), color: 'text-gold' },
                { label: 'Bienestar Prom.', val: avg(checkins, 'overall_feeling'), color: 'text-white' },
              ].map(s => (
                <div key={s.label} className="card text-center">
                  <div className={`font-display text-3xl font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-white/40 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <h2 className="font-display text-xl text-white mb-4">Últimos 30 días</h2>
            <div className="card">
              <div className="space-y-2">
                {[...checkins].reverse().map(c => (
                  <div key={c.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <span className="text-white/40 text-xs w-20">{new Date(c.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}</span>
                    <div className="flex gap-2 flex-1">
                      {[
                        { val: c.energy_level, color: 'bg-teal' },
                        { val: c.sleep_quality, color: 'bg-gold' },
                        { val: c.overall_feeling, color: 'bg-white/40' },
                      ].map((bar, i) => (
                        <div key={i} className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${(bar.val || 0) * 10}%` }} />
                        </div>
                      ))}
                    </div>
                    {c.notes && <span className="text-white/20 text-xs truncate max-w-[80px]">{c.notes}</span>}
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-4 text-xs text-white/30">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal inline-block" /> Energía</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gold inline-block" /> Sueño</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/40 inline-block" /> Bienestar</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
