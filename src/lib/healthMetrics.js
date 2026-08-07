export function toNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
export function calculateBmi(weightKg, heightCm) {
  const weight = toNumber(weightKg)
  const height = toNumber(heightCm)
  if (weight === null || height === null || height <= 0) return null
  return Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10
}

export function isPlausibleBmi(value, isOverride = false) {
  const bmi = toNumber(value)
  return bmi !== null && (isOverride || (bmi >= 10 && bmi <= 80))
}

export function validateBodyMetricInput(form) {
  const weight = toNumber(form.weight_kg)
  const height = toNumber(form.height_cm)
  const fat = toNumber(form.body_fat_pct)
  const muscle = toNumber(form.muscle_kg)
  const waist = toNumber(form.waist_cm)
  const overrideBmi = toNumber(form.bmi)

  if (weight !== null && (weight < 25 || weight > 350)) return 'El peso debe estar entre 25 y 350 kg.'
  if (height !== null && (height < 100 || height > 250)) return 'La estatura debe estar entre 100 y 250 cm.'
  if (fat !== null && (fat < 2 || fat > 75)) return 'La grasa corporal debe estar entre 2% y 75%.'
  if (muscle !== null && (muscle < 5 || muscle > 150)) return 'La masa muscular debe estar entre 5 y 150 kg.'
  if (waist !== null && (waist < 30 || waist > 250)) return 'La cintura debe estar entre 30 y 250 cm.'
  if (weight !== null && height === null && !form.bmi_override) return 'Ingresa la estatura para calcular el IMC automáticamente.'

  if (form.bmi_override) {
    if (overrideBmi === null) return 'Ingresa el IMC que deseas registrar.'
    if (!String(form.bmi_override_reason || '').trim()) return 'Explica el motivo clínico del ajuste manual de IMC.'
  }

  return ''
}
