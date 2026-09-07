export async function saveWaiver(client, userId) {
  if (!userId) throw new Error('Missing patient')
  const { data, error } = await client.from('profiles')
    .update({ has_signed_waiver: true }).eq('id', userId)
    .select('id, has_signed_waiver').single()
  if (error || data?.id !== userId || data?.has_signed_waiver !== true) {
    throw new Error('Acceptance was not saved')
  }
}

export function requiresWaiver(access) {
  return access.role === 'patient' && access.hasSignedWaiver !== true
}
