import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../context/LanguageContext'
import AppointmentIntakeModal from '../../components/AppointmentIntakeModal'

export default function DoctorDashboard() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [summaries, setSummaries] = useState({})
  const [generating, setGenerating] = useState({})
  const [todayAppts, setTodayAppts] = useState([])
  const [loadingAppts, setLoadingAppts] = useState(true)
  const [selectedAppt, setSelectedAppt] = useState(null)

  useEffect(() => {
    async function load() {
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

    const [{ data: checkins }, { data: consults }, { data: labs }] = await Promise.all([
      supabase.from('wellness_checkins').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('consultations').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false }),
      supabase.from('lab_uploads').select('file_name, uploaded_at').eq('patient_id', patient.id),
    ])

    const patientContext = `
Patient: ${patient.full_name}
Email: ${patient.email}

Recent Wellness Check-ins (last ${checkins?.length || 0}):
${checkins?.map(c => `- Date: ${new Date(c.created_at).toLocaleDateString()}, Wellness Score: ${c.wellness_score}/10${c.notes ? `, Notes: ${c.notes}` : ''}${c.energy_level ? `, Energy: ${c.energy_level}/10` : ''}${c.sleep_quality ? `, Sleep: ${c.sleep_quality}/10` : ''}`).join('\n') || 'No check-ins recorded'}

Consultations (${consults?.length || 0} total):
${consults?.map(c => `- Date: ${new Date(c.created_at).toLocaleDateString()}, Chief complaint: ${c.chief_complaint || 'N/A'}, Protocol: ${JSON.stringify(c.peptide_protocol || [])}`).join('\n') || 'No consultations recorded'}

Lab Uploads (${labs?.length || 0} files):
${labs?.map(l => `- ${l.file_name} (${new Date(l.uploaded_at).toLocaleDateString()})`).join('\n') || 'No lab results uploaded'}
    `.trim()

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a clinical assistant for Dr. Fernando Valenzuela, a physician specializing in peptide therapy and regenerative medicine at PeptBiohacking in Mexico.
Summarize the patient's current status clearly and concisely for the doctor. Include:
1. Current wellness trend (improving/stable/declining)
2. Key concerns or highlights from check-ins
3. Protocol notes
4. Recommended follow-up actions
Be clinical, concise, and bilingual (Spanish preferred, English acceptable). Max 200 words.`,
          messages: [{ role: 'user', content: `Please summarize this patient's status:\n\n${patientContext}` }]
        })
      })
      const data = await response.json()
      const summary = data.content?.[0]?.text || 'Unable to generate summary.'
      setSummaries(s => ({ ...s, [patient.id]: summary }))
    } catch (e) {
      setSummaries(s => ({ ...s, [patient.id]: 'Error generating summary. Please try again.' }))
    }

    setGenerating(g => ({ ...g, [patient.id]: false }))
  }

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
                      {summaries[patient.id]}
                    </p>
                  </div>
                )}
              </div>
            ))}
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
