import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../context/LanguageContext'
import AppointmentIntakeModal from '../../components/AppointmentIntakeModal'
import { calculateBmi, validateBodyMetricInput } from '../../lib/healthMetrics'

export default function DoctorDashboard() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [summaries, setSummaries] = useState({})
  const [summaryErrors, setSummaryErrors] = useState({})
  const [generating, setGenerating] = useState({})
  const [todayAppts, setTodayAppts] = useState([])
  const [loadingAppts, setLoadingAppts] = useState(true)
  const [selectedAppt, setSelectedAppt] = useState(null)
  const [bodyMetrics, setBodyMetrics] = useState([])
  const [metricsPatient, setMetricsPatient] = useState(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [metricForm, setMetricForm] = useState({ weight: '', height: '', fat: '', muscle: '', waist: '' })
  const [metricError, setMetricError] = useState('')
  const [doctorId, setDoctorId] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (currentProfile?.role !== 'doctor') {
        navigate('/patient/dashboard', { replace: true })
        return
      }

      setDoctorId(user.id)

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      const [{ data: patientData }, { data: apptData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'patient').order('created_at', { ascending: false }),
        supabase.from('appointments')
          .select('*, profiles(full_name, email)')
          .gte('start_time', todayStart.toISOString())
          .lte('start_time', todayEnd.toISOString())
          .order('start_time', { ascending: true }),
      ])

      setPatients(patientData || [])
      setTodayAppts(apptData || [])
      setLoading(false)
      setLoadingAppts(false)
    }
    load()
  }, [])

  const generateSummary = async (patient) => {
    setGenerating(g => ({ ...g, [patient.id]: true }))
    setSummaries(s => ({ ...s, [patient.id]: null }))
    setSummaryErrors(s => ({ ...s, [patient.id]: '' }))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Your session expired. Please sign in again.')

      const response = await fetch('/api/doctor-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ patientId: patient.id }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'AI summary could not be generated.')
      if (!data.summary) throw new Error('AI provider returned an empty summary.')

      setSummaries(s => ({ ...s, [patient.id]: data }))
    } catch (error) {
      setSummaryErrors(s => ({ ...s, [patient.id]: error.message || 'Error generating summary. Please try again.' }))
    }

    setGenerating(g => ({ ...g, [patient.id]: false }))
  }

  const loadBodyMetrics = async (patientId) => {
    if (!patientId) return
    setMetricsLoading(true)
    setMetricsPatient(patientId)
    const { data } = await supabase
      .from("body_metrics")
      .select("*")
      .eq("patient_id", patientId)
      .order("recorded_at", { ascending: false })
    setBodyMetrics(data || [])
    setMetricForm(form => ({ ...form, height: data?.[0]?.height_cm ?? '' }))
    setMetricsLoading(false)
  }

  const saveBodyMetrics = async () => {
    if (!metricsPatient) return
    const f = metricForm
    const numeric = (v) => (v === "" || v === null || v === undefined) ? null : parseFloat(v)
    const formForValidation = {
      weight_kg: f.weight,
      height_cm: f.height,
      body_fat_pct: f.fat,
      muscle_kg: f.muscle,
      waist_cm: f.waist,
      bmi_override: false,
    }
    const validationError = validateBodyMetricInput(formForValidation)
    if (validationError) { setMetricError(validationError); return }
    setMetricError('')
    const payload = {
      patient_id: metricsPatient,
      recorded_by: doctorId,
      weight_kg: numeric(f.weight),
      height_cm: numeric(f.height),
      body_fat_pct: numeric(f.fat),
      bmi: calculateBmi(f.weight, f.height),
      muscle_kg: numeric(f.muscle),
      waist_cm: numeric(f.waist),
    }
    const { error } = await supabase.from('body_metrics').insert(payload)
    if (error) { setMetricError(error.message || 'No se pudo guardar la medición.'); return }
    setMetricForm(form => ({ weight: '', height: form.height, fat: '', muscle: '', waist: '' }))
    await loadBodyMetrics(metricsPatient)
  }

  const getTrend = (field) => {
    const cur = bodyMetrics[0]?.[field]
    const prev = bodyMetrics[1]?.[field]
    if (cur == null) return { val: "—", dir: "" }
    const val = typeof cur === "number" ? cur.toFixed(1) : cur
    if (prev == null) return { val, dir: "—" }
    const diff = cur - prev
    const isGoodDown = field === "weight_kg" || field === "body_fat_pct" || field === "waist_cm"
    if (Math.abs(diff) < 0.05) return { val, dir: "→", color: "rgba(26,42,42,.3)" }
    if (isGoodDown ? diff < 0 : diff > 0) return { val, dir: "▼", color: "#2A7C6F" }
    return { val, dir: "▲", color: "#C0392B" }
  }

  const METRIC_FIELDS = [
    { key: "weight_kg", label: "Peso", unit: "kg", icon: "⚖️" },
    { key: "body_fat_pct", label: "Grasa Corporal", unit: "%", icon: "💪" },
    { key: "bmi", label: "IMC", unit: "", icon: "📏" },
    { key: "muscle_kg", label: "Masa Muscular", unit: "kg", icon: "🦵" },
    { key: "waist_cm", label: "Cintura", unit: "cm", icon: "📐" },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <Navbar role="doctor" />
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>

        {/* Today's Appointments */}
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', marginBottom: '8px' }}>Doctor</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '38px', color: '#0A1628', margin: '0 0 8px' }}>
          {t.todayAppts || "Today's Appointments"}
        </h1>
        <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginBottom: '28px' }} />

        {loadingAppts ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
            <div style={{ width: '28px', height: '28px', border: '2px solid #E5E5E5', borderTop: '2px solid #0A1628', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : todayAppts.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '14px', padding: '28px', textAlign: 'center', marginBottom: '36px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ color: '#2A2A2A', opacity: 0.4, fontFamily: 'Outfit, sans-serif', fontSize: '14px', margin: 0 }}>
              {t.noAppts || 'No appointments scheduled for today.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
            {todayAppts.map((appt, i) => (
              <div key={i} style={{
                background: '#fff', border: '1px solid #E5E5E5', borderRadius: '14px',
                padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00C2A8, #C9A84C)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', color: '#0A1628', fontWeight: 700, flexShrink: 0,
                  }}>
                    {appt.profiles?.full_name?.[0] || 'P'}
                  </div>
                  <div>
                    <div style={{ color: '#0A1628', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '15px' }}>
                      {appt.profiles?.full_name || 'Patient'}
                    </div>
                    <div style={{ color: '#2A2A2A', opacity: 0.45, fontFamily: 'Outfit, sans-serif', fontSize: '13px' }}>
                      {new Date(appt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {appt.end_time && ` – ${new Date(appt.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {appt.intake_data && (
                    <button
                      onClick={() => setSelectedAppt(appt)}
                      style={{
                        padding: '8px 16px', minHeight: '40px',
                        background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.4)',
                        borderRadius: '8px', color: '#C9A84C',
                        fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {t.viewIntake || 'View Intake'}
                    </button>
                  )}
                  {appt.meeting_link && (
                    <a href={appt.meeting_link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <button style={{
                        padding: '8px 16px', minHeight: '40px',
                        background: '#00C2A8', border: 'none',
                        borderRadius: '8px', color: '#fff',
                        fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                      }}>
                        {t.joinMeet || '🎥 Join Meet'}
                      </button>
                    </a>
                  )}
                  <button
                    onClick={() => navigate(`/doctor/new-consultation?appointment_id=${appt.id}&patient_id=${appt.patient_id}`)}
                    style={{
                      padding: '8px 16px', minHeight: '40px',
                      background: '#0A1628', border: 'none',
                      borderRadius: '8px', color: '#fff',
                      fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {t.startConsult || 'Start Consult →'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Patient List */}
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', marginBottom: '8px' }}>
          Patients
        </p>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: '#0A1628', margin: '0 0 8px' }}>
          {t.patientList}
        </h2>
        <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginBottom: '24px' }} />

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '40px', height: '40px', border: '2px solid #E5E5E5', borderTop: '2px solid #0A1628', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#2A2A2A', opacity: 0.4, fontFamily: 'Outfit, sans-serif' }}>
            {t.noPatients}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {patients.map(patient => (
              <div key={patient.id} style={{
                background: '#fff', border: '1px solid #E5E5E5',
                borderRadius: '14px', padding: '20px 24px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #00C2A8, #C9A84C)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#0A1628', fontWeight: 700,
                    }}>
                      {patient.full_name?.[0] || 'P'}
                    </div>
                    <div>
                      <div style={{ color: '#0A1628', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '16px' }}>
                        {patient.full_name || 'Unnamed Patient'}
                      </div>
                      <div style={{ color: '#2A2A2A', opacity: 0.4, fontFamily: 'Outfit, sans-serif', fontSize: '13px' }}>
                        {patient.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => generateSummary(patient)}
                      disabled={generating[patient.id]}
                      style={{
                        padding: '8px 18px', minHeight: '40px',
                        background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.35)',
                        borderRadius: '8px', color: '#C9A84C',
                        fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 600,
                        cursor: generating[patient.id] ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        opacity: generating[patient.id] ? 0.6 : 1,
                      }}
                    >
                      {generating[patient.id] ? (
                        <><span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(201,168,76,0.3)', borderTop: '2px solid #C9A84C', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />{t.generating}</>
                      ) : (
                        <>✦ {t.aiSummary}</>
                      )}
                    </button>
                    <button
                      onClick={() => navigate(`/doctor/patient/${patient.id}`)}
                      style={{
                        padding: '8px 18px', minHeight: '40px',
                        background: 'rgba(0,194,168,0.08)', border: '1px solid rgba(0,194,168,0.3)',
                        borderRadius: '8px', color: '#00A891',
                        fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      }}
                    >View →</button>
                  </div>
                </div>

                {summaries[patient.id] && (
                  <div style={{
                    marginTop: '16px', padding: '16px 20px',
                    background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)',
                    borderRadius: '10px',
                  }}>
                    <div style={{ color: '#C9A84C', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
                      ✦ {t.summaryTitle}
                    </div>
                    <p style={{ color: '#2A2A2A', fontFamily: 'Outfit, sans-serif', fontSize: '14px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {summaries[patient.id].summary}
                    </p>
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(201,168,76,0.18)', color: '#6F7777', fontFamily: 'Outfit, sans-serif', fontSize: '10px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <span>{summaries[patient.id].notice || 'AI-generated draft. Doctor review required.'}</span>
                      <span>{summaries[patient.id].generatedAt ? new Date(summaries[patient.id].generatedAt).toLocaleString() : ''}</span>
                    </div>
                  </div>
                )}

                {summaryErrors[patient.id] && (
                  <div role="alert" style={{ marginTop: '14px', padding: '12px 16px', background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: '9px', color: '#9D352B', fontFamily: 'Outfit, sans-serif', fontSize: '13px' }}>
                    {summaryErrors[patient.id]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BODY METRICS SECTION */}
      <div style={{ marginTop: '36px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', marginBottom: '8px' }}>NUEVO</p>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '30px', color: '#0A1628', margin: '0 0 4px' }}>
          {'📊'} Body Metrics
        </h2>
        <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginBottom: '20px' }} />

        {/* Patient selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {(patients || []).map(p => (
            <span key={p.id} onClick={() => loadBodyMetrics(p.id)} style={{
              padding: '6px 16px', borderRadius: '16px', fontSize: '13px',
              fontWeight: metricsPatient === p.id ? 600 : 500, cursor: 'pointer',
              background: metricsPatient === p.id ? '#0A1628' : '#fff',
              color: metricsPatient === p.id ? '#fff' : 'rgba(26,42,42,.5)',
              border: metricsPatient === p.id ? 'none' : '1px solid #E5E5E5',
            }}>{p.full_name || 'Patient'}</span>
          ))}
        </div>

        {metricsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
            <div style={{ width: '24px', height: '24px', border: '2px solid #E5E5E5', borderTop: '2px solid #0A1628', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : metricsPatient ? (
          <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F0EFEA' }}>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', color: '#0A1628' }}>
                {(patients.find(p => p.id === metricsPatient)?.full_name || 'Patient') + ' — ' + (bodyMetrics.length > 0 ? (bodyMetrics[0]?.recorded_at ? new Date(bodyMetrics[0].recorded_at).toLocaleDateString() : 'Reciente') : 'Sin mediciones')}
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(26,42,42,.4)' }}>{bodyMetrics.length + ' registro(s)'}</span>
            </div>

            {METRIC_FIELDS.map(m => {
              const t = getTrend(m.key)
              return (
                <div key={m.key} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F5F4F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0,194,168,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{m.icon}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#1A2A2A' }}>{m.label}</div>
                      {bodyMetrics[1]?.[m.key] != null && <div style={{ fontSize: '11px', color: 'rgba(26,42,42,.4)' }}>Anterior: {bodyMetrics[1][m.key]}</div>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#0A1628' }}>{t.val}</span>
                    {m.unit && <span style={{ fontSize: '13px', color: 'rgba(26,42,42,.4)', marginLeft: '2px' }}>{m.unit}</span>}
                    {t.dir && <span style={{ fontSize: '12px', marginLeft: '6px', color: t.color || 'rgba(26,42,42,.3)' }}>{t.dir}</span>}
                  </div>
                </div>
              )
            })}

            {/* Quick Add Row */}
            <div style={{ background: 'rgba(0,194,168,.03)', padding: '14px 20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px dashed rgba(0,194,168,.2)' }}>
              {[
                { key: 'weight', label: 'Peso' },
                { key: 'height', label: 'Estatura cm' },
                { key: 'fat', label: 'Grasa%' },
                { key: 'muscle', label: 'Musculo' },
                { key: 'waist', label: 'Cintura' },
              ].map(f => (
                <input key={f.key} placeholder={f.label} value={metricForm[f.key] || ''}
                  onChange={e => setMetricForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                  type="number" step="0.1"
                  style={{ width: '95px', padding: '8px 10px', border: '1px solid #E5E5E5', borderRadius: '8px', fontFamily: 'Outfit, sans-serif', fontSize: '13px', background: '#fff', color: '#1A2A2A' }} />
              ))}
              {calculateBmi(metricForm.weight, metricForm.height) != null && <span style={{ fontSize: '12px', color: '#2A7C6F', fontWeight: 700 }}>IMC {calculateBmi(metricForm.weight, metricForm.height)}</span>}
              <button onClick={saveBodyMetrics} style={{ padding: '8px 18px', background: '#2A7C6F', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                Guardar
              </button>
            </div>
            {metricError && <p style={{ color: '#dc2626', padding: '0 20px 14px', margin: 0, fontSize: '12px' }}>{metricError}</p>}
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '14px', padding: '28px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ color: '#2A2A2A', opacity: 0.4, fontFamily: 'Outfit, sans-serif', fontSize: '14px', margin: 0 }}>
              {'Selecciona un paciente para ver o agregar metricas'}
            </p>
          </div>
        )}
      </div>

      {selectedAppt && (
        <AppointmentIntakeModal appointment={selectedAppt} onClose={() => setSelectedAppt(null)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
