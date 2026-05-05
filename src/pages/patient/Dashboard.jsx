import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export default function PatientDashboard({ profile }) {
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', profile.id)
        .order('created_at', { ascending: false })
      setConsultations(data || [])
      setLoading(false)
    }
    load()
  }, [profile.id])

  const latest = consultations[0]
  const nav = [
    { label: 'Progreso', icon: '📈', path: '/patient/progreso' },
    { label: 'Check-in', icon: '✅', path: '/patient/checkin' },
    { label: 'Chat', icon: '💬', path: '/patient/chat' },
  ]

  return (
    <div className="min-h-screen">
      <Navbar profile={profile} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-white">Hola, {profile?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-white/40 text-sm mt-1">Tu portal de bienestar</p>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {nav.map(n => (
            <button key={n.path} onClick={() => navigate(n.path)} className="card hover:border-teal/40 text-center py-6 transition-colors">
              <div className="text-3xl mb-2">{n.icon}</div>
              <div className="text-white/70 text-sm">{n.label}</div>
            </button>
          ))}
        </div>

        {/* Active protocol */}
        <h2 className="font-display text-xl text-white mb-4">Tu Protocolo Activo</h2>
        {loading ? (
          <div className="text-white/30 text-sm">Cargando...</div>
        ) : !latest ? (
          <div className="card text-center py-12">
            <p className="text-white/40 text-sm">Aún no tienes un protocolo asignado.</p>
            <p className="text-white/30 text-xs mt-2">El Dr. Valenzuela lo creará después de tu consulta.</p>
          </div>
        ) : (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gold text-sm">Consulta {new Date(latest.created_at).toLocaleDateString('es-MX')}</span>
              <span className="text-xs bg-teal/20 text-teal px-2 py-0.5 rounded-full">Activo</span>
            </div>
            {latest.peptide_protocol?.length > 0 ? (
              <div className="space-y-3">
                {latest.peptide_protocol.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <div className="font-medium text-teal">{p.name}</div>
                      <div className="text-white/40 text-xs">{p.dose}{p.unit} · {p.frequency}</div>
                    </div>
                    <div className="text-white/30 text-xs">{p.duration}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-sm">Protocolo en proceso de configuración.</p>
            )}
            {latest.follow_up_date && (
              <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/40">
                Seguimiento: {new Date(latest.follow_up_date).toLocaleDateString('es-MX')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
