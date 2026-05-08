import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import IntroModal from '../../components/IntroModal'
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
  const [profile, setProfile] = useState(null)
  const [consultations, setConsultations] = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showIntro, setShowIntro] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { data: consults }, { data: chks }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('consultations').select('*').eq('patient_id', user.id).order('created_at', { ascending: false }),
        supabase.from('wellness_checkins').select('*').eq('patient_id', user.id).order('created_at', { ascending: false }).limit(3),
      ])

      setProfile(prof)
      setConsultations(consults || [])
      setCheckins(chks || [])
      setLoading(false)

      // Show intro modal on first login
      if (prof && prof.has_seen_intro === false) setShowIntro(true)
    }
    load()
  }, [])

  const latestConsult = consultations[0]
  const protocol = latestConsult?.peptide_protocol || []

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid #E5E5E5', borderTop: '3px solid #0A1628', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <Navbar role="patient" />
      {showIntro && <IntroModal onDismiss={() => setShowIntro(false)} />}

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 20px' }}>

        {/* Hero greeting */}
        <div style={{ marginBottom: '36px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', marginBottom: '8px' }}>
            {new Date().toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '40px', color: '#0A1628', margin: 0 }}>
            {t.welcome}, <span style={{ color: '#00C2A8' }}>{profile?.full_name?.split(' ')[0]}</span>
          </h1>
          <div style={{ width: '48px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginTop: '12px' }} />
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <StatCard label={t.consultations} value={consultations.length} icon="🔬" />
          <StatCard label={t.recentCheckins} value={checkins.length} icon="📊" />
          <StatCard
            label={t.booking}
            value="+"
            icon="📅"
            onClick={() => navigate('/patient/booking')}
            accent
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>

          {/* Active Protocol — full width */}
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
                          <a
                            href={`${SHOP_URL}/products/${slugify(p.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-block', padding: '6px 14px',
                              background: '#C9A84C', color: '#fff', borderRadius: '8px',
                              fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '12px',
                              textDecoration: 'none', whiteSpace: 'nowrap',
                            }}
                          >
                            {t.reorder}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#2A2A2A', opacity: 0.45, fontFamily: 'Outfit, sans-serif', fontSize: '14px', margin: 0 }}>
                {t.noProtocol}
              </p>
            )}
          </div>

          {/* Two-col on md+ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

            {/* Recent Check-ins */}
            <div style={card}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#0A1628', margin: '0 0 16px' }}>
                {t.recentCheckins}
              </h3>
              {checkins.length === 0 ? (
                <p style={{ color: '#2A2A2A', opacity: 0.4, fontFamily: 'Outfit, sans-serif', fontSize: '14px', margin: 0 }}>{t.noCheckins}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {checkins.map((c, i) => (
                    <div key={i} style={{ borderBottom: '1px solid #F5F5F5', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#2A2A2A', opacity: 0.45, fontSize: '12px', fontFamily: 'Outfit, sans-serif' }}>
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                        <span style={{ color: '#0A1628', fontSize: '12px', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                          {t.wellnessScore}: {c.wellness_score}/10
                        </span>
                      </div>
                      {c.notes && <p style={{ color: '#2A2A2A', opacity: 0.65, fontSize: '13px', fontFamily: 'Outfit, sans-serif', margin: 0 }}>{c.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div style={card}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#0A1628', margin: '0 0 16px' }}>
                Quick Actions
              </h3>
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
                  }}>
                    {a.label} →
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function StatCard({ label, value, icon, onClick, accent }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', border: `1px solid ${accent ? '#00C2A8' : '#E5E5E5'}`,
        borderRadius: '14px', padding: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', color: accent ? '#00C2A8' : '#0A1628', margin: '8px 0 2px', fontWeight: 700 }}>{value}</p>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#2A2A2A', opacity: 0.5, margin: 0 }}>{label}</p>
    </div>
  )
}
