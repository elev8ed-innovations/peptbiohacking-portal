import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export default function PatientDetail({ profile }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [consultations, setConsultations] = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [pRes, cRes, wRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('consultations').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
        supabase.from('wellness_checkins').select('*').eq('patient_id', id).order('created_at', { ascending: false }).limit(7),
      ])
      setPatient(pRes.data)
      setConsultations(cRes.data || [])
      setCheckins(wRes.data || [])
      setLoading(false)
    }
    load()
  }, [id])

  const WA_NUMBER = '526624242441'

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen">
      <Navbar profile={profile} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/doctor')} className="text-white/40 hover:text-white">←</button>
          <div>
            <h1 className="font-display text-3xl text-white">{patient?.full_name || 'Paciente'}</h1>
            <p className="text-white/40 text-sm">{patient?.email}</p>
          </div>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=Hola, soy el Dr. Valenzuela. Te contacto sobre tu protocolo.`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto btn-secondary text-sm"
          >
            WhatsApp
          </a>
        </div>

        {/* Wellness Check-ins */}
        {checkins.length > 0 && (
          <div className="card mb-6">
            <h2 className="font-display text-xl text-gold mb-4">Check-ins Recientes</h2>
            <div className="grid grid-cols-7 gap-1">
              {checkins.map(c => (
                <div key={c.id} className="text-center">
                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold ${
                    c.energy_level >= 7 ? 'bg-teal text-navy' : c.energy_level >= 4 ? 'bg-gold text-navy' : 'bg-red-500/30 text-white'
                  }`}>
                    {c.energy_level}
                  </div>
                  <div className="text-white/30 text-xs mt-1">{new Date(c.created_at).toLocaleDateString('es-MX', { weekday: 'short' })}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consultations */}
        <h2 className="font-display text-xl text-white mb-4">Consultas</h2>
        {consultations.length === 0 ? (
          <div className="card text-center text-white/30 py-8">Sin consultas registradas.</div>
        ) : (
          <div className="space-y-4">
            {consultations.map(c => (
              <div key={c.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gold text-sm font-medium">{new Date(c.created_at).toLocaleDateString('es-MX')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-teal/20 text-teal' : 'bg-white/10 text-white/40'}`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-white/80 text-sm mb-2">{c.chief_complaint}</p>
                {c.peptide_protocol?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {c.peptide_protocol.map(p => (
                      <span key={p.id} className="text-xs bg-teal/10 text-teal px-2 py-0.5 rounded-full">
                        {p.name} {p.dose}{p.unit}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
