import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [step, setStep] = useState('gate') // gate | login
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [waiverAccepted, setWaiverAccepted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGateContinue = () => {
    if (!ageConfirmed || !waiverAccepted) {
      setError('Debes confirmar ambas opciones para continuar.')
      return
    }
    setError('')
    setStep('login')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    navigate(profile?.role === 'doctor' ? '/doctor' : '/patient')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-navy" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #00C2A8 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-5"
        style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }} />

      {/* Logo */}
      <div className="relative z-10 text-center mb-8">
        <h1 className="font-display text-4xl font-light tracking-widest text-white">
          PEPT<span className="text-teal">BIO</span>HACKING
        </h1>
        <p className="text-white/40 text-sm tracking-wider mt-1 font-body">PORTAL MÉDICO</p>
        <div className="w-16 h-px bg-gold mx-auto mt-3" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-navy-light border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

          {/* STEP 1 — Combined Gate */}
          {step === 'gate' && (
            <div className="p-8">
              <h2 className="font-display text-2xl font-medium text-white mb-1">Bienvenido</h2>
              <p className="text-white/50 text-sm mb-6">Confirma los siguientes puntos para acceder</p>

              <div className="space-y-4 mb-6">
                {/* Age confirmation */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={ageConfirmed}
                      onChange={e => setAgeConfirmed(e.target.checked)}
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${ageConfirmed ? 'bg-teal border-teal' : 'border-white/30 group-hover:border-teal/50'}`}>
                      {ageConfirmed && (
                        <svg className="w-3 h-3 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Confirmo que tengo 18 años o más</p>
                    <p className="text-white/40 text-xs mt-0.5">Este portal contiene información médica para adultos</p>
                  </div>
                </label>

                {/* Waiver */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={waiverAccepted}
                      onChange={e => setWaiverAccepted(e.target.checked)}
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${waiverAccepted ? 'bg-teal border-teal' : 'border-white/30 group-hover:border-teal/50'}`}>
                      {waiverAccepted && (
                        <svg className="w-3 h-3 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Acepto el aviso médico COFEPRIS</p>
                    <p className="text-white/40 text-xs mt-0.5">Los servicios ofrecidos son bajo supervisión médica. Los péptidos son para uso bajo prescripción. Cédula Prof. #4667632.</p>
                  </div>
                </label>
              </div>

              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

              <button
                onClick={handleGateContinue}
                className="btn-primary font-body"
              >
                Continuar al acceso
              </button>
            </div>
          )}

          {/* STEP 2 — Login form */}
          {step === 'login' && (
            <div className="p-8">
              <button onClick={() => setStep('gate')} className="flex items-center gap-1 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Regresar
              </button>

              <h2 className="font-display text-2xl font-medium text-white mb-1">Iniciar sesión</h2>
              <p className="text-white/50 text-sm mb-6">Ingresa tus credenciales de acceso</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-1.5 tracking-wide uppercase">Correo electrónico</label>
                  <input
                    type="email"
                    className="input-field font-body"
                    placeholder="doctor@ejemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-1.5 tracking-wide uppercase">Contraseña</label>
                  <input
                    type="password"
                    className="input-field font-body"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button type="submit" disabled={loading} className="btn-primary font-body disabled:opacity-50">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                      Entrando...
                    </span>
                  ) : 'Entrar al portal'}
                </button>
              </form>

              <p className="text-center text-white/40 text-sm mt-6">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="text-teal hover:text-teal-dark transition-colors">
                  Regístrate
                </Link>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          peptbiohacking.mx · Uso exclusivo para pacientes y médicos registrados
        </p>
      </div>
    </div>
  )
}
