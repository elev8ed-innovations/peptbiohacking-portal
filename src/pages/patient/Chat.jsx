import Navbar from '../../components/Navbar'

const DR_WHATSAPP = '526622250593'

export default function Chat() {
  const openWhatsApp = (msg = '') => {
    const text = encodeURIComponent(msg || 'Hola Dr. Valenzuela, le escribo desde el portal PeptBiohacking.')
    window.open(`https://wa.me/${DR_WHATSAPP}?text=${text}`, '_blank')
  }

  const quickMessages = [
    { label: 'Consulta general', msg: 'Hola Dr. Valenzuela, tengo una pregunta sobre mi protocolo.' },
    { label: 'Efecto secundario', msg: 'Hola Dr. Valenzuela, quiero reportar un efecto que estoy notando con mi protocolo.' },
    { label: 'Resultados de laboratorio', msg: 'Hola Dr. Valenzuela, tengo mis resultados de laboratorio listos para revisar.' },
    { label: 'Agendar seguimiento', msg: 'Hola Dr. Valenzuela, me gustaría agendar una consulta de seguimiento.' },
  ]

  return (
    <div className="min-h-screen bg-navy">
      <Navbar role="patient" />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-white font-light">Mensajes</h1>
          <p className="text-white/40 mt-1 text-sm">Comunícate directamente con el Dr. Valenzuela</p>
        </div>

        {/* Doctor card */}
        <div className="card border-teal/20 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal/10 border border-teal/30 flex items-center justify-center flex-shrink-0">
              <span className="font-display text-teal text-lg">FV</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Dr. Fernando Valenzuela</p>
              <p className="text-white/40 text-xs mt-0.5">Médico tratante · COFEPRIS #4667632</p>
            </div>
            <button onClick={() => openWhatsApp()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-xl transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>
          </div>
        </div>

        {/* Quick messages */}
        <div className="card">
          <h2 className="font-display text-xl text-white mb-4">Mensajes rápidos</h2>
          <div className="space-y-2">
            {quickMessages.map((m, i) => (
              <button key={i} onClick={() => openWhatsApp(m.msg)}
                className="w-full text-left p-4 rounded-xl border border-white/5 hover:border-teal/30 hover:bg-white/5 transition-all duration-200 group">
                <p className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">{m.label}</p>
                <p className="text-white/30 text-xs mt-0.5 truncate">{m.msg}</p>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Los mensajes se abren en WhatsApp. Tiempo de respuesta: 24–48 hrs hábiles.
        </p>
      </div>
    </div>
  )
}
