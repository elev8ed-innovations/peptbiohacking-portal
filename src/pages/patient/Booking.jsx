import { InlineWidget } from 'react-calendly'
import Navbar from '../../components/Navbar'
import { useLang } from '../../context/LanguageContext'

const CALENDLY_URL = import.meta.env.VITE_CALENDLY_URL || 'https://calendly.com/admin-peptbiohacking/consulta-dr-v'

export default function Booking() {
  const { t } = useLang()

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <Navbar role="patient" />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', marginBottom: '8px' }}>
          {t.booking}
        </p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '38px', color: '#0A1628', margin: '0 0 10px' }}>
          {t.bookingTitle}
        </h1>
        <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginBottom: '12px' }} />
        <p style={{ color: '#2A2A2A', opacity: 0.6, fontFamily: 'Outfit, sans-serif', fontSize: '15px', marginBottom: '32px', maxWidth: '580px' }}>
          {t.bookingSubtitle}
        </p>

        {/* Details strip */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
          {[
            { icon: '⏱', label: '15 min' },
            { icon: '📅', label: 'Lun – Jue · 8–9 AM' },
            { icon: '🎥', label: 'Google Meet' },
            { icon: '👨‍⚕️', label: 'Dr. Fernando Valenzuela' },
          ].map(d => (
            <div key={d.label} style={{
              background: '#fff', border: '1px solid #E5E5E5', borderRadius: '10px',
              padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px',
              fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#2A2A2A',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <span>{d.icon}</span>
              <span>{d.label}</span>
            </div>
          ))}
        </div>

        {/* Calendly embed */}
        <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <InlineWidget
            url={CALENDLY_URL}
            styles={{ height: '700px', minWidth: '320px' }}
            pageSettings={{
              backgroundColor: 'FFFFFF',
              primaryColor: '0A1628',
              textColor: '2A2A2A',
              hideLandingPageDetails: false,
            }}
          />
        </div>
      </div>
    </div>
  )
}
