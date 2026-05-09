import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// ─── Quiz data ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'energy',
    label: 'Energy & Sleep',
    labelEs: 'Energía y Sueño',
    icon: '◎',
    questions: [
      {
        id: 'energy_level',
        en: 'How would you rate your daily energy levels?',
        es: '¿Cómo calificarías tu nivel de energía diario?',
        options: [
          { value: 1, en: 'Exhausted most of the day', es: 'Agotado la mayor parte del día' },
          { value: 2, en: 'Low — crashes by afternoon', es: 'Bajo — caída por la tarde' },
          { value: 3, en: 'Moderate — inconsistent', es: 'Moderado — inconsistente' },
          { value: 4, en: 'Good — mostly sustained', es: 'Bueno — mayormente sostenido' },
          { value: 5, en: 'Excellent — strong all day', es: 'Excelente — fuerte todo el día' },
        ],
      },
      {
        id: 'sleep_quality',
        en: 'How is your sleep quality?',
        es: '¿Cómo es la calidad de tu sueño?',
        options: [
          { value: 1, en: 'Very poor — restless, unrefreshing', es: 'Muy mala — inquieto, sin descanso' },
          { value: 2, en: 'Poor — wake often', es: 'Mala — me despierto frecuentemente' },
          { value: 3, en: 'Fair — some nights good', es: 'Regular — algunas noches bien' },
          { value: 4, en: 'Good — mostly restful', es: 'Buena — mayormente reparador' },
          { value: 5, en: 'Excellent — deep, consistent', es: 'Excelente — profundo y consistente' },
        ],
      },
    ],
  },
  {
    id: 'body',
    label: 'Body Composition',
    labelEs: 'Composición Corporal',
    icon: '◈',
    questions: [
      {
        id: 'body_goal',
        en: 'What is your primary body composition goal?',
        es: '¿Cuál es tu objetivo principal de composición corporal?',
        options: [
          { value: 'fat_loss', en: 'Fat loss', es: 'Pérdida de grasa' },
          { value: 'muscle_gain', en: 'Muscle gain', es: 'Ganancia muscular' },
          { value: 'recomposition', en: 'Recomposition (both)', es: 'Recomposición (ambos)' },
          { value: 'maintenance', en: 'Maintain current physique', es: 'Mantener físico actual' },
          { value: 'recovery', en: 'Recover from injury/surgery', es: 'Recuperarme de lesión/cirugía' },
        ],
        type: 'text',
      },
      {
        id: 'exercise_frequency',
        en: 'How often do you currently exercise?',
        es: '¿Con qué frecuencia haces ejercicio actualmente?',
        options: [
          { value: 1, en: 'Rarely or never', es: 'Raramente o nunca' },
          { value: 2, en: '1–2 times per week', es: '1–2 veces por semana' },
          { value: 3, en: '3–4 times per week', es: '3–4 veces por semana' },
          { value: 4, en: '5+ times per week', es: '5+ veces por semana' },
          { value: 5, en: 'Daily athletic training', es: 'Entrenamiento atlético diario' },
        ],
      },
    ],
  },
  {
    id: 'hormones',
    label: 'Hormonal Health',
    labelEs: 'Salud Hormonal',
    icon: '◉',
    questions: [
      {
        id: 'libido',
        en: 'How would you rate your libido / sexual health?',
        es: '¿Cómo calificarías tu libido / salud sexual?',
        options: [
          { value: 1, en: 'Very low — major concern', es: 'Muy bajo — preocupación importante' },
          { value: 2, en: 'Low — noticeably reduced', es: 'Bajo — notablemente reducido' },
          { value: 3, en: 'Moderate — some changes', es: 'Moderado — algunos cambios' },
          { value: 4, en: 'Good — mostly normal', es: 'Bueno — mayormente normal' },
          { value: 5, en: 'Excellent — no concerns', es: 'Excelente — sin preocupaciones' },
        ],
      },
      {
        id: 'mood_stability',
        en: 'How stable is your mood and mental wellbeing?',
        es: '¿Qué tan estable es tu estado de ánimo y bienestar mental?',
        options: [
          { value: 1, en: 'Very unstable — significant issues', es: 'Muy inestable — problemas significativos' },
          { value: 2, en: 'Often affected — anxiety/depression', es: 'Frecuentemente afectado — ansiedad/depresión' },
          { value: 3, en: 'Moderate — manageable swings', es: 'Moderado — cambios manejables' },
          { value: 4, en: 'Good — mostly positive', es: 'Bueno — mayormente positivo' },
          { value: 5, en: 'Excellent — consistent', es: 'Excelente — consistente' },
        ],
      },
    ],
  },
  {
    id: 'recovery',
    label: 'Recovery & Joints',
    labelEs: 'Recuperación y Articulaciones',
    icon: '◑',
    questions: [
      {
        id: 'joint_pain',
        en: 'Do you experience joint pain or stiffness?',
        es: '¿Experimentas dolor o rigidez en las articulaciones?',
        options: [
          { value: 1, en: 'Severe — limits daily activity', es: 'Severo — limita actividad diaria' },
          { value: 2, en: 'Moderate — noticeable daily', es: 'Moderado — notable a diario' },
          { value: 3, en: 'Mild — after exercise mostly', es: 'Leve — principalmente post-ejercicio' },
          { value: 4, en: 'Occasional — minor', es: 'Ocasional — menor' },
          { value: 5, en: 'None — pain free', es: 'Ninguno — sin dolor' },
        ],
      },
      {
        id: 'recovery_speed',
        en: 'How quickly do you recover after physical activity?',
        es: '¿Qué tan rápido te recuperas después de actividad física?',
        options: [
          { value: 1, en: 'Very slow — days of soreness', es: 'Muy lento — días de dolor muscular' },
          { value: 2, en: 'Slow — significant soreness', es: 'Lento — dolor significativo' },
          { value: 3, en: 'Average — 24–48 hrs', es: 'Promedio — 24–48 hrs' },
          { value: 4, en: 'Fast — 12–24 hrs', es: 'Rápido — 12–24 hrs' },
          { value: 5, en: 'Very fast — same day', es: 'Muy rápido — el mismo día' },
        ],
      },
    ],
  },
  {
    id: 'cognition',
    label: 'Focus & Cognition',
    labelEs: 'Enfoque y Cognición',
    icon: '◐',
    questions: [
      {
        id: 'mental_clarity',
        en: 'How is your mental clarity and focus?',
        es: '¿Cómo está tu claridad mental y enfoque?',
        options: [
          { value: 1, en: 'Brain fog — can\'t concentrate', es: 'Neblina mental — no puedo concentrarme' },
          { value: 2, en: 'Scattered — easily distracted', es: 'Disperso — fácilmente distraído' },
          { value: 3, en: 'Moderate — good on good days', es: 'Moderado — bueno en buenos días' },
          { value: 4, en: 'Sharp — consistent focus', es: 'Agudo — enfoque consistente' },
          { value: 5, en: 'Excellent — peak mental clarity', es: 'Excelente — máxima claridad mental' },
        ],
      },
      {
        id: 'stress_level',
        en: 'How would you rate your current stress level?',
        es: '¿Cómo calificarías tu nivel de estrés actual?',
        options: [
          { value: 5, en: 'Minimal — well managed', es: 'Mínimo — bien manejado' },
          { value: 4, en: 'Low — occasional spikes', es: 'Bajo — picos ocasionales' },
          { value: 3, en: 'Moderate — manageable', es: 'Moderado — manejable' },
          { value: 2, en: 'High — frequent pressure', es: 'Alto — presión frecuente' },
          { value: 1, en: 'Very high — overwhelming', es: 'Muy alto — abrumador' },
        ],
      },
    ],
  },
]

// score labels
const SCORE_MAP = {
  low:  { en: 'Needs attention', es: 'Necesita atención', color: '#E8593C' },
  mid:  { en: 'Developing',      es: 'En desarrollo',    color: '#C9A84C' },
  high: { en: 'Optimized',       es: 'Optimizado',       color: '#00C2A8' },
}

function scoreLevel(avg) {
  if (avg <= 2.5) return 'low'
  if (avg <= 3.75) return 'mid'
  return 'high'
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function WellnessQuiz({ user, lang = 'es', onComplete }) {
  const isEs = lang === 'es'

  const [step, setStep] = useState('intro')   // intro | quiz | results
  const [catIdx, setCatIdx] = useState(0)
  const [qIdx, setQIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const totalQuestions = CATEGORIES.reduce((s, c) => s + c.questions.length, 0)
  const answeredCount = Object.keys(answers).length

  // flatten all questions for progress
  const allQuestions = CATEGORIES.flatMap(c => c.questions.map(q => ({ ...q, catId: c.id })))
  const currentCat = CATEGORIES[catIdx]
  const currentQ = currentCat?.questions[qIdx]
  const globalIdx = CATEGORIES.slice(0, catIdx).reduce((s, c) => s + c.questions.length, 0) + qIdx
  const progress = Math.round((answeredCount / totalQuestions) * 100)

  function handleAnswer(value) {
    const newAnswers = { ...answers, [currentQ.id]: value }
    setAnswers(newAnswers)

    // advance
    if (qIdx < currentCat.questions.length - 1) {
      setQIdx(qIdx + 1)
    } else if (catIdx < CATEGORIES.length - 1) {
      setCatIdx(catIdx + 1)
      setQIdx(0)
    } else {
      handleFinish(newAnswers)
    }
  }

  function handleBack() {
    if (qIdx > 0) {
      setQIdx(qIdx - 1)
    } else if (catIdx > 0) {
      const prevCat = CATEGORIES[catIdx - 1]
      setCatIdx(catIdx - 1)
      setQIdx(prevCat.questions.length - 1)
    }
  }

  async function handleFinish(finalAnswers) {
    setStep('results')
    setSaving(true)
    setError(null)
    try {
      const scores = computeScores(finalAnswers)
      const { error: dbErr } = await supabase.from('assessments').upsert({
        user_id: user?.id,
        answers: finalAnswers,
        scores,
        completed_at: new Date().toISOString(),
        version: 'v1',
      }, { onConflict: 'user_id' })
      if (dbErr) throw dbErr
      if (onComplete) onComplete(scores)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  function computeScores(ans) {
    const scores = {}
    CATEGORIES.forEach(cat => {
      const numericAnswers = cat.questions
        .filter(q => q.type !== 'text')
        .map(q => typeof ans[q.id] === 'number' ? ans[q.id] : null)
        .filter(v => v !== null)
      const avg = numericAnswers.length
        ? numericAnswers.reduce((s, v) => s + v, 0) / numericAnswers.length
        : 0
      scores[cat.id] = { avg: parseFloat(avg.toFixed(2)), level: scoreLevel(avg) }
    })
    const allNums = Object.values(scores).map(s => s.avg)
    scores.overall = {
      avg: parseFloat((allNums.reduce((s, v) => s + v, 0) / allNums.length).toFixed(2)),
      level: scoreLevel(allNums.reduce((s, v) => s + v, 0) / allNums.length),
    }
    return scores
  }

  const scores = step === 'results' ? computeScores(answers) : null

  // ── Styles (v3 design system) ───────────────────────────────────────────────
  const S = {
    wrap: {
      background: '#FFFFFF',
      borderRadius: 16,
      border: '0.5px solid #E5E5E5',
      overflow: 'hidden',
      fontFamily: "'Outfit', sans-serif",
    },
    header: {
      background: '#0A1628',
      padding: '20px 24px 16px',
    },
    headerTitle: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      fontWeight: 600,
      color: '#FAF7F2',
      letterSpacing: '0.02em',
      margin: 0,
    },
    headerSub: {
      fontSize: 12,
      color: '#C9A84C',
      marginTop: 4,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    body: { padding: '24px' },
    progressWrap: { marginBottom: 20 },
    progressBar: {
      height: 3,
      background: '#E5E5E5',
      borderRadius: 2,
      overflow: 'hidden',
      marginTop: 8,
    },
    progressFill: {
      height: '100%',
      background: '#00C2A8',
      borderRadius: 2,
      transition: 'width 0.3s ease',
    },
    progressLabel: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11,
      color: '#888',
    },
    catBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: '#FAF7F2',
      border: '0.5px solid #E5E5E5',
      borderRadius: 20,
      padding: '4px 12px',
      fontSize: 12,
      color: '#0A1628',
      fontWeight: 500,
      marginBottom: 16,
    },
    question: {
      fontSize: 16,
      fontWeight: 500,
      color: '#0A1628',
      lineHeight: 1.5,
      marginBottom: 20,
      fontFamily: "'Cormorant Garamond', serif",
    },
    optionBtn: (selected) => ({
      width: '100%',
      textAlign: 'left',
      padding: '12px 16px',
      marginBottom: 8,
      borderRadius: 8,
      border: selected ? '1.5px solid #00C2A8' : '0.5px solid #E5E5E5',
      background: selected ? '#E1F5EE' : '#FFFFFF',
      color: selected ? '#085041' : '#2A2A2A',
      fontSize: 13,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }),
    optionDot: (selected) => ({
      width: 16,
      height: 16,
      borderRadius: '50%',
      border: selected ? '2px solid #00C2A8' : '1.5px solid #D3D1C7',
      background: selected ? '#00C2A8' : 'transparent',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    navRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    backBtn: {
      fontSize: 12,
      color: '#888',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '6px 0',
    },
    // intro
    introText: {
      fontSize: 14,
      color: '#5F5E5A',
      lineHeight: 1.7,
      marginBottom: 24,
    },
    startBtn: {
      width: '100%',
      padding: '14px',
      background: '#0A1628',
      color: '#FAF7F2',
      border: 'none',
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 500,
      cursor: 'pointer',
      letterSpacing: '0.04em',
    },
    // category pills
    catRow: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      marginBottom: 20,
    },
    catPill: (active) => ({
      padding: '4px 12px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 500,
      border: active ? '1px solid #00C2A8' : '0.5px solid #E5E5E5',
      background: active ? '#00C2A8' : '#FAF7F2',
      color: active ? '#04342C' : '#888',
      cursor: 'default',
      letterSpacing: '0.03em',
    }),
    // results
    scoreCard: (level) => ({
      background: level === 'high' ? '#E1F5EE' : level === 'mid' ? '#FAEEDA' : '#FAECE7',
      border: `0.5px solid ${SCORE_MAP[level].color}40`,
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 10,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }),
    scoreDot: (level) => ({
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: SCORE_MAP[level].color,
      flexShrink: 0,
    }),
    overallScore: {
      background: '#0A1628',
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 20,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    ctaBtn: {
      width: '100%',
      padding: '14px',
      background: '#00C2A8',
      color: '#04342C',
      border: 'none',
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
      marginTop: 16,
      letterSpacing: '0.03em',
    },
    retakeBtn: {
      width: '100%',
      padding: '11px',
      background: 'none',
      color: '#888',
      border: '0.5px solid #E5E5E5',
      borderRadius: 8,
      fontSize: 13,
      cursor: 'pointer',
      marginTop: 8,
    },
  }

  // ── Intro screen ─────────────────────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <div style={S.wrap}>
        <div style={S.header}>
          <p style={S.headerTitle}>
            {isEs ? 'Evaluación de Bienestar' : 'Wellness Assessment'}
          </p>
          <p style={S.headerSub}>
            {isEs ? 'Evaluación personalizada · 5 categorías' : 'Personalized assessment · 5 categories'}
          </p>
        </div>
        <div style={S.body}>
          <p style={S.introText}>
            {isEs
              ? 'Este cuestionario nos ayuda a entender tu estado de salud actual en 5 áreas clave. Los resultados se comparten directamente con el Dr. Valenzuela para personalizar tu protocolo de péptidos.'
              : 'This questionnaire helps us understand your current health across 5 key areas. Results go directly to Dr. Valenzuela to personalize your peptide protocol.'}
          </p>
          <div style={S.catRow}>
            {CATEGORIES.map(c => (
              <span key={c.id} style={S.catPill(false)}>
                {c.icon} {isEs ? c.labelEs : c.label}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>
            {isEs ? `${totalQuestions} preguntas · ~3 minutos` : `${totalQuestions} questions · ~3 minutes`}
          </p>
          <button style={S.startBtn} onClick={() => setStep('quiz')}>
            {isEs ? 'Comenzar evaluación' : 'Start assessment'} →
          </button>
        </div>
      </div>
    )
  }

  // ── Quiz screen ───────────────────────────────────────────────────────────────
  if (step === 'quiz') {
    const selected = answers[currentQ.id]
    return (
      <div style={S.wrap}>
        <div style={S.header}>
          <p style={S.headerTitle}>
            {isEs ? currentCat.labelEs : currentCat.label}
          </p>
          <p style={S.headerSub}>
            {isEs ? `Pregunta ${globalIdx + 1} de ${totalQuestions}` : `Question ${globalIdx + 1} of ${totalQuestions}`}
          </p>
        </div>
        <div style={S.body}>
          <div style={S.progressWrap}>
            <div style={S.progressLabel}>
              <span>{isEs ? 'Progreso' : 'Progress'}</span>
              <span>{progress}%</span>
            </div>
            <div style={S.progressBar}>
              <div style={{ ...S.progressFill, width: `${Math.max(progress, 4)}%` }} />
            </div>
          </div>

          <div style={S.catRow}>
            {CATEGORIES.map((c, i) => (
              <span key={c.id} style={S.catPill(i === catIdx)}>
                {c.icon} {isEs ? c.labelEs : c.label}
              </span>
            ))}
          </div>

          <p style={S.question}>
            {isEs ? currentQ.es : currentQ.en}
          </p>

          {currentQ.options.map(opt => (
            <button
              key={opt.value}
              style={S.optionBtn(selected === opt.value)}
              onClick={() => handleAnswer(opt.value)}
            >
              <div style={S.optionDot(selected === opt.value)}>
                {selected === opt.value && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FAF7F2' }} />
                )}
              </div>
              {isEs ? opt.es : opt.en}
            </button>
          ))}

          <div style={S.navRow}>
            {globalIdx > 0 ? (
              <button style={S.backBtn} onClick={handleBack}>
                ← {isEs ? 'Anterior' : 'Back'}
              </button>
            ) : <span />}
            <span style={{ fontSize: 11, color: '#bbb' }}>
              {catIdx + 1}/{CATEGORIES.length}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ── Results screen ────────────────────────────────────────────────────────────
  if (step === 'results' && scores) {
    const overall = scores.overall
    return (
      <div style={S.wrap}>
        <div style={S.header}>
          <p style={S.headerTitle}>
            {isEs ? 'Tus Resultados' : 'Your Results'}
          </p>
          <p style={S.headerSub}>
            {isEs ? 'Evaluación completada · Enviada al Dr. Valenzuela' : 'Assessment complete · Sent to Dr. Valenzuela'}
          </p>
        </div>
        <div style={S.body}>
          {saving && (
            <p style={{ fontSize: 12, color: '#00C2A8', marginBottom: 16 }}>
              {isEs ? 'Guardando resultados…' : 'Saving results…'}
            </p>
          )}
          {error && (
            <p style={{ fontSize: 12, color: '#E8593C', marginBottom: 16 }}>
              {isEs ? 'Error al guardar. Tus respuestas están registradas localmente.' : 'Save error. Your answers are recorded locally.'}
            </p>
          )}

          <div style={S.overallScore}>
            <div>
              <p style={{ fontSize: 11, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
                {isEs ? 'Puntuación global' : 'Overall score'}
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: '#FAF7F2', margin: '4px 0 0' }}>
                {(overall.avg * 20).toFixed(0)}<span style={{ fontSize: 16, color: '#888' }}>/100</span>
              </p>
            </div>
            <div style={{
              padding: '6px 14px',
              borderRadius: 20,
              background: SCORE_MAP[overall.level].color + '30',
              color: SCORE_MAP[overall.level].color,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}>
              {isEs ? SCORE_MAP[overall.level].es : SCORE_MAP[overall.level].en}
            </div>
          </div>

          {CATEGORIES.map(cat => {
            const s = scores[cat.id]
            if (!s) return null
            return (
              <div key={cat.id} style={S.scoreCard(s.level)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={S.scoreDot(s.level)} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#0A1628', margin: 0 }}>
                      {cat.icon} {isEs ? cat.labelEs : cat.label}
                    </p>
                    <p style={{ fontSize: 11, color: '#888', margin: '2px 0 0' }}>
                      {isEs ? SCORE_MAP[s.level].es : SCORE_MAP[s.level].en}
                    </p>
                  </div>
                </div>
                <div style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: SCORE_MAP[s.level].color,
                  fontFamily: "'Cormorant Garamond', serif",
                }}>
                  {(s.avg * 20).toFixed(0)}
                </div>
              </div>
            )
          })}

          <button style={S.ctaBtn} onClick={() => window.location.href = '/book'}>
            {isEs ? 'Reservar consulta con Dr. Valenzuela →' : 'Book consultation with Dr. Valenzuela →'}
          </button>
          <button style={S.retakeBtn} onClick={() => {
            setAnswers({})
            setCatIdx(0)
            setQIdx(0)
            setStep('intro')
          }}>
            {isEs ? 'Repetir evaluación' : 'Retake assessment'}
          </button>
        </div>
      </div>
    )
  }

  return null
}
