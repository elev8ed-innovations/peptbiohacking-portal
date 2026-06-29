// Supabase Edge Function: save-lead
// Writes quiz leads to Airtable + sends Dr. V WhatsApp notification
// Deploy: npx supabase functions deploy save-lead --project-ref myymemctdxwizhmwjbyk --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const d = await req.json();
    
    // Get Airtable token
    const token = Deno.env.get('AIRTABLE_TOKEN') || '';

    // Prepare Airtable payload
    const goals = Array.isArray(d.goals) ? d.goals.join(', ') : (d.goals || '');
    const syms = Array.isArray(d.symptoms) ? d.symptoms.join(', ') : (d.symptoms || '');

    const fields = {
      "Nombre": d.name || '',
      "WhatsApp": d.whatsapp || d.wa || '',
      "Email": d.email || '',
      "Edad": d.age ? Number(d.age) : null,
      "Sexo": d.sex || '',
      "Ciudad": d.city || '',
      "Peso": d.weight ? Number(d.weight) : null,
      "Altura": d.height ? Number(d.height) : null,
      "Objetivos": goals,
      "Sintomas": syms,
      "Protocolo Sugerido": d.suggestedProtocol || '',
      "Fuente": d.source || 'Quiz Web',
      "Fecha": new Date().toISOString().split('T')[0],
      "Notas": d.notes || ''
    };

    // Write to Airtable
    const atPayload = { records: [{ fields }] };
    
    const atRes = await fetch(
      `https://api.airtable.com/v0/appKo9tyGtIju3UHN/Leads`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(atPayload)
      }
    );
    
    const atData = await atRes.json();

    if (atData.error) {
      return new Response(JSON.stringify({ error: atData.error.message }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      id: atData.records?.[0]?.id || null
    }), {
      headers: { ...cors, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
});