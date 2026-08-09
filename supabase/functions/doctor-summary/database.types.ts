export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Table<Row, Insert = Partial<Row>> = {
  Row: Row
  Insert: Insert
  Update: Partial<Insert>
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      profiles: Table<{
        id: string
        role: string | null
        full_name: string | null
        email: string | null
      }>
      wellness_checkins: Table<{
        patient_id: string | null
        created_at: string | null
        mood: number | null
        energy: number | null
        sleep: number | null
        weight: number | null
        notes: string | null
      }>
      consultations: Table<{
        patient_id: string | null
        created_at: string | null
        chief_complaint: string | null
        notes: string | null
        peptide_protocol: Json | null
      }>
      lab_uploads: Table<{
        patient_id: string | null
        uploaded_at: string | null
      }>
      body_metrics: Table<{
        patient_id: string
        recorded_at: string
        weight_kg: number | null
        height_cm: number | null
        body_fat_pct: number | null
        bmi: number | null
        bmi_override: boolean
        muscle_kg: number | null
        waist_cm: number | null
        status: "active" | "voided"
      }>
      doctor_ai_summary_usage: Table<{
        id: string
        doctor_id: string
        patient_id: string
        model: string
        status: "success" | "provider_error" | "timeout"
        prompt_tokens: number | null
        completion_tokens: number | null
        latency_ms: number | null
        created_at: string
      }, {
        id?: string
        doctor_id: string
        patient_id: string
        model: string
        status: "success" | "provider_error" | "timeout"
        prompt_tokens?: number | null
        completion_tokens?: number | null
        latency_ms?: number | null
        created_at?: string
      }>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
