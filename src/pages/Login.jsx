import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLang } from '../context/LanguageContext'

const Wordmark = ({ size = 28 }) => (
  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: size, fontWeight: 700, letterSpacing: '2px' }}>
    <span style={{ color: '#ffffff' }}>PEPT</span>
    <span style={{ color: '#00C2A8' }}>BIO</span>
    <span style={{ color: '#ffffff' }}>HACKING</span>
  </span>
)

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
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px', position: 'relative',
  }

  const cardStyle = {
    background: 'rgba(13,31,60,0.9)', border: '1px solid rgba(0,194,168,0.2)',
    borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px',
    backdropFilter: 'blur(20px)',
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,194,168,0.2)',
    borderRadius: '8px', color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box',
  }

  const btnStyle = {
    width: '100%', padding: '13px',
    background: 'linear-gradient(135deg, #00C2A8, #00A891)',
    border: 'none', borderRadius: '8px', color: '#0A1628',
    fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginTop: '8px',
  }

  const langBtn = (
    <button onClick={toggleLang} style={{
      position: 'absolute', top: '20px', right: '20px',
      background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)',
      color: '#C9A84C', padding: '5px 14px', borderRadius: '20px',
      fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
    }}>{lang === 'es' ? 'EN' : 'ES'}</button>
  )

  if (!gateCleared) {
    return (
      <div style={pageStyle}>
        {langBtn}
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Wordmark size={26} />
            <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', margin: '14px auto 0' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { checked: ageCheck, set: setAgeCheck, label: t.gateAge },
              { checked: waiverCheck, set: setWaiverCheck, label: t.gateWaiver },
            ].map((item, i) => (
              <label key={i} style={{ display: 'flex', gap: '12px', cursor: 'pointer', alignItems: 'flex-start' }}>
                <div onClick={() => item.set(!item.checked)} style={{
                  width: '20px', height: '20px', minWidth: '20px', borderRadius: '4px',
                  border: '2px solid rgba(0,194,168,0.5)',
                  background: item.checked ? '#00C2A8' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: '2px', transition: 'all 0.2s',
                }}>
                  {item.checked && <span style={{ color: '#0A1628', fontSize: '13px', fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.5' }}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>

          <button
            onClick={() => { if (ageCheck && waiverCheck) setGateCleared(true) }}
            disabled={!ageCheck || !waiverCheck}
            style={{ ...btnStyle, marginTop: '24px', opacity: (!ageCheck || !waiverCheck) ? 0.4 : 1, cursor: (!ageCheck || !waiverCheck) ? 'not-allowed' : 'pointer' }}
          >{t.gateContinue}</button>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {langBtn}
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Wordmark size={24} />
          <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', margin: '12px auto 0' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isRegister && (
            <input style={inputStyle} placeholder={t.fullName} value={fullName} onChange={e => setFullName(e.target.value)} />
          )}
          <input style={inputStyle} placeholder={t.email} type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <input style={inputStyle} placeholder={t.password} type="password" value={password} onChange={e => setPassword(e.target.value)} />
          {isRegister && (
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={role} onChange={e => setRole(e.target.value)}>
              <option value="patient">{t.patient}</option>
              <option value="doctor">{t.doctor}</option>
            </select>
          )}
        </div>

        {error && <p style={{ color: '#ff6b6b', fontSize: '13px', fontFamily: 'Outfit, sans-serif', marginTop: '8px' }}>{error}</p>}

        <button onClick={handleAuth} disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.7 : 1 }}>
          {loading ? '...' : (isRegister ? t.register : t.login)}
        </button>

        <p style={{ textAlign: 'center', marginTop: '16px', fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
          <span onClick={() => setIsRegister(!isRegister)} style={{ color: '#00C2A8', cursor: 'pointer' }}>
            {isRegister ? t.login : t.register}
          </span>
        </p>
      </div>
    </div>
  )
}
