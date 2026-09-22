// Netlify Function: submit-ticket
// Writes a Tech Ticket to Airtable
const AIRTABLE_PAT = process.env.AIRTABLE_TOKEN || (() => {
  try {
    const fs = require('fs');
    const content = fs.readFileSync('/Users/anthony/.hermes/airtable_pat.md', 'utf8');
    const m = content.match(/pat=([^\s]+)/);
    return m ? m[1] : '';
  } catch { return ''; }
})();

const BASE_ID = 'appKo9tyGtIju3UHN';
const { requireDoctor, response } = require('./_doctor-auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'POST') {
    return response(405, { error: 'POST only' });
  }

  try {
    const auth = await requireDoctor(event);
    if (auth.error) return auth.error;

    const { titulo, descripcion, prioridad } = JSON.parse(event.body);
    if (!titulo) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Titulo is required' }) };
    }

    const resp = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Tech%20Tickets`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [{
          fields: {
            Titulo: titulo,
            Descripcion: descripcion || '',
            Prioridad: prioridad || 'Normal',
            Reporta: auth.profile.full_name || 'Doctor',
            Estatus: 'Open',
            Fecha: new Date().toISOString().split('T')[0],
          }
        }]
      }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(JSON.stringify(data));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
      body: JSON.stringify({ success: true, record: data.records?.[0] }),
    };
  } catch (err) {
    return {
      ...response(500, { error: 'Ticket could not be submitted' }),
    };
  }
};
