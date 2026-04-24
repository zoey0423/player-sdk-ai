const STORAGE_KEY = 'aip_viewer_id'

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function getOrCreateViewerId(): string {
  if (typeof localStorage === 'undefined') return 'anon'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return stored
  const id = generateId()
  localStorage.setItem(STORAGE_KEY, id)
  return id
}
