import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name, role: form.role } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: form.name,
        role: form.role,
        email: form.email,
      })
    }
    setSuccess(true)
    setLoading(false)
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-navy">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-teal/10 border border-teal/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="font-display text-2xl text-white mb-2">¡Registro exitoso!</h2>
        <p className="text-white/50 text-sm mb-6">Revisa tu correo para confirmar tu cuenta, luego inicia sesión.</p>
        <Link to="/login" className="btn-primary inline-block text-center font-body">Ir a iniciar sesión</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-navy relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #00C2A8 0%, transparent 70%)' }} />

      <div className="relative z-10 text-center mb-8">
        <h1 className="font-display text-4xl font-light tracking-widest text-white">
          PEPT<span className="text-teal">BIO</span>HACKING
        </h1>
        <p className="text-white/40 text-sm tracking-wider mt-1">PORTAL MÉDICO</p>
        <div className="w-16 h-px bg-gold mx-auto mt-3" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-navy-light border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="font-display text-2xl font-medium text-white mb-1">Crear cuenta</h2>
          <p className="text-white/50 text-sm mb-6">Completa el formulario para registrarte</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5 tracking-wide uppercase">Nombre completo</label>
              <input name="name" type="text" className="input-field" placeholder="Dr. Fernando Valenzuela" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5 tracking-wide uppercase">Correo electrónico</label>
              <input name="email" type="email" className="input-field" placeholder="correo@ejemplo.com" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5 tracking-wide uppercase">Contraseña</label>
              <input name="password" type="password" className="input-field" placeholder="Mínimo 8 caracteres" value={form.password} onChange={handleChange} required minLength={8} />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5 tracking-wide uppercase">Tipo de cuenta</label>
              <select name="role" className="input-field" value={form.role} onChange={handleChange}>
                <option value="patient">Paciente</option>
                <option value="doctor">Médico</option>
              </select>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                  Creando cuenta...
                </span>
              ) : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-teal hover:text-teal-dark transition-colors">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
