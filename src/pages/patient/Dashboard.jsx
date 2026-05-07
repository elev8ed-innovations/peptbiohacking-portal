import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../context/LanguageContext'

export default function PatientDashboard() {
  const { t } = useLang()
  const [profile, setProfile] = useState(null)
  const [consultations, setConsultations] = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)

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
    }
    load()
  }, [])

  const cardStyle = {
    background: 'rgba(13,31,60,0.8)',
    border: '1px solid rgba(0,194,168,0.15)',
    borderRadius: '12px', padding: '24px',
  }

  const latestConsult = consultations[0]

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0,194,168,0.2)', borderTop: '3px solid #00C2A8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628' }}>
      <Navbar role="patient" />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>

        {/* Hero greeting */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '36px', color: '#fff', margin: 0 }}>
            {t.welcome}, <span style={{ color: '#00C2A8' }}>{profile?.full_name?.split(' ')[0]}</span>
          </h1>
          <div style={{ width: '48px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginTop: '10px' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Active Protocol */}
          <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#C9A84C', margin: '0 0 16px' }}>
              {t.myProtocol}
            </h3>
            {latestConsult?.peptide_protocol?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {latestConsult.peptide_protocol.map((p, i) => (
                  <div key={i} style={{
                    background: 'rgba(0,194,168,0.1)', border: '1px solid rgba(0,194,168,0.3)',
                    borderRadius: '8px', padding: '10px 16px',
                  }}>
                    <div style={{ color: '#00C2A8', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px' }}>{p.name}</div>
                    {p.dose && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '2px' }}>{p.dose} — {p.frequency}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Outfit, sans-serif', fontSize: '14px', margin: 0 }}>
                {t.noProtocol}
              </p>
            )}
          </div>

          {/* Recent Check-ins */}
          <div style={cardStyle}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#C9A84C', margin: '0 0 16px' }}>
              {t.recentCheckins}
            </h3>
            {checkins.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Outfit, sans-serif', fontSize: '14px', margin: 0 }}>{t.noCheckins}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {checkins.map((c, i) => (
                  <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontFamily: 'Outfit, sans-serif' }}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                      <span style={{ color: '#00C2A8', fontSize: '12px', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                        {t.wellnessScore}: {c.wellness_score}/10
                      </span>
                    </div>
                    {c.notes && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontFamily: 'Outfit, sans-serif', margin: 0 }}>{c.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div style={cardStyle}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#C9A84C', margin: '0 0 16px' }}>
              Overview
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: t.consultations, value: consultations.length },
                { label: t.recentCheckins, value: checkins.length },
              ].map((stat, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Outfit, sans-serif', fontSize: '14px' }}>{stat.label}</span>
                  <span style={{ color: '#fff', fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', fontWeight: 600 }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
