import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,194,168,0.06)_0%,transparent_70%)]" />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-gold">PeptBiohacking</h1>
          <p className="text-white/40 text-sm mt-2">Portal Médico</p>
        </div>
        <div className="card space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="input-field" placeholder="tu@email.com" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Contraseña</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="input-field" placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={handleLogin} disabled={loading} className="w-full btn-primary">
            {loading ? 'Entrando...' : 'Iniciar Sesión'}
          </button>
          <p className="text-center text-xs text-white/40">
            ¿Sin cuenta? <Link to="/register" className="text-teal hover:underline">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
