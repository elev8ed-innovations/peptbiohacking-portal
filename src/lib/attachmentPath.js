// Persist object paths, never expiring bearer URLs. Recover older stored URLs.
export function attachmentPath(value, projectUrl, patientId) {
  if (typeof value !== 'string' || !patientId) return null
  let path = value
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value)
      if (url.origin !== new URL(projectUrl).origin) return null
      const match = url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/lab-uploads\/(.+)$/)
      if (!match) return null
      path = decodeURIComponent(match[1])
    } catch { return null }
  }
  if (!path.startsWith(`${patientId}/`) || path.split('/').some(part => !part || part === '..' || part === '.')) return null
  return path
}
