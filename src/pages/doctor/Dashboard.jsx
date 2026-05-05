import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export default function DoctorDashboard({ profile }) {
  const [patients, setPatients] = useState([])
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const [pRes, cRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'patient').order('created_at', { ascending: false }),
        supabase.from('consultations').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(10),
      ])
      setPatients(pRes.data || [])
      setConsultations(cRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const stats = [
    { label: 'Pacientes', value: patients.length, color: 'text-teal' },
    { label: 'Consultas', value: consultations.length, color: 'text-gold' },
    { label: 'Activos Hoy', value: consultations.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length, color: 'text-white' },
  ]

  return (
    <div className="min-h-screen">
      <Navbar profile={profile} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-white">Dashboard</h1>
            <p className="text-white/40 text-sm mt-1">Dr. {profile?.full_name}</p>
          </div>
          <button onClick={() => navigate('/doctor/consulta/nueva')} className="btn-primary text-sm">
            + Nueva Consulta
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="card text-center">
              <div className={`font-display text-4xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-white/50 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <h2 className="font-display text-xl text-white mb-4">Pacientes Recientes</h2>
        {loading ? (
          <div className="text-white/30 text-sm">Cargando...</div>
        ) : patients.length === 0 ? (
          <div className="card text-center text-white/30 py-12">
            <p>Sin pacientes aún.</p>
            <p className="text-xs mt-2">Los pacientes aparecen aquí al registrarse.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {patients.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/doctor/paciente/${p.id}`)}
                className="card hover:border-teal/40 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-white">{p.full_name || 'Sin nombre'}</div>
                  <div className="text-white/40 text-xs">{p.email}</div>
                </div>
                <span className="text-white/20 text-xs">{new Date(p.created_at).toLocaleDateString('es-MX')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
