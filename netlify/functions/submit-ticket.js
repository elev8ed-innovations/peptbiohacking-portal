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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'POST only' }) };
  }

  try {
    const { titulo, descripcion, prioridad, reporta } = JSON.parse(event.body);
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
            Reporta: reporta || 'Dr. V',
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
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, record: data.records?.[0] }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};