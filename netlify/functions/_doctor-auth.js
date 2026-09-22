const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  },
  body: JSON.stringify(body),
})

async function requireDoctor(event) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { error: response(503, { error: 'Authentication service unavailable' }) }
  }

  const authorization = event.headers?.authorization || event.headers?.Authorization || ''
  if (!authorization.startsWith('Bearer ')) {
    return { error: response(401, { error: 'Authentication required' }) }
  }

  const authHeaders = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: authorization,
  }
  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: authHeaders })
  if (!userResponse.ok) return { error: response(401, { error: 'Invalid session' }) }

  const user = await userResponse.json()
  const profileResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,full_name&limit=1`,
    { headers: authHeaders },
  )
  if (!profileResponse.ok) return { error: response(403, { error: 'Doctor access required' }) }

  const profiles = await profileResponse.json()
  const profile = profiles?.[0]
  if (profile?.role !== 'doctor') {
    return { error: response(403, { error: 'Doctor access required' }) }
  }

  return { user, profile }
}

module.exports = { requireDoctor, response }
