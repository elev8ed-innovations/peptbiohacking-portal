import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'

const WA_NUMBER = '526624242441'
const DR_NAME = 'Dr. Fernando Valenzuela'

export default function Chat({ profile }) {
  const navigate = useNavigate()

  const quickMessages = [
    { label: 'Tengo una pregunta sobre mi protocolo', icon: '💊' },
    { label: 'Quiero agendar una cita de seguimiento', icon: '📅' },
    { label: 'Tuve una reacción o efecto secundario', icon: '⚠️' },
    { label: 'Recibí mis péptidos y tengo dudas', icon: '📦' },
    { label: 'Me siento muy bien, ¡gracias!', icon: '🎯' },
  ]

  function openWA(message) {
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen">
      <Navbar profile={profile} />
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/patient')} className="text-white/40 hover:text-white">←</button>
          <h1 className="font-display text-3xl text-white">Chat</h1>
        </div>

        <div className="card text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-teal/20 border-2 border-teal flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">👨‍⚕️</span>
          </div>
          <h2 className="font-display text-xl text-white">{DR_NAME}</h2>
          <p className="text-white/40 text-xs mt-1">COFEPRIS #4667632</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
            <span className="text-teal text-xs">Disponible vía WhatsApp</span>
          </div>
        </div>

        <h2 className="font-display text-lg text-white mb-3">Mensajes Rápidos</h2>
        <div className="space-y-2 mb-6">
          {quickMessages.map((m, i) => (
            <button
              key={i}
              onClick={() => openWA(`Hola ${DR_NAME}, soy ${profile?.full_name}. ${m.label}`)}
              className="w-full card hover:border-teal/40 text-left flex items-center gap-3 transition-colors"
            >
              <span className="text-xl">{m.icon}</span>
              <span className="text-white/70 text-sm">{m.label}</span>
              <span className="ml-auto text-white/20">→</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => openWA(`Hola ${DR_NAME}, soy ${profile?.full_name}. `)}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <span>💬</span> Abrir WhatsApp
        </button>
        <p className="text-white/20 text-xs text-center mt-3">Redirige a WhatsApp</p>
      </div>
    </div>
  )
}
