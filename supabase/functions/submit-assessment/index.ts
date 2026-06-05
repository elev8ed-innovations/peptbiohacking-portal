// Supabase Edge Function: submit-assessment
// Deploy: npx supabase functions deploy submit-assessment --project-ref myymemctdxwizhmwjbyk
// JWT off: npx supabase functions deploy submit-assessment --project-ref myymemctdxwizhmwjbyk --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const d = await req.json();

    // 1. Insert into assessments table
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error } = await sb.from('assessments').insert({
      name:               d.name        || null,
      age:                d.age         || null,
      whatsapp:           d.wa          || null,
      email:              d.email       || null,
      weight_kg:          d.weight      || null,
      height_cm:          d.height      || null,
      sex:                d.sex         || null,
      city:               d.city        || null,
      goals:              (d.goals    || []).join(', ') || null,
      symptoms:           (d.symptoms || []).join(', ') || null,
      meds:               d.meds        || null,
      activity:           d.activity    || null,
      sleep_hrs:          d.sleep       || null,
      stress_level:       d.stress      || null,
      peptide_exp:        d.prev        || null,
      suggested_protocol: d.suggestedProtocol || null,
      language:           d.lang        || 'es',
    });

    if (error) throw error;

    // 2. Email Dr. V via Resend
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#0B1C2E;border-bottom:2px solid #2A7C6F;padding-bottom:8px">
          🧬 Nueva Valoración — PeptBiohacking
        </h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:600;width:40%">Paciente</td><td style="padding:8px">${d.name || '—'}, ${d.age || '—'} años, ${d.sex || '—'}</td></tr>
          <tr><td style="padding:8px;font-weight:600">Ciudad</td><td style="padding:8px">${d.city || '—'}</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:600">WhatsApp</td><td style="padding:8px"><a href="https://wa.me/${(d.wa||'').replace(/\D/g,'')}">${d.wa || '—'}</a></td></tr>
          <tr><td style="padding:8px;font-weight:600">Email</td><td style="padding:8px">${d.email || '—'}</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:600">Medidas</td><td style="padding:8px">${d.weight || '—'} kg / ${d.height || '—'} cm</td></tr>
          <tr><td style="padding:8px;font-weight:600">🎯 Objetivos</td><td style="padding:8px">${(d.goals||[]).join(', ') || '—'}</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:600">⚠️ Síntomas</td><td style="padding:8px">${(d.symptoms||[]).join(', ') || '—'}</td></tr>
          <tr><td style="padding:8px;font-weight:600">💊 Medicamentos</td><td style="padding:8px">${d.meds || '—'}</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:600">Actividad</td><td style="padding:8px">${d.activity || '—'}</td></tr>
          <tr><td style="padding:8px;font-weight:600">Sueño</td><td style="padding:8px">${d.sleep || '—'} h/noche</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:600">Estrés</td><td style="padding:8px">${d.stress || '—'}/5</td></tr>
          <tr><td style="padding:8px;font-weight:600">Exp. péptidos</td><td style="padding:8px">${d.prev || '—'}</td></tr>
          <tr style="background:#2A7C6F;color:white"><td style="padding:8px;font-weight:600">✅ Protocolo sugerido</td><td style="padding:8px;font-weight:700">${d.suggestedProtocol || '—'}</td></tr>
        </table>
        <p style="margin-top:16px;font-size:12px;color:#999">Enviado desde peptbiohacking.com · ${new Date().toLocaleString('es-MX')}</p>
      </div>
    `;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@peptbiohacking.mx',
        to:   'Mdsportsmedicineandent@gmail.com',
        subject: `🧬 Nueva valoración: ${d.name || 'Paciente'} — ${d.city || ''}`,
        html,
      }),
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
