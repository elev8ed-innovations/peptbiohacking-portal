import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLang } from '../context/LanguageContext'

const inp = {
  width: '100%', padding: '13px 16px',
  background: '#fff', border: '1px solid #E5E5E5',
  borderRadius: '10px', color: '#2A2A2A',
  fontFamily: 'Outfit, sans-serif', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box',
}

export default function Login() {
  const navigate = useNavigate()
  const { t, lang, toggleLang } = useLang()
  const [gateCleared, setGateCleared] = useState(false)
  const [ageCheck, setAgeCheck] = useState(false)
  const [researchCheck, setResearchCheck] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      navigate(profile?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard')
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const Wordmark = () => (
    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
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
  )

  const LangToggle = () => (
    <button onClick={toggleLang} style={{
      position: 'fixed', top: '20px', right: '20px',
      background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.5)',
      color: '#C9A84C', padding: '5px 14px', borderRadius: '20px',
      fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600, cursor: 'pointer', letterSpacing: '1px',
    }}>{lang === 'es' ? 'EN' : 'ES'}</button>
  )

  const CheckBox = ({ checked, onToggle, children }) => (
    <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '20px' }} onClick={onToggle}>
      <div style={{
        width: '22px', height: '22px', minWidth: '22px', borderRadius: '5px',
        border: `2px solid ${checked ? '#0A1628' : '#E5E5E5'}`,
        background: checked ? '#0A1628' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px', transition: 'all 0.15s',
      }}>
        {checked && <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>✓</span>}
      </div>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: '#2A2A2A', lineHeight: 1.5 }}>
        {children}
      </div>
    </label>
  )

  // Gate screen
  if (!gateCleared) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4 py-12">
        <LangToggle />
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <Wordmark />
          <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginTop: '24px' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: '#0A1628', marginBottom: '4px' }}>
              {lang === 'es' ? 'Bienvenido' : 'Welcome'}
            </h2>
            <p style={{ color: '#2A2A2A', opacity: 0.5, fontSize: '13px', fontFamily: 'Outfit, sans-serif', marginBottom: '24px' }}>
              {lang === 'es' ? 'Confirma los siguientes puntos para acceder' : 'Confirm the following points to access'}
            </p>

            <CheckBox checked={ageCheck} onToggle={() => setAgeCheck(!ageCheck)}>
              <span style={{ fontWeight: 500 }}>
                {lang === 'es' ? 'Confirmo que tengo 18 años o más' : 'I confirm that I am 18 years of age or older'}
              </span>
              <br />
              <span style={{ fontSize: '12px', opacity: 0.55 }}>
                {lang === 'es' ? 'Este portal contiene información médica para adultos.' : 'This portal contains medical information for adults.'}
              </span>
            </CheckBox>

            <CheckBox checked={researchCheck} onToggle={() => setResearchCheck(!researchCheck)}>
              <span style={{ fontWeight: 500 }}>
                {lang === 'es' ? 'Entiendo que este portal es de uso educativo e investigativo' : 'I understand this portal is for educational and research use'}
              </span>
              <br />
              <span style={{ fontSize: '12px', opacity: 0.55 }}>
                {lang === 'es'
                  ? 'El contenido es supervisado por un médico certificado y no sustituye el diagnóstico médico independiente.'
                  : 'Content is supervised by a licensed physician and does not substitute independent medical diagnosis.'}
              </span>
            </CheckBox>

            <button
              onClick={() => { if (ageCheck && researchCheck) setGateCleared(true) }}
              disabled={!ageCheck || !researchCheck}
              style={{
                width: '100%', padding: '14px', minHeight: '44px',
                background: ageCheck && researchCheck ? '#0A1628' : '#E5E5E5',
                border: 'none', borderRadius: '10px',
                color: ageCheck && researchCheck ? '#fff' : '#2A2A2A',
                fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '15px',
                cursor: ageCheck && researchCheck ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
              }}
            >
              {lang === 'es' ? 'Continuar al acceso' : 'Continue to access'}
            </button>
          </div>
          <p style={{ textAlign: 'center', marginTop: '20px', color: '#2A2A2A', opacity: 0.3, fontSize: '11px', fontFamily: 'Outfit, sans-serif' }}>
            peptbiohacking.mx · {lang === 'es' ? 'Uso exclusivo para pacientes y médicos registrados' : 'Exclusive use for registered patients and physicians'}
          </p>
        </div>
      </div>
    )
  }

  // Login form
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4 py-12">
      <LangToggle />
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <Wordmark />
        <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginTop: '24px' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: '#0A1628', marginBottom: '24px' }}>
            {lang === 'es' ? 'Iniciar sesión' : 'Sign In'}
          </h2>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2A2A2A', opacity: 0.55, fontFamily: 'Outfit, sans-serif', marginBottom: '6px' }}>
                {lang === 'es' ? 'Correo electrónico' : 'Email'}
              </label>
              <input style={inp} type="email" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2A2A2A', opacity: 0.55, fontFamily: 'Outfit, sans-serif', marginBottom: '6px' }}>
                {lang === 'es' ? 'Contraseña' : 'Password'}
              </label>
              <input style={inp} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            {error && <p style={{ color: '#dc2626', fontSize: '13px', fontFamily: 'Outfit, sans-serif' }}>{error}</p>}

            <button type="submit" disabled={loading} style={{
              padding: '14px', background: loading ? '#1A2B47' : '#0A1628',
              border: 'none', borderRadius: '10px', color: '#fff', minHeight: '44px',
              fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              {loading ? (
                <>
                  <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                  {lang === 'es' ? 'Entrando...' : 'Signing in...'}
                </>
              ) : (lang === 'es' ? 'Iniciar sesión' : 'Sign In')}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: '#2A2A2A', opacity: 0.5, fontSize: '13px', fontFamily: 'Outfit, sans-serif', marginTop: '20px' }}>
            {lang === 'es' ? '¿No tienes cuenta? ' : "Don't have an account? "}
            <Link to="/register" style={{ color: '#00C2A8', fontWeight: 600, textDecoration: 'none' }}>
              {lang === 'es' ? 'Regístrate' : 'Sign up'}
            </Link>
          </p>
        </div>
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#2A2A2A', opacity: 0.3, fontSize: '11px', fontFamily: 'Outfit, sans-serif' }}>
          peptbiohacking.mx · {lang === 'es' ? 'Uso exclusivo para pacientes y médicos registrados' : 'Exclusive use for registered patients and physicians'}
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
