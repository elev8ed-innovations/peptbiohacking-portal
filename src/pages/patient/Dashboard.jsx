import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import IntroModal from '../../components/IntroModal'
import WaiverGate from '../../components/WaiverGate'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../context/LanguageContext'

const SHOP_URL = import.meta.env.VITE_PEPTBIOHACK_SHOP_URL || 'https://peptbiohack.mx'

function slugify(name) {
  return (name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

const card = {
  background: '#fff', border: '1px solid #E5E5E5',
  borderRadius: '16px', padding: '24px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
}

export default function PatientDashboard() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [userId, setUserId] = useState(null)
  const [profile, setProfile] = useState(null)
  const [consultations, setConsultations] = useState([])
  const [checkins, setCheckins] = useState([])
  const [bodyMetrics, setBodyMetrics] = useState([])
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showIntro, setShowIntro] = useState(false)
  const [showWaiver, setShowWaiver] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login', { replace: true }); return }

      let prof = null
      for (let i = 0; i < 3; i++) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (p) { prof = p; break }
        await new Promise(r => setTimeout(r, 400))
      }

      // Doctors go to doctor dashboard — hard redirect, no flash
      if (prof?.role === 'doctor') {
        navigate('/doctor/dashboard', { replace: true })
        return
      }

      const resolvedName =
        prof?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0]

      setUserId(user.id)
      setProfile({ ...(prof || {}), full_name: resolvedName })

      const [{ data: consults }, { data: chks }] = await Promise.all([
        supabase.from('consultations').select('*').eq('patient_id', user.id).order('created_at', { ascending: false }),
        supabase.from('wellness_checkins').select('*').eq('patient_id', user.id).order('created_at', { ascending: false }).limit(3),
      ])

      setConsultations(consults || [])
      setCheckins(chks || [])
      const { data: bm } = await supabase
        .from("body_metrics")
        .select("*")
        .eq("patient_id", user.id)
        .order("recorded_at", { ascending: false })
      setBodyMetrics(bm || [])
      setMetricsLoading(false)
      setLoading(false)

      if (!prof?.has_signed_waiver) {
        setShowWaiver(true)
      } else if (prof?.has_seen_intro === false) {
        setShowIntro(true)
      }
    }
    load()
  }, [])

  const latestConsult = consultations[0]
  const protocol = latestConsult?.peptide_protocol || []

  // Blank screen while checking auth/role — no flash, no spinner
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }} />
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <Navbar role="patient" />

      {showWaiver && userId && (
        <WaiverGate
          userId={userId}
          onAccepted={() => {
            setShowWaiver(false)
            setProfile(p => ({ ...p, has_signed_waiver: true }))
            if (profile?.has_seen_intro === false) setShowIntro(true)
          }}
        />
      )}

      {showIntro && !showWaiver && <IntroModal onDismiss={() => setShowIntro(false)} />}

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 20px' }}>

        <div style={{ marginBottom: '36px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', marginBottom: '8px' }}>
            {new Date().toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '40px', color: '#0A1628', margin: 0 }}>
            {t.welcome}, <span style={{ color: '#00C2A8' }}>{profile?.full_name?.split(' ')[0]}</span>
          </h1>
          <div style={{ width: '48px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginTop: '12px' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <StatCard label={t.consultations} value={consultations.length} icon="🔬" />
          <StatCard label={t.recentCheckins} value={checkins.length} icon="📊" />
          <StatCard label={t.booking} value="+" icon="📅" onClick={() => navigate('/patient/booking')} accent />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div style={card}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: '#0A1628', margin: '0 0 16px' }}>
              {t.myProtocol}
            </h3>
            {protocol.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Outfit, sans-serif', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E5E5' }}>
                      {['Peptide', 'Dose', 'Frequency', ''].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2A2A2A', opacity: 0.45 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {protocol.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F5F5F5' }}>
                        <td style={{ padding: '12px', color: '#0A1628', fontWeight: 600 }}>{p.name}</td>
                        <td style={{ padding: '12px', color: '#2A2A2A', opacity: 0.7 }}>{p.dose || '—'}</td>
                        <td style={{ padding: '12px', color: '#2A2A2A', opacity: 0.7 }}>{p.frequency || '—'}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <a href={`${SHOP_URL}/products/${slugify(p.name)}`} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-block', padding: '6px 14px', background: '#C9A84C', color: '#fff', borderRadius: '8px', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '12px', textDecoration: 'none' }}>
                            {t.reorder}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#2A2A2A', opacity: 0.45, fontFamily: 'Outfit, sans-serif', fontSize: '14px', margin: 0 }}>{t.noProtocol}</p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={card}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#0A1628', margin: '0 0 16px' }}>{t.recentCheckins}</h3>
              {checkins.length === 0 ? (
                <p style={{ color: '#2A2A2A', opacity: 0.4, fontFamily: 'Outfit, sans-serif', fontSize: '14px', margin: 0 }}>{t.noCheckins}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {checkins.map((c, i) => (
                    <div key={i} style={{ borderBottom: '1px solid #F5F5F5', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#2A2A2A', opacity: 0.45, fontSize: '12px', fontFamily: 'Outfit, sans-serif' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                        <span style={{ color: '#0A1628', fontSize: '12px', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>{t.wellnessScore}: {c.wellness_score}/10</span>
                      </div>
                      {c.notes && <p style={{ color: '#2A2A2A', opacity: 0.65, fontSize: '13px', fontFamily: 'Outfit, sans-serif', margin: 0 }}>{c.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={card}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#0A1628', margin: '0 0 16px' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: t.checkin, path: '/patient/checkin', color: '#0A1628' },
                  { label: t.progress, path: '/patient/progress', color: '#0A1628' },
                  { label: t.booking, path: '/patient/booking', color: '#00C2A8' },
                  { label: t.lightHealth, path: '/patient/light-health', color: '#C9A84C' },
                ].map(a => (
                  <button key={a.path} onClick={() => navigate(a.path)} style={{
                    padding: '11px 16px', minHeight: '44px',
                    background: a.color === '#0A1628' ? '#FAF7F2' : a.color === '#00C2A8' ? 'rgba(0,194,168,0.08)' : 'rgba(201,168,76,0.08)',
                    border: `1px solid ${a.color === '#0A1628' ? '#E5E5E5' : a.color + '40'}`,
                    borderRadius: '10px', color: a.color,
                    fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px',
                    cursor: 'pointer', textAlign: 'left',
                  }}>{a.label} →</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BODY METRICS SECTION */}
        {!metricsLoading && (
          <div style={{ marginTop: '36px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', marginBottom: '8px' }}>{'Dashboard'}</p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: '#0A1628', margin: '0 0 4px' }}>
              {'Mi Progreso'}
            </h2>
            <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginBottom: '20px' }} />

            {bodyMetrics.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '40px 20px', marginBottom: '20px', border: '1px solid #E5E5E5', textAlign: 'center' }}>
                <span style={{ fontSize: '36px' }}>📏</span>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#0A1628', margin: '12px 0 6px' }}>
                  {'Aun sin mediciones'}
                </h3>
                <p style={{ color: '#2A2A2A', opacity: 0.45, fontFamily: 'Outfit, sans-serif', fontSize: '14px', margin: 0, maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
                  {'Tu medico registrara tus metricas corporales durante tu proxima consulta. Vuelve a revisar despues de tu cita.'}
                </p>
              </div>
            ) : (<>
            {/* Trend Chart */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '20px', border: '1px solid #E5E5E5' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0A1628', marginBottom: '12px' }}>{'Peso — Ultimos 30 dias'}</div>
              <svg viewBox="0 0 300 80" preserveAspectRatio="none" style={{ width: '100%', height: '100px' }}>
                {(() => {
                  const weights = [...bodyMetrics].reverse().filter(r => r.weight_kg != null).slice(-10).map(r => r.weight_kg)
                  if (weights.length < 2) return null
                  const min = Math.min(...weights), max = Math.max(...weights), range = max - min || 1
                  const points = weights.map((w, i) => {
                    const x = (i / (weights.length - 1)) * 280 + 10
                    const y = 70 - ((w - min) / range) * 60
                    return x + ',' + y
                  }).join(' ')
                  return (<>
                    <polyline points={points} fill="none" stroke="#2A7C6F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx={points.split(' ').pop().split(',')[0]} cy={points.split(' ').pop().split(',')[1]} r="4" fill="#2A7C6F" />
                  </>)
                })()}
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', color: 'rgba(26,42,42,.4)' }}>{'Hace 30 dias'}</span>
                <span style={{ fontSize: '10px', color: 'rgba(26,42,42,.4)' }}>{'Hoy'}</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                { key: 'weight_kg', label: 'Peso', unit: 'kg', good: true },
                { key: 'body_fat_pct', label: 'Grasa Corporal', unit: '%', good: true },
                { key: 'bmi', label: 'IMC', unit: '', isBmi: true },
                { key: 'muscle_kg', label: 'Masa Muscular', unit: 'kg', good: false },
              ].map(m => {
                const val = bodyMetrics[0]?.[m.key]
                const prev = bodyMetrics[1]?.[m.key]
                const diff = (val != null && prev != null) ? (val - prev) : null
                const isBmiGood = m.isBmi && val != null && val >= 18.5 && val <= 24.9
                return (
                  <div key={m.key} style={{ background: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #E5E5E5' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(26,42,42,.4)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{m.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#0A1628' }}>
                      {val != null ? val : '--'}
                      {m.unit && <span style={{ fontSize: '14px', fontWeight: 400, color: 'rgba(26,42,42,.4)', marginLeft: '2px' }}>{m.unit}</span>}
                    </div>
                    {diff != null && Math.abs(diff) >= 0.05 && (
                      <div style={{ fontSize: '12px', marginTop: '2px', color: (m.good ? diff < 0 : diff > 0) ? '#2A7C6F' : '#C0392B' }}>
                        {diff > 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}{m.unit} {m.good ? 'este mes' : ''}
                      </div>
                    )}
                    {isBmiGood && <div style={{ fontSize: '12px', marginTop: '2px', color: '#2A7C6F' }}>{'Rango saludable'}</div>}
                  </div>
                )
              })}
            </div>

            {/* History Table */}
            {bodyMetrics.length > 1 && (
              <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E5E5E5', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0EFEA', fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', color: '#0A1628' }}>
                  {'Historial de mediciones'}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E5E5E5' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: 'rgba(26,42,42,.4)', fontWeight: 500 }}>{'Fecha'}</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', color: 'rgba(26,42,42,.4)', fontWeight: 500 }}>{'Peso'}</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', color: 'rgba(26,42,42,.4)', fontWeight: 500 }}>{'Grasa'}</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', color: 'rgba(26,42,42,.4)', fontWeight: 500 }}>{'IMC'}</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', color: 'rgba(26,42,42,.4)', fontWeight: 500 }}>{'Musculo'}</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', color: 'rgba(26,42,42,.4)', fontWeight: 500 }}>{'Cintura'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bodyMetrics.slice(0, 10).map((m, i) => (
                        <tr key={m.id} style={{ borderBottom: i < Math.min(bodyMetrics.length, 10) - 1 ? '1px solid #F5F4F0' : 'none' }}>
                          <td style={{ padding: '8px 14px', color: '#0A1628', fontWeight: 500 }}>{new Date(m.recorded_at).toLocaleDateString()}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'right' }}>{m.weight_kg ?? '--'}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'right' }}>{m.body_fat_pct != null ? m.body_fat_pct + '%' : '--'}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'right' }}>{m.bmi ?? '--'}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'right' }}>{m.muscle_kg ?? '--'}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'right' }}>{m.waist_cm ?? '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <p style={{ fontSize: '11px', color: 'rgba(26,42,42,.3)', fontFamily: 'Outfit, sans-serif' }}>
                {'Solo lectura — Tus metricas son registradas por tu medico'}
              </p>
            </div>
            </>)}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, onClick, accent }) {
  return (
    <div onClick={onClick} style={{
      background: '#fff', border: `1px solid ${accent ? '#00C2A8' : '#E5E5E5'}`,
      borderRadius: '14px', padding: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      cursor: onClick ? 'pointer' : 'default',
    }}>
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', color: accent ? '#00C2A8' : '#0A1628', margin: '8px 0 2px', fontWeight: 700 }}>{value}</p>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#2A2A2A', opacity: 0.5, margin: 0 }}>{label}</p>
    </div>
  )
}
