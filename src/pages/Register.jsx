import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function set(field, val) { setForm(f => ({ ...f, [field]: val })) }

  async function handleRegister() {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, role: 'patient' } }
    })
    if (error) setError(error.message)
    else setSuccess(true)
    setLoading(false)
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card text-center max-w-sm w-full">
        <div className="text-4xl mb-4">✉️</div>
        <h2 className="font-display text-2xl text-gold mb-2">¡Revisa tu email!</h2>
        <p className="text-white/60 text-sm">Te enviamos un enlace de confirmación. Haz clic para activar tu cuenta.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,194,168,0.06)_0%,transparent_70%)]" />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-gold">PeptBiohacking</h1>
          <p className="text-white/40 text-sm mt-2">Crea tu cuenta</p>
        </div>
        <div className="card space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Nombre completo</label>
            <input value={form.full_name} onChange={e => set('full_name', e.target.value)} className="input-field" placeholder="Juan García" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Email</label>
            <input value={form.email} onChange={e => set('email', e.target.value)} type="email" className="input-field" placeholder="tu@email.com" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Contraseña</label>
            <input value={form.password} onChange={e => set('password', e.target.value)} type="password" className="input-field" placeholder="Mínimo 6 caracteres" />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={handleRegister} disabled={loading} className="w-full btn-primary">
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
          <p className="text-center text-xs text-white/40">
            ¿Ya tienes cuenta? <Link to="/" className="text-teal hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
