import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'

export default function EmailConfirmed() {
  const navigate = useNavigate()
  const { lang, toggleLang } = useLang()

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>

      {/* Lang toggle */}
      <button onClick={toggleLang} style={{
        position: 'fixed', top: '20px', right: '20px',
        background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.5)',
        color: '#C9A84C', padding: '5px 14px', borderRadius: '20px',
        fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600, cursor: 'pointer', letterSpacing: '1px',
      }}>{lang === 'es' ? 'EN' : 'ES'}</button>

      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '30px', fontWeight: 700, letterSpacing: '4px' }}>
            <span style={{ color: '#0A1628' }}>PEPT</span>
            <span style={{ color: '#00C2A8' }}>BIO</span>
            <span style={{ color: '#0A1628' }}>HACKING</span>
          </div>
          <div style={{ color: '#2A2A2A', opacity: 0.45, fontSize: '11px', letterSpacing: '3px', marginTop: '5px', fontFamily: 'Outfit, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>
            {lang === 'es' ? 'Portal Médico' : 'Medical Portal'}
          </div>
          <div style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)', margin: '10px auto 0' }} />
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', border: '1px solid #E5E5E5',
          borderRadius: '16px', padding: '40px 32px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          textAlign: 'center',
        }}>

          {/* Check icon */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(0,194,168,0.1)', border: '2px solid rgba(0,194,168,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <span style={{ fontSize: '28px', color: '#00C2A8' }}>✓</span>
          </div>

          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: '#0A1628', margin: '0 0 12px' }}>
            {lang === 'es' ? 'Correo confirmado' : 'Email Confirmed'}
          </h1>

          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: '#2A2A2A', opacity: 0.6, lineHeight: 1.6, margin: '0 0 32px' }}>
            {lang === 'es'
              ? 'Tu cuenta ha sido verificada. Ya puedes acceder a tu portal médico.'
              : 'Your account has been verified. You\'re ready to access your portal.'}
          </p>

          <button
            onClick={() => navigate('/login')}
            style={{
              width: '100%', padding: '14px', minHeight: '48px',
              background: '#0A1628', border: 'none', borderRadius: '10px',
              color: '#fff', fontFamily: 'Outfit, sans-serif',
              fontWeight: 700, fontSize: '15px', cursor: 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            {lang === 'es' ? 'Iniciar sesión →' : 'Sign In to Portal →'}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#2A2A2A', opacity: 0.3, fontSize: '11px', fontFamily: 'Outfit, sans-serif' }}>
          peptbiohacking.mx · {lang === 'es' ? 'Uso exclusivo para pacientes y médicos registrados' : 'Exclusive use for registered patients and physicians'}
        </p>
      </div>
    </div>
  )
}
