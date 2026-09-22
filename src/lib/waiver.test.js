import test from 'node:test'
import assert from 'node:assert/strict'
import { saveWaiver, requiresWaiver } from './waiver.js'

function client(result) {
  const chain = { update: () => chain, eq: () => chain, select: () => chain, single: async () => result }
  return { from: () => chain }
}
test('acceptance requires a confirmed matching row', async () => {
  await saveWaiver(client({ data: { id: 'p1', has_signed_waiver: true } }), 'p1')
  for (const result of [{ error: new Error('Network') }, { data: null }, { data: { id: 'p2', has_signed_waiver: true } }, { data: { id: 'p1', has_signed_waiver: false } }]) {
    await assert.rejects(saveWaiver(client(result), 'p1'))
  }
})
test('patient access requires explicit acceptance; doctor access is unaffected', () => {
  for (const hasSignedWaiver of [false, null, undefined]) assert.equal(requiresWaiver({ role: 'patient', hasSignedWaiver }), true)
  assert.equal(requiresWaiver({ role: 'patient', hasSignedWaiver: true }), false)
  assert.equal(requiresWaiver({ role: 'doctor' }), false)
})
