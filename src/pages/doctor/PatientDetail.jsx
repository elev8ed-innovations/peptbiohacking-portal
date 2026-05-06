import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [consultations, setConsultations] = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', id).single()
      setPatient(p)
      const { data: c } = await supabase.from('consultations').select('*').eq('patient_id', id).order('created_at', { ascending: false })
      setConsultations(c || [])
      const { data: w } = await supabase.from('wellness_checkins').select('*').eq('patient_id', id).order('created_at', { ascending: false }).limit(7)
      setCheckins(w || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const latest = consultations[0]

  return (
    <div className="min-h-screen bg-navy">
      <Navbar role="doctor" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/doctor')} className="flex items-center gap-1 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Regresar
        </button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-white font-light">{patient?.full_name}</h1>
            <p className="text-white/40 text-sm mt-1">{patient?.email}</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full border ${latest?.status === 'active' ? 'border-teal/30 text-teal bg-teal/10' : 'border-white/10 text-white/30'}`}>
            {latest?.status === 'active' ? 'Protocolo activo' : 'Sin protocolo activo'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Protocol */}
          {latest && (
            <div className="card md:col-span-2">
              <h2 className="font-display text-xl text-white mb-4">Protocolo actual</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-navy rounded-xl border border-white/5">
                  <p className="text-teal font-display text-2xl">{latest.age}</p>
                  <p className="text-white/40 text-xs uppercase tracking-wide mt-1">Años</p>
                </div>
                <div className="text-center p-3 bg-navy rounded-xl border border-white/5">
                  <p className="text-teal font-display text-2xl">{latest.weight}</p>
                  <p className="text-white/40 text-xs uppercase tracking-wide mt-1">Kg</p>
                </div>
                <div className="text-center p-3 bg-navy rounded-xl border border-white/5">
                  <p className="text-gold font-display text-2xl">{latest.protocol?.cycle_weeks}</p>
                  <p className="text-white/40 text-xs uppercase tracking-wide mt-1">Semanas</p>
                </div>
              </div>

              {latest.protocol?.peptides?.length > 0 && (
                <div className="mb-4">
                  <p className="text-white/40 text-xs uppercase tracking-wide mb-2">Péptidos</p>
                  <div className="flex flex-wrap gap-2">
                    {latest.protocol.peptides.map(p => (
                      <span key={p} className="text-xs px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {latest.goals?.length > 0 && (
                <div className="mb-4">
                  <p className="text-white/40 text-xs uppercase tracking-wide mb-2">Objetivos</p>
                  <div className="flex flex-wrap gap-2">
                    {latest.goals.map(g => (
                      <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-teal/10 border border-teal/30 text-teal">{g}</span>
                    ))}
                  </div>
                </div>
              )}

              {latest.protocol?.dosage_notes && (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wide mb-2">Dosificación</p>
                  <p className="text-white/70 text-sm leading-relaxed">{latest.protocol.dosage_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Wellness Check-ins */}
          <div className="card md:col-span-2">
            <h2 className="font-display text-xl text-white mb-4">Check-ins recientes</h2>
            {checkins.length === 0 ? (
              <p className="text-white/30 text-sm">No hay check-ins aún.</p>
            ) : (
              <div className="space-y-2">
                {checkins.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-navy">
                    <p className="text-white/60 text-xs">{new Date(c.created_at).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <p className="text-white/40 text-xs">Energía</p>
                        <p className="text-teal text-sm font-medium">{c.energy}/10</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <p className="text-white/40 text-xs">Ánimo</p>
                        <p className="text-teal text-sm font-medium">{c.mood}/10</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <p className="text-white/40 text-xs">Sueño</p>
                        <p className="text-teal text-sm font-medium">{c.sleep}/10</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
