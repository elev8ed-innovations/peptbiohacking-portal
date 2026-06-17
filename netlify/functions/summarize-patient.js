// Summarize patient data for Dr. Fernando's dashboard
// API key stays server-side — secure

const OR_KEY = process.env.OPENROUTER_API_KEY;

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
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OR_KEY
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: 'You are a clinical assistant for Dr. Fernando Valenzuela, a physician specializing in peptide therapy and regenerative medicine at PeptBiohacking in Mexico. Summarize the patient current status clearly and concisely for the doctor. Include: 1. Current wellness trend (improving/stable/declining) 2. Key concerns or highlights from check-ins 3. Protocol notes 4. Recommended follow-up actions. Be clinical, concise, and bilingual (Spanish preferred, English acceptable). Max 200 words.' },
          { role: 'user', content: 'Please summarize this patient status:\n\n' + patientContext }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('AI API error:', response.status, JSON.stringify(data));
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'AI service error', detail: data })
      };
    }

    const summary = data.choices?.[0]?.message?.content || 'Unable to generate summary.';

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
