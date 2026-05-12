import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CALENDLY_SECRET = Deno.env.get('CALENDLY_WEBHOOK_SECRET') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

/**
 * Verify Calendly webhook signature (HMAC-SHA256)
 * https://developer.calendly.com/api-docs/ZG9jOjM2MzI3MDM4-webhook-signatures
 */
async function verifySignature(req: Request, body: string): Promise<boolean> {
  if (!CALENDLY_SECRET) return true // skip if secret not configured
  const sigHeader = req.headers.get('Calendly-Webhook-Signature')
  if (!sigHeader) return false

  const parts = Object.fromEntries(
    sigHeader.split(',').map(p => p.split('=') as [string, string])
  )
  const timestamp = parts['t']
  const signature = parts['v1']
  if (!timestamp || !signature) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(CALENDLY_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const data = new TextEncoder().encode(`${timestamp}.${body}`)
  const computed = await crypto.subtle.sign('HMAC', key, data)
  const hex = Array.from(new Uint8Array(computed))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return hex === signature
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const body = await req.text()

  if (!(await verifySignature(req, body))) {
    return new Response('Unauthorized', { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body)
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  // Calendly sends { event: "invitee.created", payload: { ... } }
  const eventName = payload.event as string
  const resource = payload.payload as Record<string, unknown>

  // Only handle booking and cancellation
  if (!['invitee.created', 'invitee.canceled'].includes(eventName)) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── Extract invitee fields ──────────────────────────────────────────────
  const inviteeName = (resource.name as string) ?? null
  const inviteeEmail = (resource.email as string)?.toLowerCase() ?? null
  const calendlyUri = resource.uri as string
  const calendlyEventUri = resource.event as string

  // ── Extract scheduled event fields ─────────────────────────────────────
  const scheduledEvent = resource.scheduled_event as Record<string, unknown> | null
  const startTime = scheduledEvent?.start_time as string | null ?? null
  const endTime = scheduledEvent?.end_time as string | null ?? null
  const location = scheduledEvent?.location as Record<string, unknown> | null
  const meetingLink = (location?.join_url as string) ?? null

  // ── Extract intake Q&A ─────────────────────────────────────────────────
  const qa = (resource.questions_and_answers as Array<{ question: string; answer: string }>) ?? []
  const intakeData: Record<string, string> = {}
  for (const item of qa) {
    if (item.question) intakeData[item.question] = item.answer ?? ''
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // ── Look up patient by email ───────────────────────────────────────────
  let patientId: string | null = null
  if (inviteeEmail) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', inviteeEmail)
      .maybeSingle()
    patientId = profile?.id ?? null
  }

  // ── Handle invitee.created ─────────────────────────────────────────────
  if (eventName === 'invitee.created' && startTime) {
    const { error } = await supabase.from('appointments').upsert({
      calendly_uri: calendlyUri,
      calendly_event: calendlyEventUri,
      patient_id: patientId,
      invitee_name: inviteeName,
      invitee_email: inviteeEmail,
      start_time: startTime,
      end_time: endTime,
      meeting_link: meetingLink,
      status: 'active',
      intake_data: intakeData,
    }, { onConflict: 'calendly_uri' })

    if (error) {
      console.error('Insert error:', error)
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  // ── Handle invitee.canceled ────────────────────────────────────────────
  if (eventName === 'invitee.canceled') {
    await supabase
      .from('appointments')
      .update({ status: 'canceled' })
      .eq('calendly_uri', calendlyUri)
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
