import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'

const T = {
  es: {
    gateTitle: 'Aviso importante',
    gateSub: 'Esta calculadora es una herramienta educativa de referencia. No constituye consejo médico.',
    warn1: 'Los resultados son estimaciones teóricas. Siempre verifica con tu médico.',
    warn2: 'Cada vial puede tener diferente concentración. Verifica la etiqueta de tu producto.',
    warn3: 'Usa solo jeringas de insulina estándar (100 UI / ml). No uses jeringas de tuberculina.',
    agreeLabel: 'Entiendo que esta es una herramienta educativa y consultaré con mi médico antes de usar cualquier dosificación calculada aquí.',
    enterBtn: 'Entrar a la calculadora',
    gateFooter: 'PepBiohacking · Dr. Fernando Valenzuela — Hermosillo, Sonora',
    calcTitle: 'Péptidos',
    calcTitleR: ' · Dosificación',
    calcSub: 'Calcula la dosis exacta en jeringa de insulina según la concentración de tu vial. Resultados en unidades (UI).',
    vialMgLbl: 'Vial (mg)',
    vialMgPlaceholder: 'Ej: 12',
    bacMlLbl: 'Agua bacteriostática (ml)',
    bacMlPlaceholder: 'Ej: 2.5',
    doseLabel: 'Dosis deseada (mcg)',
    commonDose: 'Dosis común',
    resultUnits: 'Unidades en jeringa',
    resultConc: 'Concentración',
    resultMcgMl: 'mcg / ml',
    resultVol: 'Volumen a extraer',
    resultMcgUnit: 'mcg / UI',
    tipVerySmall: 'Dosis muy pequeña',
    tipSmall: '— menos de 5 UI. Verifica que tu jeringa pueda medir esta cantidad con precisión. Considera usar una concentración más baja.',
    tipVeryLarge: 'Volumen grande',
    tipLarge: '— más de 80 UI. Considera dividir en dos jeringas o usar un vial de mayor concentración.',
    tipAdequate: 'Dosis adecuada',
    tipGood: '— dentro del rango típico para jeringa de insulina (5–80 UI).',
    tipDefault: '1 ml = 100 unidades en jeringa de insulina estándar.',
    share: 'Compartir',
    reset: 'Restablecer',
    es: 'ES',
    en: 'EN',
    other: 'Otro',
    selectDose: 'Seleccionar...',
  },
  en: {
    gateTitle: 'Important Notice',
    gateSub: 'This calculator is an educational reference tool. It does not constitute medical advice.',
    warn1: 'Results are theoretical estimates. Always verify with your doctor.',
    warn2: 'Each vial may have different concentration. Check your product label.',
    warn3: 'Use only standard insulin syringes (100 UI / ml). Do not use tuberculin syringes.',
    agreeLabel: 'I understand this is an educational tool and will consult my doctor before using any dosage calculated here.',
    enterBtn: 'Enter calculator',
    gateFooter: 'PepBiohacking · Dr. Fernando Valenzuela — Hermosillo, Sonora',
    calcTitle: 'Peptides',
    calcTitleR: ' · Dosage',
    calcSub: 'Calculate exact units on an insulin syringe based on your vial concentration. Results in units (UI).',
    vialMgLbl: 'Vial (mg)',
    vialMgPlaceholder: 'E.g. 12',
    bacMlLbl: 'Bacteriostatic water (ml)',
    bacMlPlaceholder: 'E.g. 2.5',
    doseLabel: 'Desired dose (mcg)',
    commonDose: 'Common dose',
    resultUnits: 'Syringe units',
    resultConc: 'Concentration',
    resultMcgMl: 'mcg / ml',
    resultVol: 'Volume to draw',
    resultMcgUnit: 'mcg / UI',
    tipVerySmall: 'Very small dose',
    tipSmall: '— less than 5 UI. Verify your syringe can measure this accurately. Consider using a lower concentration.',
    tipVeryLarge: 'Large volume',
    tipLarge: '— more than 80 UI. Consider splitting into two syringes or using a higher concentration vial.',
    tipAdequate: 'Adequate dose',
    tipGood: '— within typical insulin syringe range (5–80 UI).',
    tipDefault: '1 ml = 100 units on a standard insulin syringe.',
    share: 'Share',
    reset: 'Reset',
    es: 'ES',
    en: 'EN',
    other: 'Other',
    selectDose: 'Select...',
  },
}

const COMMON_DOSES = [
  { label: '250 mcg', value: 250 },
  { label: '500 mcg', value: 500 },
  { label: '1000 mcg (1mg)', value: 1000 },
  { label: '2000 mcg (2mg)', value: 2000 },
]

export default function Calculadora() {
  const [searchParams] = useSearchParams()
  const [calcLang, setCalcLang] = useState('es')
  const [showGate, setShowGate] = useState(true)
  const [agreed, setAgreed] = useState(false)

  const [vialMg, setVialMg] = useState(10)
  const [vialCustom, setVialCustom] = useState('')
  const [showCustomMg, setShowCustomMg] = useState(false)
  const [bacMl, setBacMl] = useState(2)
  const [bacCustom, setBacCustom] = useState('')
  const [showCustomBac, setShowCustomBac] = useState(false)
  const [doseMcg, setDoseMcg] = useState(250)

  const t = T[calcLang]
  const tgl = () => setCalcLang(l => l === 'es' ? 'en' : 'es')

  // Load params from URL on mount
  useEffect(() => {
    const mg = searchParams.get('mg')
    const bac = searchParams.get('bac')
    const dose = searchParams.get('dose')
    if (mg) {
      const n = parseFloat(mg)
      const presets = [5, 10, 15, 20]
      if (presets.includes(n)) {
        setVialMg(n)
        setShowCustomMg(false)
      } else {
        setVialMg(0)
        setVialCustom(String(n))
        setShowCustomMg(true)
      }
    }
    if (bac) {
      const n = parseFloat(bac)
      const presets = [1, 2, 3]
      if (presets.includes(n)) {
        setBacMl(n)
        setShowCustomBac(false)
      } else {
        setBacMl(0)
        setBacCustom(String(n))
        setShowCustomBac(true)
      }
    }
    if (dose) setDoseMcg(parseFloat(dose) || 250)
  }, [])

  const getEffectiveMg = useCallback(() => {
    if (showCustomMg) return parseFloat(vialCustom) || 0
    return vialMg
  }, [vialMg, vialCustom, showCustomMg])

  const getEffectiveBac = useCallback(() => {
    if (showCustomBac) return parseFloat(bacCustom) || 0
    return bacMl
  }, [bacMl, bacCustom, showCustomBac])

  const mg = getEffectiveMg()
  const ml = getEffectiveBac()

  let units = 0
  let concMgPerMl = 0
  let concMcgPerMl = 0
  let volumeMl = 0
  let mcgPerUnit = 0

  if (mg > 0 && ml > 0 && doseMcg > 0) {
    concMgPerMl = mg / ml
    concMcgPerMl = concMgPerMl * 1000
    volumeMl = doseMcg / concMcgPerMl
    units = Math.round(volumeMl * 100)
    mcgPerUnit = concMcgPerMl / 100
  }

  const fillPct = Math.min(100, Math.round((units / 100) * 100))

  let doseTipText = ''
  let doseTipIcon = ''
  if (mg <= 0 || ml <= 0 || doseMcg <= 0) {
    doseTipText = t.tipDefault
    doseTipIcon = '💡'
  } else if (units < 5) {
    doseTipText = '⚠️ ' + t.tipVerySmall + ' ' + t.tipSmall
    doseTipIcon = ''
  } else if (units > 80) {
    doseTipText = '⚠️ ' + t.tipVeryLarge + ' ' + t.tipLarge
    doseTipIcon = ''
  } else {
    doseTipText = '✅ ' + t.tipAdequate + ' ' + t.tipGood
    doseTipIcon = ''
  }

  const handleVialChange = (val) => {
    if (val === 'other') {
      setShowCustomMg(true)
      setVialMg(0)
    } else {
      setShowCustomMg(false)
      setVialMg(parseFloat(val))
    }
  }

  const handleBacChange = (val) => {
    if (val === 'otherBac') {
      setShowCustomBac(true)
      setBacMl(0)
    } else {
      setShowCustomBac(false)
      setBacMl(parseFloat(val))
    }
  }

  const handleCommonDose = (val) => {
    if (val) setDoseMcg(parseInt(val, 10))
  }

  const handleShare = () => {
    const params = '?mg=' + mg + '&bac=' + ml + '&dose=' + doseMcg
    const url = window.location.origin + window.location.pathname + params
    navigator.clipboard.writeText(url).catch(() => {})
  }

  const handleReset = () => {
    setVialMg(10)
    setShowCustomMg(false)
    setVialCustom('')
    setBacMl(2)
    setShowCustomBac(false)
    setBacCustom('')
    setDoseMcg(250)
  }

  const inpS = {
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#E8F0F2',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'Outfit, sans-serif',
    width: '100%',
    boxSizing: 'border-box',
  }

  const inpFocus = {
    ...inpS,
    borderColor: '#00C2A8',
    transition: 'border-color 0.25s',
  }

  const labelS = {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#7B94A5',
    marginBottom: '6px',
    display: 'block',
  }

  const cardS = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    padding: '20px',
    marginBottom: '16px',
  }

  if (showGate) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#0F1B29', padding: '24px', overflowY: 'auto',
      }}>
        <div style={{ position: 'absolute', top: '16px', right: '20px' }}>
          <button onClick={tgl} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px',
            color: '#7B94A5', fontSize: '12px', padding: '4px 10px', cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
          }}>
            {calcLang === 'es' ? 'EN' : 'ES'}
          </button>
        </div>
        <div style={{ maxWidth: '520px', width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px 28px', boxSizing: 'border-box' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(220,74,90,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
            ⚠️
          </div>
          <h1 style={{ fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 300, textAlign: 'center', letterSpacing: '0.02em', margin: '0 0 6px', color: '#E8F0F2' }}>
            <b style={{ color: '#D9A13B', fontWeight: 700 }}>{t.gateTitle}</b>
          </h1>
          <div style={{ fontSize: '13px', color: '#7B94A5', textAlign: 'center', marginBottom: '20px', lineHeight: 1.5 }}>
            {t.gateSub}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {[t.warn1, t.warn2, t.warn3].map((w, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: '#E8F0F2', lineHeight: 1.5 }}>
                <span style={{ color: '#D9A13B', flexShrink: 0 }}>⚠️</span>
                <span>{w}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px' }}>
            <input
              type="checkbox"
              id="agreeCheck"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: '3px', accentColor: '#00C2A8', width: '16px', height: '16px', flexShrink: 0 }}
            />
            <label htmlFor="agreeCheck" style={{ fontSize: '12px', color: '#7B94A5', lineHeight: 1.5, cursor: 'pointer' }}>
              {t.agreeLabel}
            </label>
          </div>
          <button
            disabled={!agreed}
            onClick={() => setShowGate(false)}
            style={{
              width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
              background: agreed ? 'linear-gradient(135deg,#00C2A8,#2A7C6F)' : 'rgba(255,255,255,0.08)',
              color: agreed ? '#0A1628' : '#7B94A5',
              fontSize: '15px', fontWeight: 600, cursor: agreed ? 'pointer' : 'not-allowed',
              fontFamily: 'Outfit, sans-serif', transition: 'all 0.3s',
            }}>
            {t.enterBtn}
          </button>
          <div style={{ fontSize: '11px', color: '#7B94A5', textAlign: 'center', marginTop: '16px', lineHeight: 1.5 }}>
            {t.gateFooter}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', fontFamily: 'Outfit, sans-serif' }}>
      <Navbar role={null} />
      <div style={{ position: 'fixed', top: '70px', right: '20px', zIndex: 50 }}>
        <button onClick={tgl} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px',
          color: '#7B94A5', fontSize: '12px', padding: '4px 10px', cursor: 'pointer',
          fontFamily: 'Outfit, sans-serif',
        }}>
          {calcLang === 'es' ? 'EN' : 'ES'}
        </button>
      </div>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '100px 20px 60px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', fontFamily: 'Outfit, sans-serif', margin: '0 0 8px' }}>
          {t.calcTitle}
        </p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(26px,5vw,36px)', color: '#E8F0F2', margin: '0 0 4px', fontWeight: 300 }}>
          <b style={{ fontWeight: 700 }}>{t.calcTitle}</b><span style={{ color: '#7B94A5' }}>{t.calcTitleR}</span>
        </h1>
        <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #00C2A8, #C9A84C)', marginBottom: '24px' }} />
        <p style={{ color: '#7B94A5', fontSize: '14px', margin: '0 0 28px', lineHeight: 1.5 }}>{t.calcSub}</p>

        {/* Inputs */}
        <div style={cardS}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelS}>{t.vialMgLbl}</label>
              <select
                value={showCustomMg ? 'other' : String(vialMg)}
                onChange={(e) => handleVialChange(e.target.value)}
                style={{ ...inpS, cursor: 'pointer' }}
              >
                <option value="5" style={{ background: '#0F1B29' }}>5 mg</option>
                <option value="10" style={{ background: '#0F1B29' }}>10 mg</option>
                <option value="15" style={{ background: '#0F1B29' }}>15 mg</option>
                <option value="20" style={{ background: '#0F1B29' }}>20 mg</option>
                <option value="other" style={{ background: '#0F1B29', color: '#00C2A8' }}>{t.other}</option>
              </select>
              {showCustomMg && (
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder={t.vialMgPlaceholder}
                  value={vialCustom}
                  onChange={(e) => setVialCustom(e.target.value)}
                  style={{ ...inpS, marginTop: '8px' }}
                  autoFocus
                />
              )}
            </div>
            <div>
              <label style={labelS}>{t.bacMlLbl}</label>
              <select
                value={showCustomBac ? 'otherBac' : String(bacMl)}
                onChange={(e) => handleBacChange(e.target.value)}
                style={{ ...inpS, cursor: 'pointer' }}
              >
                <option value="1" style={{ background: '#0F1B29' }}>1 ml</option>
                <option value="2" style={{ background: '#0F1B29' }}>2 ml</option>
                <option value="3" style={{ background: '#0F1B29' }}>3 ml</option>
                <option value="otherBac" style={{ background: '#0F1B29', color: '#00C2A8' }}>{t.other}</option>
              </select>
              {showCustomBac && (
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder={t.bacMlPlaceholder}
                  value={bacCustom}
                  onChange={(e) => setBacCustom(e.target.value)}
                  style={{ ...inpS, marginTop: '8px' }}
                  autoFocus
                />
              )}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelS}>{t.commonDose}</label>
            <select
              value=""
              onChange={(e) => handleCommonDose(e.target.value)}
              style={{ ...inpS, cursor: 'pointer' }}
            >
              <option value="" style={{ background: '#0F1B29' }}>{t.selectDose}</option>
              {COMMON_DOSES.map((d) => (
                <option key={d.value} value={d.value} style={{ background: '#0F1B29' }}>{d.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelS}>{t.doseLabel}</label>
            <input
              type="number"
              min="1"
              step="1"
              value={doseMcg}
              onChange={(e) => setDoseMcg(parseFloat(e.target.value) || 0)}
              style={inpS}
            />
          </div>
        </div>

        {/* Results */}
        <div style={cardS}>
          {/* Syringe visual */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7B94A5', marginBottom: '8px' }}>
              {t.resultUnits}
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '8px', height: '32px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                width: fillPct + '%', height: '100%',
                background: units > 80
                  ? 'linear-gradient(90deg, #2A7C6F, #DC4A5A)'
                  : units < 5 && doseMcg > 0
                  ? 'linear-gradient(90deg, #DC4A5A, #D9A13B)'
                  : 'linear-gradient(90deg, #00C2A8, #2A7C6F)',
                borderRadius: '8px', transition: 'width 0.3s ease',
                minWidth: doseMcg > 0 ? '4px' : '0',
              }} />
              <span style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '13px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
                color: '#E8F0F2',
              }}>
                {doseMcg > 0 ? units + ' / 100' : '— / 100'}
              </span>
            </div>
          </div>

          {/* Result grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: t.resultUnits, value: doseMcg > 0 ? units + ' UI' : '—' },
              { label: t.resultConc, value: doseMcg > 0 ? concMgPerMl.toFixed(2) + ' mg/ml' : '—' },
              { label: t.resultMcgMl, value: doseMcg > 0 ? Math.round(concMcgPerMl).toLocaleString() + ' mcg/ml' : '—' },
              { label: t.resultVol, value: doseMcg > 0 ? volumeMl.toFixed(3) + ' ml' : '—' },
              { label: t.resultMcgUnit, value: doseMcg > 0 ? mcgPerUnit.toFixed(1) + ' mcg' : '—' },
            ].map((r, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
                padding: '12px', border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ fontSize: '10px', color: '#7B94A5', marginBottom: '4px', letterSpacing: '0.05em' }}>
                  {r.label}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: '#00C2A8' }}>
                  {r.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dose Tip */}
        <div style={{
          ...cardS,
          borderLeft: doseMcg > 0 && units >= 5 && units <= 80
            ? '3px solid #3EAD7A'
            : doseMcg > 0 ? '3px solid #D9A13B' : '3px solid rgba(255,255,255,0.15)',
        }}>
          <div style={{ fontSize: '13px', color: '#E8F0F2', lineHeight: 1.6 }}>
            {doseTipText}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleShare} style={{
            flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)',
            background: 'transparent', color: '#E8F0F2', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
          }}>
            🔗 {t.share}
          </button>
          <button onClick={handleReset} style={{
            flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)',
            background: 'transparent', color: '#E8F0F2', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
          }}>
            ↺ {t.reset}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '11px', color: '#7B94A5', lineHeight: 1.5 }}>
          PepBiohacking · Dr. Fernando Valenzuela — Hermosillo, Sonora
        </div>
      </div>
    </div>
  )
}