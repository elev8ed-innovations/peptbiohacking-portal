import { useEffect, useMemo, useState } from 'react'
import { useLang } from '../context/LanguageContext'
import { isPlausibleBmi, toNumber } from '../lib/healthMetrics'
import './ProgressDashboard.css'

const metricConfig = {
  weight: { es: 'Peso', en: 'Weight', unit: 'kg', color: '#12bfa8', direction: 'down' },
  fat: { es: 'Grasa corporal', en: 'Body fat', unit: '%', color: '#c9a84c', direction: 'down' },
  bmi: { es: 'IMC', en: 'BMI', unit: '', color: '#6486d8', direction: 'down' },
  muscle: { es: 'Masa muscular', en: 'Muscle mass', unit: 'kg', color: '#7768d8', direction: 'up' },
  waist: { es: 'Cintura', en: 'Waist', unit: 'cm', color: '#e77d61', direction: 'down' },
  wellness: { es: 'Bienestar', en: 'Wellness', unit: '/10', color: '#2d7c70', direction: 'up' },
  energy: { es: 'Energía', en: 'Energy', unit: '/10', color: '#e0a33b', direction: 'up' },
  sleep: { es: 'Sueño', en: 'Sleep', unit: '/10', color: '#596cb5', direction: 'up' },
}
function dateValue(item) {
  return new Date(item.date).getTime()
}

function buildSeries(bodyMetrics, checkins) {
  const body = bodyMetrics || []
  const wellness = checkins || []
  const fromBody = (key, validator = value => value !== null) => body
    .map(row => ({ id: row.id, date: row.recorded_at, value: toNumber(row[key]), source: 'doctor' }))
    .filter(point => validator(point.value, body.find(row => row.id === point.id)))

  const weightPoints = [
    ...fromBody('weight_kg'),
    ...wellness.map(row => ({ id: `checkin-${row.id}`, date: row.created_at, value: toNumber(row.weight), source: 'patient' })).filter(point => point.value !== null),
  ].sort((a, b) => dateValue(a) - dateValue(b))

  const fromCheckins = key => wellness
    .map(row => ({ id: row.id, date: row.created_at, value: toNumber(row[key]), source: 'patient' }))
    .filter(point => point.value !== null)
    .sort((a, b) => dateValue(a) - dateValue(b))

  return {
    weight: weightPoints,
    fat: fromBody('body_fat_pct').sort((a, b) => dateValue(a) - dateValue(b)),
    bmi: fromBody('bmi', (value, row) => isPlausibleBmi(value, row?.bmi_override)).sort((a, b) => dateValue(a) - dateValue(b)),
    muscle: fromBody('muscle_kg').sort((a, b) => dateValue(a) - dateValue(b)),
    waist: fromBody('waist_cm').sort((a, b) => dateValue(a) - dateValue(b)),
    wellness: fromCheckins('mood'),
    energy: fromCheckins('energy'),
    sleep: fromCheckins('sleep'),
  }
}

function TrendChart({ points, meta, range, lang }) {
  const [activeIndex, setActiveIndex] = useState(Math.max(points.length - 1, 0))
  const visible = useMemo(() => {
    if (range === 'all' || !points.length) return points
    const days = range === '30' ? 30 : 90
    const cutoff = dateValue(points.at(-1)) - days * 86400000
    return points.filter(point => dateValue(point) >= cutoff)
  }, [points, range])

  useEffect(() => setActiveIndex(Math.max(visible.length - 1, 0)), [visible.length, range])

  if (!visible.length) {
    return <div className="progress-empty-chart">{lang === 'es' ? 'Aún no hay datos para esta métrica.' : 'No data for this metric yet.'}</div>
  }

  const width = 760
  const height = 270
  const pad = { left: 42, right: 28, top: 35, bottom: 40 }
  const values = visible.map(point => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = max - min || Math.max(Math.abs(max) * 0.08, 1)
  const plotted = visible.map((point, index) => ({
    ...point,
    x: visible.length === 1 ? width / 2 : pad.left + (index / (visible.length - 1)) * (width - pad.left - pad.right),
    y: pad.top + ((max - point.value) / spread) * (height - pad.top - pad.bottom),
  }))
  const active = plotted[Math.min(activeIndex, plotted.length - 1)]
  const line = plotted.map(point => `${point.x},${point.y}`).join(' ')
  const area = plotted.length > 1 ? `${pad.left},${height - pad.bottom} ${line} ${plotted.at(-1).x},${height - pad.bottom}` : ''
  const locale = lang === 'es' ? 'es-MX' : 'en-US'

  return (
    <div className="progress-chart-wrap">
      <div className="progress-chart-value">
        <span>{new Date(active.date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <strong>{active.value}<small>{meta.unit}</small></strong>
        <em>{active.source === 'doctor' ? (lang === 'es' ? 'Medición médica' : 'Doctor reading') : (lang === 'es' ? 'Check-in del paciente' : 'Patient check-in')}</em>
      </div>
      <svg className="progress-chart" viewBox={`0 0 ${width} ${height}`} aria-label={`${meta[lang]} trend chart`}>
        <defs>
          <linearGradient id={`progress-fill-${meta.color.slice(1)}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={meta.color} stopOpacity=".24" />
            <stop offset="1" stopColor={meta.color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map(index => {
          const y = pad.top + index * ((height - pad.top - pad.bottom) / 3)
          return <line key={index} className="progress-gridline" x1={pad.left} x2={width - pad.right} y1={y} y2={y} />
        })}
        {area && <polygon points={area} fill={`url(#progress-fill-${meta.color.slice(1)})`} />}
        {plotted.length > 1 && <polyline points={line} fill="none" stroke={meta.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
        {plotted.map((point, index) => (
          <g key={`${point.id}-${point.date}`} className="progress-chart-point" onMouseEnter={() => setActiveIndex(index)} onClick={() => setActiveIndex(index)}>
            <rect x={point.x - 28} y={pad.top - 18} width="56" height={height - pad.top - pad.bottom + 36} fill="transparent" />
            {index === Math.min(activeIndex, plotted.length - 1) && <line x1={point.x} x2={point.x} y1={pad.top} y2={height - pad.bottom} stroke={meta.color} strokeDasharray="4 5" opacity=".45" />}
            <circle cx={point.x} cy={point.y} r={index === Math.min(activeIndex, plotted.length - 1) ? 7 : 4} fill="#fff" stroke={meta.color} strokeWidth="3" />
            <text x={point.x} y={height - 13} textAnchor="middle" className="progress-axis-label">
              {new Date(point.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
            </text>
          </g>
        ))}
      </svg>
      {visible.length === 1 && <p className="progress-one-reading">{lang === 'es' ? 'Una medición registrada. La tendencia aparecerá con la siguiente.' : 'One reading recorded. The trend will appear after the next one.'}</p>}
    </div>
  )
}

function MetricCard({ metricKey, points, selected, onClick, lang }) {
  const meta = metricConfig[metricKey]
  const current = points.at(-1)?.value
  const first = points[0]?.value
  const delta = current !== undefined && first !== undefined ? current - first : null
  const improved = delta !== null && (meta.direction === 'down' ? delta < 0 : delta > 0)

  return (
    <button className={`progress-metric-card ${selected ? 'selected' : ''}`} style={{ '--metric-color': meta.color }} onClick={onClick}>
      <span><i />{meta[lang]}</span>
      <strong>{current ?? '—'}<small>{current !== undefined ? meta.unit : ''}</small></strong>
      <em className={delta === null ? '' : improved ? 'positive' : 'neutral'}>
        {delta === null || delta === 0
          ? (lang === 'es' ? 'Sin tendencia todavía' : 'No trend yet')
          : `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta).toFixed(1)} ${meta.unit}`}
      </em>
    </button>
  )
}

export default function ProgressDashboard({ bodyMetrics = [], checkins = [], role = 'patient', onPrimaryAction }) {
  const { lang } = useLang()
  const [metric, setMetric] = useState('weight')
  const [range, setRange] = useState('all')
  const series = useMemo(() => buildSeries(bodyMetrics, checkins), [bodyMetrics, checkins])
  const availableMetrics = Object.keys(metricConfig)
  const excludedBmi = bodyMetrics.filter(row => row.bmi != null && !isPlausibleBmi(row.bmi, row.bmi_override)).length
  const totalReadings = bodyMetrics.length + checkins.length
  const meta = metricConfig[metric]

  return (
    <section className="progress-dashboard">
      <header className="progress-dashboard-header">
        <div>
          <span>{role === 'doctor' ? (lang === 'es' ? 'PROGRESO DEL PACIENTE' : 'PATIENT PROGRESS') : (lang === 'es' ? 'TU PROGRESO' : 'YOUR PROGRESS')}</span>
          <h2>{lang === 'es' ? 'Evolución de salud' : 'Health evolution'}</h2>
          <p>{totalReadings
            ? `${totalReadings} ${lang === 'es' ? 'registros históricos conectados' : 'historical records connected'}`
            : (lang === 'es' ? 'Las tendencias aparecerán cuando existan mediciones.' : 'Trends will appear once measurements are recorded.')}</p>
        </div>
        {onPrimaryAction && <button className="progress-primary" onClick={onPrimaryAction}>{role === 'doctor' ? (lang === 'es' ? 'Registrar medición +' : 'Add measurement +') : (lang === 'es' ? 'Registrar check-in +' : 'Add check-in +')}</button>}
      </header>

      {totalReadings === 0 ? (
        <div className="progress-empty-state"><b>↗</b><h3>{lang === 'es' ? 'Aún sin mediciones' : 'No measurements yet'}</h3><p>{lang === 'es' ? 'El médico registrará las métricas durante la consulta. Los gráficos aparecerán automáticamente.' : 'The doctor will record metrics during the consultation. Charts will appear automatically.'}</p></div>
      ) : (
        <>
          <div className="progress-main-panel">
            <div className="progress-controls">
              <div className="progress-tabs">{availableMetrics.map(key => <button key={key} className={metric === key ? 'active' : ''} style={{ '--metric-color': metricConfig[key].color }} onClick={() => setMetric(key)}>{metricConfig[key][lang]} <small>{series[key].length}</small></button>)}</div>
              <div className="progress-range"><button className={range === '30' ? 'active' : ''} onClick={() => setRange('30')}>30d</button><button className={range === '90' ? 'active' : ''} onClick={() => setRange('90')}>90d</button><button className={range === 'all' ? 'active' : ''} onClick={() => setRange('all')}>{lang === 'es' ? 'Todo' : 'All'}</button></div>
            </div>
            <TrendChart points={series[metric]} meta={meta} range={range} lang={lang} />
          </div>

          <div className="progress-card-grid">
            {['weight', 'fat', 'bmi', 'muscle', 'waist'].map(key => <MetricCard key={key} metricKey={key} points={series[key]} selected={metric === key} onClick={() => setMetric(key)} lang={lang} />)}
          </div>

          {excludedBmi > 0 && <div className="progress-data-notice">⚠ {excludedBmi} {lang === 'es' ? 'valor de IMC fuera del rango clínico fue ocultado hasta revisión médica.' : 'out-of-range BMI value was hidden pending medical review.'}</div>}
        </>
      )}
    </section>
  )
}
