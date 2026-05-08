import { supabase } from '../lib/supabase'
import { useLang } from '../context/LanguageContext'

export default function IntroModal({ onDismiss }) {
  const { lang } = useLang()

  const dismiss = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ has_seen_intro: true }).eq('id', user.id)
    }
    onDismiss()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '40px 32px',
        maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '48px' }}>🌿</span>
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: '28px',
          color: '#0A1628', textAlign: 'center', marginBottom: '6px',
        }}>
          {lang === 'es' ? 'Bienvenido a Tu Viaje de Péptidos' : 'Welcome to Your Peptide Journey'}
        </h2>
        <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', margin: '0 auto 24px' }} />

        {/* Body */}
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: '#2A2A2A', lineHeight: 1.7 }}>
          {lang === 'es' ? (
            <>
              <p style={{ marginBottom: '16px' }}>
                La terapia con péptidos está fundamentada en investigación clínica y medicina personalizada.
                Cada protocolo es supervisado por el <strong>Dr. Fernando Valenzuela</strong> (COFEPRIS #4667632).
              </p>
              <p style={{ marginBottom: '16px', fontWeight: 600, color: '#0A1628' }}>Algunas cosas a tener en cuenta:</p>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <li><strong>Los resultados varían</strong> — cada cuerpo, cada metabolismo, cada historia es diferente</li>
                <li><strong>La consistencia importa más que la dosis</strong> — sigue tu protocolo tal como fue prescrito</li>
                <li><strong>Tus check-ins de bienestar</strong> ayudan al Dr. V a personalizar tu atención con el tiempo</li>
                <li><strong>Contácta al Dr. V</strong> a través del portal cuando tengas preguntas</li>
              </ul>
              <p style={{ fontSize: '12px', color: '#2A2A2A', opacity: 0.5, marginBottom: '24px', borderTop: '1px solid #E5E5E5', paddingTop: '16px' }}>
                Los resultados individuales pueden variar. Esta plataforma no sustituye el juicio clínico. La información aquí es exclusivamente de carácter educativo y de apoyo al tratamiento prescrito.
              </p>
            </>
          ) : (
            <>
              <p style={{ marginBottom: '16px' }}>
                Peptide therapy is grounded in clinical research and personalized medicine.
                Every protocol is supervised by <strong>Dr. Fernando Valenzuela</strong> (COFEPRIS #4667632).
              </p>
              <p style={{ marginBottom: '16px', fontWeight: 600, color: '#0A1628' }}>A few things to keep in mind:</p>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <li><strong>Results vary</strong> — every body, every metabolism, every history is different</li>
                <li><strong>Consistency matters more than dose</strong> — follow your protocol as prescribed</li>
                <li><strong>Your wellness check-ins</strong> help Dr. V personalize your care over time</li>
                <li><strong>Contact Dr. V</strong> through the portal anytime you have questions</li>
              </ul>
              <p style={{ fontSize: '12px', color: '#2A2A2A', opacity: 0.5, marginBottom: '24px', borderTop: '1px solid #E5E5E5', paddingTop: '16px' }}>
                Individual results may vary. This platform does not replace clinical judgment. Information here is exclusively educational and supportive of the prescribed treatment.
              </p>
            </>
          )}

          <button
            onClick={dismiss}
            style={{
              width: '100%', padding: '14px', minHeight: '44px',
              background: '#0A1628', border: 'none', borderRadius: '10px',
              color: '#fff', fontFamily: 'Outfit, sans-serif', fontWeight: 700,
              fontSize: '15px', cursor: 'pointer',
            }}
          >
            {lang === 'es' ? 'Entendido — ¡comencemos!' : "I understand — let's begin"}
          </button>
        </div>
      </div>
    </div>
  )
}
