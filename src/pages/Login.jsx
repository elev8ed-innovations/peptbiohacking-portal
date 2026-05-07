import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLang } from '../context/LanguageContext'

export default function Login() {
  const navigate = useNavigate()
  const { t, lang, toggleLang } = useLang()
  const [gateCleared, setGateCleared] = useState(false)
  const [ageCheck, setAgeCheck] = useState(false)
  const [waiverCheck, setWaiverCheck] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('patient')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async () => {
    setLoading(true)
    setError('')
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, role } }
        })
        if (error) throw error
        navigate(role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
        navigate(profile?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard')
      }
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0A1628 0%, #0D1F3C 60%, #0A1628 100%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '20px', position: 'relative', fontFamily: 'Outfit, sans-serif',
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,194,168,0.25)',
    borderRadius: '8px', color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box',
  }

  const btnPrimary = {
    width: '100%', padding: '14px',
    background: '#00C2A8',
    border: 'none', borderRadius: '8px', color: '#0A1628',
    fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 600,
    cursor: 'pointer', letterSpacing: '0.5px',
  }

  // Wordmark
  const Wordmark = () => (
    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', fontWeight: 700, letterSpacing: '4px' }}>
        <span style={{ color: '#fff' }}>PEPT </span>
        <span style={{ color: '#00C2A8' }}>BIO</span>
        <span style={{ color: '#fff' }}> HACKING</span>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '3px', marginTop: '6px', fontFamily: 'Outfit, sans-serif' }}>
        {lang === 'es' ? 'PORTAL MÉDICO' : 'MEDICAL PORTAL'}
      </div>
      <div style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)', margin: '12px auto 0' }} />
    </div>
  )

  // Lang toggle button
  const LangToggle = () => (
    <button onClick={toggleLang} style={{
      position: 'absolute', top: '20px', right: '20px',
      background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)',
      color: '#C9A84C', padding: '5px 14px', borderRadius: '20px',
      fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600, cursor: 'pointer', letterSpacing: '1px',
    }}>{lang === 'es' ? 'EN' : 'ES'}</button>
  )

  const cardStyle = {
    background: 'rgba(10,22,40,0.85)',
    border: '1px solid rgba(0,194,168,0.15)',
    borderRadius: '12px', padding: '32px 36px',
    width: '100%', maxWidth: '440px',
    backdropFilter: 'blur(20px)',
    marginTop: '24px',
  }

  if (!gateCleared) {
    return (
      <div style={pageStyle}>
        <LangToggle />
        <Wordmark />

        <div style={cardStyle}>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: '0 0 4px', fontFamily: 'Cormorant Garamond, serif' }}>
            {lang === 'es' ? 'Bienvenido' : 'Welcome'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', margin: '0 0 24px' }}>
            {lang === 'es' ? 'Confirma los siguientes puntos para acceder' : 'Confirm the following points to access'}
          </p>

          {/* Age checkbox */}
          <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '20px' }}
            onClick={() => setAgeCheck(!ageCheck)}>
            <div style={{
              width: '20px', height: '20px', minWidth: '20px', borderRadius: '4px',
              border: `2px solid ${ageCheck ? '#00C2A8' : 'rgba(255,255,255,0.2)'}`,
              background: ageCheck ? '#00C2A8' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', transition: 'all 0.2s',
            }}>
              {ageCheck && <span style={{ color: '#0A1628', fontSize: '12px', fontWeight: 700 }}>✓</span>}
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500, marginBottom: '3px' }}>
                {lang === 'es' ? 'Confirmo que tengo 18 años o más' : 'I confirm that I am 18 years of age or older'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                {lang === 'es' ? 'Este portal contiene información médica para adultos.' : 'This portal contains medical information for adults.'}
              </div>
            </div>
          </label>

          {/* COFEPRIS checkbox */}
          <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '28px' }}
            onClick={() => setWaiverCheck(!waiverCheck)}>
            <div style={{
              width: '20px', height: '20px', minWidth: '20px', borderRadius: '4px',
              border: `2px solid ${waiverCheck ? '#00C2A8' : 'rgba(255,255,255,0.2)'}`,
              background: waiverCheck ? '#00C2A8' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', transition: 'all 0.2s',
            }}>
              {waiverCheck && <span style={{ color: '#0A1628', fontSize: '12px', fontWeight: 700 }}>✓</span>}
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500, marginBottom: '3px' }}>
                {lang === 'es' ? 'Acepto el aviso médico COFEPRIS' : 'I accept the COFEPRIS medical notice'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', lineHeight: '1.5' }}>
                {lang === 'es'
                  ? `Los servicios ofrecidos están bajo supervisión médica. Los péptidos son de uso bajo prescripción. Cédula Profesional #4667632.`
                  : `The services offered are under medical supervision. Peptides are for prescription use only. Professional License #4667632.`}
              </div>
            </div>
          </label>

          <button
            onClick={() => { if (ageCheck && waiverCheck) setGateCleared(true) }}
            disabled={!ageCheck || !waiverCheck}
            style={{ ...btnPrimary, opacity: (!ageCheck || !waiverCheck) ? 0.4 : 1, cursor: (!ageCheck || !waiverCheck) ? 'not-allowed' : 'pointer' }}
          >
            {lang === 'es' ? 'Continuar al acceso' : 'Continue to access'}
          </button>
        </div>

        <div style={{ marginTop: '24px', color: 'rgba(255,255,255,0.25)', fontSize: '11px', letterSpacing: '0.5px' }}>
          peptbiohacking.mx · {lang === 'es' ? 'Uso exclusivo para pacientes y médicos registrados' : 'Exclusive use for registered patients and physicians'}
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <LangToggle />
      <Wordmark />

      <div style={cardStyle}>
        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: '0 0 20px', fontFamily: 'Cormorant Garamond, serif' }}>
          {isRegister ? (lang === 'es' ? 'Crear cuenta' : 'Create Account') : (lang === 'es' ? 'Iniciar sesión' : 'Sign In')}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isRegister && (
            <input style={inputStyle} placeholder={lang === 'es' ? 'Nombre completo' : 'Full Name'} value={fullName} onChange={e => setFullName(e.target.value)} />
          )}
          <input style={inputStyle} placeholder={lang === 'es' ? 'Correo electrónico' : 'Email'} type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <input style={inputStyle} placeholder={lang === 'es' ? 'Contraseña' : 'Password'} type="password" value={password} onChange={e => setPassword(e.target.value)} />
          {isRegister && (
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={role} onChange={e => setRole(e.target.value)}>
              <option value="patient">{lang === 'es' ? 'Paciente' : 'Patient'}</option>
              <option value="doctor">{lang === 'es' ? 'Médico' : 'Doctor'}</option>
            </select>
          )}
        </div>

        {error && <p style={{ color: '#ff6b6b', fontSize: '13px', marginTop: '8px' }}>{error}</p>}

        <button onClick={handleAuth} disabled={loading} style={{ ...btnPrimary, marginTop: '20px', opacity: loading ? 0.7 : 1 }}>
          {loading ? '...' : (isRegister ? (lang === 'es' ? 'Crear cuenta' : 'Create Account') : (lang === 'es' ? 'Iniciar sesión' : 'Sign In'))}
        </button>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
          <span onClick={() => setIsRegister(!isRegister)} style={{ color: '#00C2A8', cursor: 'pointer' }}>
            {isRegister ? (lang === 'es' ? 'Ya tengo cuenta' : 'I already have an account') : (lang === 'es' ? 'Crear cuenta nueva' : 'Create new account')}
          </span>
        </p>
      </div>

      <div style={{ marginTop: '24px', color: 'rgba(255,255,255,0.25)', fontSize: '11px', letterSpacing: '0.5px' }}>
        peptbiohacking.mx · {lang === 'es' ? 'Uso exclusivo para pacientes y médicos registrados' : 'Exclusive use for registered patients and physicians'}
      </div>
    </div>
  )
}
