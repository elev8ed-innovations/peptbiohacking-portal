// Summarize patient data for Dr. Fernando's dashboard
// Called from the browser — API key stays server-side

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); } catch (e) {
    return { statusCode: 400, body: 'Bad Request' };
  }

  const { patientContext, patientName } = body;
  if (!patientContext) {
    return { statusCode: 400, body: JSON.stringify({ error: 'patientContext required' }) };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are a clinical assistant for Dr. Fernando Valenzuela, a physician specializing in peptide therapy and regenerative medicine at PeptBiohacking in Mexico.
Summarize the patient's current status clearly and concisely for the doctor. Include:
1. Current wellness trend (improving/stable/declining)
2. Key concerns or highlights from check-ins
3. Protocol notes
4. Recommended follow-up actions
Be clinical, concise, and bilingual (Spanish preferred, English acceptable). Max 200 words.`,
        messages: [{ role: 'user', content: 'Please summarize this patient status:\n\n' + patientContext }]
      })
    });

    const data = await response.json();
    const summary = data.content?.[0]?.text || 'Unable to generate summary.';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary })
    };
  } catch (err) {
    console.error('AI summary error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate summary' })
    };
  }
};