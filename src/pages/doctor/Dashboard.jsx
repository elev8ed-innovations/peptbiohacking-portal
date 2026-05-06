import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export default function DoctorDashboard() {
  const [profile, setProfile] = useState(null)
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)
      const { data: c } = await supabase.from('consultations').select('*, profiles!patient_id(full_name, email)')
        .order('created_at', { ascending: false }).limit(10)
      setConsultations(c || [])
      setLoading(false)
    }
    init()
  }, [])

  const stats = [
    { label: 'Consultas totales', value: consultations.length, color: 'text-teal' },
    { label: 'Este mes', value: consultations.filter(c => new Date(c.created_at).getMonth() === new Date().getMonth()).length, color: 'text-gold' },
    { label: 'Activos', value: consultations.filter(c => c.status === 'active').length, color: 'text-teal' },
  ]

  return (
    <div className="min-h-screen bg-navy">
      <Navbar role="doctor" />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl text-white font-light">
              Bienvenido, <span className="text-teal">Dr. {profile?.full_name?.split(' ')[1] || 'Doctor'}</span>
            </h1>
            <p className="text-white/40 mt-1 text-sm">Panel de control médico · PeptBiohacking</p>
          </div>
          <Link to="/doctor/consulta/nueva" className="btn-primary w-auto px-6 text-sm font-body">
            + Nueva consulta
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="card text-center">
              <p className={`font-display text-4xl font-light ${s.color}`}>{loading ? '—' : s.value}</p>
              <p className="text-white/40 text-xs mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Recent consultations */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl text-white">Consultas recientes</h2>
            <div className="w-8 h-px bg-gold" />
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin" />
            </div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/30 text-sm">No hay consultas aún.</p>
              <Link to="/doctor/consulta/nueva" className="text-teal text-sm hover:underline mt-2 block">
                Crear primera consulta →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {consultations.map(c => (
                <Link key={c.id} to={`/doctor/paciente/${c.patient_id}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/5 hover:border-teal/30 hover:bg-white/5 transition-all duration-200 group">
                  <div>
                    <p className="text-white text-sm font-medium group-hover:text-teal transition-colors">
                      {c.profiles?.full_name || 'Paciente'}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">{c.profiles?.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      c.status === 'active' ? 'border-teal/30 text-teal bg-teal/10' : 'border-white/10 text-white/30'
                    }`}>
                      {c.status === 'active' ? 'Activo' : 'Completado'}
                    </span>
                    <p className="text-white/30 text-xs">
                      {new Date(c.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
