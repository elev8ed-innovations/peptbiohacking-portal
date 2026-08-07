import { buildClinicalSnapshot, cleanText } from "./index.ts"

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message)
}

Deno.test("redacts direct identifiers from clinical text", () => {
  const cleaned = cleanText(
    "María Prueba maria@example.com +52 55 1234 5678 https://example.com/report stable",
    ["María Prueba", "maria@example.com"],
  ) || ""

  assert(!cleaned.includes("María Prueba"), "patient name was not redacted")
  assert(!cleaned.includes("maria@example.com"), "email was not redacted")
  assert(!cleaned.includes("1234 5678"), "phone was not redacted")
  assert(!cleaned.includes("example.com"), "URL was not redacted")
  assert(cleaned.includes("stable"), "clinical content was unexpectedly removed")
})

Deno.test("clinical snapshot excludes lab contents and cleans protocol text", () => {
  const snapshot = buildClinicalSnapshot({
    checkins: [{ created_at: "2026-08-01", mood: 8, energy: 7, sleep: 6, weight: 72, notes: "María Prueba improving" }],
    consultations: [{
      created_at: "2026-08-02",
      chief_complaint: "Follow-up maria@example.com",
      notes: "Stable",
      peptide_protocol: [{ name: "BPC-157", dose: "Doctor at +52 55 1234 5678", frequency: "daily" }],
    }],
    labs: [{ uploaded_at: "2026-08-03", file_name: "private-result.pdf", contents: "secret lab content" }],
    bodyMetrics: [{ recorded_at: "2026-08-04", weight_kg: 71, height_cm: 170, body_fat_pct: 20, bmi: 24.6, bmi_override: false, muscle_kg: 30, waist_cm: 82 }],
    redactions: ["María Prueba", "maria@example.com"],
  })

  const serialized = JSON.stringify(snapshot)
  assert(!serialized.includes("María Prueba"), "patient name leaked into snapshot")
  assert(!serialized.includes("maria@example.com"), "email leaked into snapshot")
  assert(!serialized.includes("private-result.pdf"), "lab filename leaked into snapshot")
  assert(!serialized.includes("secret lab content"), "lab contents leaked into snapshot")
  assert(serialized.includes("BPC-157"), "protocol was unexpectedly removed")
  assert(serialized.includes("Only upload dates are included"), "lab limitation notice is missing")
})
