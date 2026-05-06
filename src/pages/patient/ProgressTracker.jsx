import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export default function ProgressTracker() {
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('wellness_checkins').select('*')
        .eq('patient_id', user.id).order('created_at', { ascending: false }).limit(30)
      setCheckins(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const avg = (key) => checkins.length ? (checkins.reduce((s, c) => s + (c[key] || 0), 0) / checkins.length).toFixed(1) : '—'

  return (
    <div className="min-h-screen bg-navy">
      <Navbar role="patient" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-white font-light">Mi <span className="text-teal">progreso</span></h1>
          <p className="text-white/40 mt-1 text-sm">Historial de los últimos 30 días</p>
        </div>

        {/* Averages */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Energía', key: 'energy' },
            { label: 'Ánimo', key: 'mood' },
            { label: 'Sueño', key: 'sleep' },
            { label: 'Recuperación', key: 'recovery' },
          ].map(m => (
            <div key={m.key} className="card text-center">
              <p className="font-display text-3xl text-teal">{avg(m.key)}</p>
              <p className="text-white/40 text-xs uppercase tracking-wide mt-1">{m.label}</p>
              <p className="text-white/20 text-xs mt-0.5">promedio</p>
            </div>
          ))}
        </div>

        {/* History list */}
        <div className="card">
          <h2 className="font-display text-xl text-white mb-4">Historial de check-ins</h2>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin" /></div>
          ) : checkins.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">No hay check-ins aún. ¡Completa tu primero hoy!</p>
          ) : (
            <div className="space-y-2">
              {checkins.map(c => (
                <div key={c.id} className="p-4 rounded-xl border border-white/5 bg-navy">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white/60 text-xs">
                      {new Date(c.created_at).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['energy','mood','sleep','recovery'].map(k => (
                      <div key={k} className="text-center">
                        <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
                          <div className="absolute left-0 top-0 h-full bg-teal rounded-full transition-all"
                            style={{ width: `${(c[k] || 0) * 10}%` }} />
                        </div>
                        <p className="text-teal text-xs font-medium">{c[k]}/10</p>
                        <p className="text-white/30 text-xs capitalize">{k === 'energy' ? 'Energía' : k === 'mood' ? 'Ánimo' : k === 'sleep' ? 'Sueño' : 'Recup.'}</p>
                      </div>
                    ))}
                  </div>
                  {c.notes && <p className="text-white/40 text-xs mt-3 border-t border-white/5 pt-3">{c.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
