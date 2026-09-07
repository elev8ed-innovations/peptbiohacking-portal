import test from 'node:test'
import assert from 'node:assert/strict'
import { attachmentPath } from './attachmentPath.js'

const origin = 'https://example.supabase.co'
test('saved object paths remain usable without a bearer token', () => {
  assert.equal(attachmentPath('patient-a/lab.pdf', origin, 'patient-a'), 'patient-a/lab.pdf')
})
test('recovers old signed and public URLs, discarding expired tokens', () => {
  for (const mode of ['sign', 'public']) {
    assert.equal(attachmentPath(`${origin}/storage/v1/object/${mode}/lab-uploads/patient-a/lab%20report.pdf?token=expired`, origin, 'patient-a'), 'patient-a/lab report.pdf')
  }
})
test('rejects other patients, origins, buckets and traversal', () => {
  for (const value of ['patient-b/lab.pdf', 'patient-a/../lab.pdf', 'https://attacker.example/storage/v1/object/sign/lab-uploads/patient-a/lab.pdf', `${origin}/storage/v1/object/sign/other/patient-a/lab.pdf`, null]) {
    assert.equal(attachmentPath(value, origin, 'patient-a'), null)
  }
})
