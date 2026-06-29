// Netlify Function: get-inventory
// Reads inventory + ticket count from Airtable.
// PAT comes from Netlify env var AIRTABLE_TOKEN (set in dashboard).
const AIRTABLE_PAT = process.env.AIRTABLE_TOKEN || '';
const BASE_ID = 'appKo9tyGtIju3UHN';

async function fetchAirtable(table, params = '') {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}?${params}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_PAT}` }
  });
  if (!resp.ok) {
    const body = await resp.text();
    console.error(`Airtable ${table}: ${resp.status} — ${body}`);
    return null;
  }
  return resp.json();
}

exports.handler = async () => {
  try {
    const [invData, ticketData] = await Promise.all([
      fetchAirtable('Inventario', 'sort%5B0%5D%5Bfield%5D=P%C3%A9ptido&sort%5B0%5D%5Bdirection%5D=asc'),
      fetchAirtable('Tech%20Tickets', 'filterByFormula=%7BEstatus%7D%3D%22Open%22'),
    ]);

    const products = (invData?.records || []).map(r => ({
      id: r.id,
      peptido: r.fields['Péptido'] || '',
      unidad: r.fields['Unidad'] || '',
      stock: r.fields['Stock Actual'] || 0,
      estado: r.fields['Estado'] || '',
      precio: r.fields['Precio'] || 0,
    }));

    const openTickets = (ticketData?.records || []).length;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ products, openTickets }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};