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

export default function Register() {
  const navigate = useNavigate()
  const { lang, toggleLang } = useLang()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // CRITICAL: pass full_name + role in user metadata so handle_new_user trigger can read them
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name, role: form.role },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    // Belt-and-suspenders upsert in case trigger fires before email is confirmed
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: form.name,
        role: form.role,
        email: form.email,
      }, { onConflict: 'id' })
    }

    setSuccess(true)
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

  if (success) return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-[#00C2A8]/10 border border-[#00C2A8]/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8" style={{ color: '#00C2A8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', color: '#0A1628', fontSize: '26px', marginBottom: '10px' }}>
          {lang === 'es' ? '¡Registro exitoso!' : 'Registration successful!'}
        </h2>
        <p style={{ color: '#2A2A2A', opacity: 0.6, fontSize: '14px', fontFamily: 'Outfit, sans-serif', marginBottom: '24px' }}>
          {lang === 'es' ? 'Revisa tu correo para confirmar tu cuenta, luego inicia sesión.' : 'Check your email to confirm your account, then sign in.'}
        </p>
        <Link to="/login" style={{ display: 'inline-block', padding: '13px 32px', background: '#0A1628', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px' }}>
          {lang === 'es' ? 'Ir a iniciar sesión' : 'Go to sign in'}
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4 py-12">
      {/* Lang toggle */}
      <button onClick={toggleLang} style={{
        position: 'fixed', top: '20px', right: '20px',
        background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.5)',
        color: '#C9A84C', padding: '5px 14px', borderRadius: '20px',
        fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600, cursor: 'pointer', letterSpacing: '1px',
      }}>{lang === 'es' ? 'EN' : 'ES'}</button>

      <div style={{ width: '100%', maxWidth: '420px' }}>
        <Wordmark />

        <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginTop: '24px' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: '#0A1628', marginBottom: '4px' }}>
            {lang === 'es' ? 'Crear cuenta' : 'Create Account'}
          </h2>
          <p style={{ color: '#2A2A2A', opacity: 0.5, fontSize: '13px', fontFamily: 'Outfit, sans-serif', marginBottom: '24px' }}>
            {lang === 'es' ? 'Completa el formulario para registrarte' : 'Complete the form to register'}
          </p>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2A2A2A', opacity: 0.55, fontFamily: 'Outfit, sans-serif', marginBottom: '6px' }}>
                {lang === 'es' ? 'Nombre completo' : 'Full Name'}
              </label>
              <input name="name" type="text" style={inp} placeholder={lang === 'es' ? 'Dr. Fernando Valenzuela' : 'Jane Doe'} value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2A2A2A', opacity: 0.55, fontFamily: 'Outfit, sans-serif', marginBottom: '6px' }}>
                {lang === 'es' ? 'Correo electrónico' : 'Email'}
              </label>
              <input name="email" type="email" style={inp} placeholder="correo@ejemplo.com" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2A2A2A', opacity: 0.55, fontFamily: 'Outfit, sans-serif', marginBottom: '6px' }}>
                {lang === 'es' ? 'Contraseña' : 'Password'}
              </label>
              <input name="password" type="password" style={inp} placeholder={lang === 'es' ? 'Mínimo 8 caracteres' : 'Minimum 8 characters'} value={form.password} onChange={handleChange} required minLength={8} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2A2A2A', opacity: 0.55, fontFamily: 'Outfit, sans-serif', marginBottom: '6px' }}>
                {lang === 'es' ? 'Tipo de cuenta' : 'Account Type'}
              </label>
              <select name="role" style={{ ...inp, cursor: 'pointer' }} value={form.role} onChange={handleChange}>
                <option value="patient">{lang === 'es' ? 'Paciente' : 'Patient'}</option>
                <option value="doctor">{lang === 'es' ? 'Médico' : 'Doctor'}</option>
              </select>
            </div>

            {error && <p style={{ color: '#dc2626', fontSize: '13px', fontFamily: 'Outfit, sans-serif' }}>{error}</p>}

            <button type="submit" disabled={loading} style={{
              padding: '14px', background: loading ? '#1A2B47' : '#0A1628',
              border: 'none', borderRadius: '10px', color: '#fff',
              fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer', minHeight: '44px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              {loading ? (
                <>
                  <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                  {lang === 'es' ? 'Creando cuenta...' : 'Creating account...'}
                </>
              ) : (lang === 'es' ? 'Crear cuenta' : 'Create Account')}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: '#2A2A2A', opacity: 0.5, fontSize: '13px', fontFamily: 'Outfit, sans-serif', marginTop: '20px' }}>
            {lang === 'es' ? '¿Ya tienes cuenta? ' : 'Already have an account? '}
            <Link to="/login" style={{ color: '#00C2A8', fontWeight: 600, textDecoration: 'none' }}>
              {lang === 'es' ? 'Inicia sesión' : 'Sign in'}
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#2A2A2A', opacity: 0.3, fontSize: '11px', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.5px' }}>
          peptbiohacking.mx · {lang === 'es' ? 'Uso exclusivo para pacientes y médicos registrados' : 'Exclusive use for registered patients and physicians'}
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
