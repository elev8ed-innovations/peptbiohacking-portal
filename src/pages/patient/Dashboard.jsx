import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export default function PatientDashboard() {
  const [profile, setProfile] = useState(null)
  const [consultation, setConsultation] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)
      const { data: c } = await supabase.from('consultations').select('*').eq('patient_id', user.id)
        .eq('status', 'active').order('created_at', { ascending: false }).limit(1).single()
      setConsultation(c)
      const { data: w } = await supabase.from('wellness_checkins').select('*').eq('patient_id', user.id)
        .order('created_at', { ascending: false }).limit(7)
      setCheckins(w || [])
      setLoading(false)
    }
    init()
  }, [])

  const firstName = profile?.full_name?.split(' ')[0] || 'Paciente'

  const avgMetric = (key) => {
    if (!checkins.length) return '—'
    return (checkins.reduce((s, c) => s + (c[key] || 0), 0) / checkins.length).toFixed(1)
  }

  return (
    <div className="min-h-screen bg-navy">
      <Navbar role="patient" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl text-white font-light">
            Hola, <span className="text-teal">{firstName}</span>
          </h1>
          <p className="text-white/40 mt-1 text-sm">Tu portal de salud · PeptBiohacking</p>
        </div>

        {/* Protocol card */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" /></div>
        ) : consultation ? (
          <div className="card border-teal/20 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-display text-xl text-white">Tu protocolo activo</h2>
                <p className="text-white/40 text-xs mt-0.5">{consultation.protocol?.cycle_weeks} semanas · Dr. Fernando Valenzuela</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-teal/10 border border-teal/30 text-teal">Activo</span>
            </div>

            {consultation.protocol?.peptides?.length > 0 && (
              <div className="mb-4">
                <p className="text-white/40 text-xs uppercase tracking-wide mb-2">Péptidos</p>
                <div className="flex flex-wrap gap-2">
                  {consultation.protocol.peptides.map(p => (
                    <span key={p} className="text-xs px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold">{p}</span>
                  ))}
                </div>
              </div>
            )}

            {consultation.goals?.length > 0 && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-2">Tus objetivos</p>
                <div className="flex flex-wrap gap-2">
                  {consultation.goals.map(g => (
                    <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-teal/5 border border-teal/20 text-teal/80">{g}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card border-dashed border-white/10 text-center py-8 mb-6">
            <p className="text-white/30 text-sm">No tienes un protocolo activo.</p>
            <p className="text-white/20 text-xs mt-1">Agenda una consulta con el Dr. Valenzuela para comenzar.</p>
          </div>
        )}

        {/* Weekly averages */}
        {checkins.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Energía prom.', key: 'energy' },
              { label: 'Ánimo prom.', key: 'mood' },
              { label: 'Sueño prom.', key: 'sleep' },
            ].map(m => (
              <div key={m.key} className="card text-center">
                <p className="font-display text-3xl text-teal">{avgMetric(m.key)}</p>
                <p className="text-white/40 text-xs uppercase tracking-wide mt-1">{m.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { to: '/patient/checkin', icon: '✓', label: 'Check-in diario', desc: 'Registra cómo te sientes hoy' },
            { to: '/patient/progreso', icon: '↗', label: 'Mi progreso', desc: 'Ver historial de bienestar' },
            { to: '/patient/chat', icon: '💬', label: 'Mensajes', desc: 'Contactar al Dr. Valenzuela' },
          ].map(a => (
            <Link key={a.to} to={a.to}
              className="card hover:border-teal/30 hover:bg-white/5 transition-all duration-200 group cursor-pointer">
              <p className="text-2xl mb-3">{a.icon}</p>
              <p className="text-white text-sm font-medium group-hover:text-teal transition-colors">{a.label}</p>
              <p className="text-white/30 text-xs mt-1">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
