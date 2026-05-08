import { useState } from 'react'
import Navbar from '../../components/Navbar'
import { useLang } from '../../context/LanguageContext'

const protocols = [
  {
    time: '6–8 AM',
    icon: '🌅',
    title: { en: 'Morning Light Anchor', es: 'Ancla de Luz Matutina' },
    color: '#C9A84C',
    steps: {
      en: [
        'Get outside within 30–60 min of waking',
        'Expose eyes to natural daylight (no sunglasses)',
        '10–20 min minimum; 30 min on cloudy days',
        'Sets circadian clock → better cortisol, energy, sleep',
      ],
      es: [
        'Sal al exterior dentro de los primeros 30–60 min al despertar',
        'Expón los ojos a luz natural (sin lentes de sol)',
        'Mínimo 10–20 min; 30 min en días nublados',
        'Calibra el reloj circadiano → mejor cortisol, energía y sueño',
      ],
    },
  },
  {
    time: '10 AM–2 PM',
    icon: '☀️',
    title: { en: 'Peak Alertness Window', es: 'Ventana de Alerta Máxima' },
    color: '#00C2A8',
    steps: {
      en: [
        'Use this block for high-focus cognitive work',
        'Natural light keeps cortisol & alertness elevated',
        'Avoid heavy meals — they blunt mental clarity',
        'Short sunlight breaks every 90 min reset focus',
      ],
      es: [
        'Usa este bloque para trabajo cognitivo de alta concentración',
        'La luz natural mantiene el cortisol y la alerta elevados',
        'Evita comidas pesadas — reducen la claridad mental',
        'Descansos breves al sol cada 90 min restauran el enfoque',
      ],
    },
  },
  {
    time: '5–7 PM',
    icon: '🌇',
    title: { en: 'Sunset Signal', es: 'Señal del Atardecer' },
    color: '#E8834A',
    steps: {
      en: [
        'View sunset or warm low-angle light when possible',
        'Signals your brain that night is approaching',
        'Start shifting to warmer indoor lighting',
        'Pairs well with a light walk or mobility work',
      ],
      es: [
        'Observa el atardecer o luz cálida de ángulo bajo cuando puedas',
        'Le indica a tu cerebro que se acerca la noche',
        'Empieza a cambiar a iluminación interior más cálida',
        'Combina bien con una caminata ligera o movilidad',
      ],
    },
  },
  {
    time: '8–10 PM',
    icon: '🌙',
    title: { en: 'Blue Light Blackout', es: 'Bloqueo de Luz Azul' },
    color: '#6B7FD4',
    steps: {
      en: [
        'Dim overhead lights; use lamps with warm bulbs',
        'Enable Night Mode / True Tone on all screens',
        'Consider blue-blocking glasses after 8 PM',
        'Melatonin synthesis begins 2 h before sleep',
      ],
      es: [
        'Atenúa luces del techo; usa lámparas con bombillas cálidas',
        'Activa Modo Noche / True Tone en todas las pantallas',
        'Considera lentes bloqueadores de luz azul después de las 8 PM',
        'La síntesis de melatonina comienza 2 h antes de dormir',
      ],
    },
  },
]

const scienceCards = [
  {
    icon: '🔬',
    title: { en: 'Melanopsin & Your Clock', es: 'Melanopsina y Tu Reloj' },
    body: {
      en: 'Intrinsically photosensitive retinal ganglion cells (ipRGCs) contain melanopsin, maximally sensitive to 480 nm blue-spectrum light. Morning sunlight exposure activates these cells, synchronising your suprachiasmatic nucleus (SCN) — the master circadian pacemaker.',
      es: 'Las células ganglionares retinianas intrínsecamente fotosensibles (ipRGC) contienen melanopsina, con sensibilidad máxima a 480 nm (espectro azul). La exposición matutina al sol activa estas células, sincronizando el núcleo supraquiasmático (NSQ) — el marcapasos circadiano maestro.',
    },
  },
  {
    icon: '💊',
    title: { en: 'Peptides + Light Synergy', es: 'Sinergia Péptidos + Luz' },
    body: {
      en: 'Peptides like Epithalon (Epitalon) have been studied for their role in modulating melatonin production and circadian gene expression. Optimising light exposure amplifies these effects and improves protocol outcomes.',
      es: 'Péptidos como Epitaion (Epitalon) han sido estudiados por su papel en la modulación de la producción de melatonina y la expresión de genes circadianos. Optimizar la exposición a la luz amplifica estos efectos y mejora los resultados del protocolo.',
    },
  },
  {
    icon: '😴',
    title: { en: 'Cortisol Awakening Response', es: 'Respuesta de Cortisol al Despertar' },
    body: {
      en: 'The Cortisol Awakening Response (CAR) peaks 30–45 min after waking and is 50% larger with bright morning light exposure. A robust CAR predicts better immune function, mood regulation, and metabolic health throughout the day.',
      es: 'La Respuesta de Cortisol al Despertar (CAR) alcanza su pico 30–45 min después de despertar y es 50% mayor con exposición a luz brillante matutina. Una CAR robusta predice mejor función inmune, regulación del estado de ánimo y salud metabólica durante el día.',
    },
  },
]

export default function LightHealth() {
  const { t, lang } = useLang()
  const [expanded, setExpanded] = useState(null)
  const [checked, setChecked] = useState({})

  const toggle = (i) => setExpanded(expanded === i ? null : i)
  const toggleCheck = (key) => setChecked(c => ({ ...c, [key]: !c[key] }))

  const completedToday = Object.values(checked).filter(Boolean).length
  const totalSteps = protocols.reduce((sum, p) => sum + p.steps.en.length, 0)

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <Navbar role="patient" />
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px' }}>

        {/* Header */}
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', marginBottom: '8px' }}>
          {lang === 'es' ? 'Bienestar Circadiano' : 'Circadian Wellness'}
        </p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '38px', color: '#0A1628', margin: '0 0 8px' }}>
          {t.lightHealthTitle || 'Light & Rhythm Protocol'}
        </h1>
        <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginBottom: '12px' }} />
        <p style={{ color: '#2A2A2A', opacity: 0.6, fontFamily: 'Outfit, sans-serif', fontSize: '15px', marginBottom: '32px', maxWidth: '580px' }}>
          {t.lightHealthSubtitle || 'Your daily light-exposure guide, designed to synchronise your circadian biology with your peptide protocol.'}
        </p>

        {/* Daily Progress Bar */}
        <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '14px', padding: '20px 24px', marginBottom: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#0A1628' }}>
              {lang === 'es' ? 'Progreso de hoy' : "Today's Progress"}
            </span>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#00C2A8', fontWeight: 700 }}>
              {completedToday}/{totalSteps} {lang === 'es' ? 'pasos' : 'steps'}
            </span>
          </div>
          <div style={{ background: '#E5E5E5', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '99px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', width: `${(completedToday / totalSteps) * 100}%`, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Protocol Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>
          {protocols.map((p, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              {/* Header row */}
              <button
                onClick={() => toggle(i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontSize: '28px', lineHeight: 1 }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: 600, color: p.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>{p.time}</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#0A1628' }}>{p.title[lang] || p.title.en}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '11px', fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                    color: p.color, background: `${p.color}18`, borderRadius: '99px', padding: '3px 10px',
                  }}>
                    {p.steps.en.filter((_, si) => checked[`${i}-${si}`]).length}/{p.steps.en.length}
                  </span>
                  <span style={{ color: '#0A1628', opacity: 0.35, fontSize: '16px' }}>{expanded === i ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Expandable steps */}
              {expanded === i && (
                <div style={{ borderTop: '1px solid #F0EDE8', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(p.steps[lang] || p.steps.en).map((step, si) => (
                    <label key={si} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', minHeight: '44px' }}>
                      <input
                        type="checkbox"
                        checked={!!checked[`${i}-${si}`]}
                        onChange={() => toggleCheck(`${i}-${si}`)}
                        style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: p.color, flexShrink: 0, cursor: 'pointer' }}
                      />
                      <span style={{
                        fontFamily: 'Outfit, sans-serif', fontSize: '14px', lineHeight: '1.5',
                        color: checked[`${i}-${si}`] ? '#2A2A2A' : '#0A1628',
                        opacity: checked[`${i}-${si}`] ? 0.45 : 1,
                        textDecoration: checked[`${i}-${si}`] ? 'line-through' : 'none',
                        transition: 'opacity 0.2s',
                      }}>
                        {step}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Science Cards */}
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', marginBottom: '16px' }}>
          {lang === 'es' ? 'La Ciencia' : 'The Science'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {scienceCards.map((card, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '14px', padding: '22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{card.icon}</div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#0A1628', margin: '0 0 8px' }}>
                {card.title[lang] || card.title.en}
              </h3>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', lineHeight: '1.6', color: '#2A2A2A', opacity: 0.7, margin: 0 }}>
                {card.body[lang] || card.body.en}
              </p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#2A2A2A', opacity: 0.35, marginTop: '32px', lineHeight: '1.6', textAlign: 'center' }}>
          {lang === 'es'
            ? 'Este contenido es educativo y no sustituye el consejo médico personalizado. Los resultados pueden variar.'
            : 'This content is educational and does not replace personalised medical advice. Results may vary.'}
        </p>
      </div>
    </div>
  )
}
