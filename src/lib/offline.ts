import type { PortalApp } from './portal'

const KEY_PREFIX = 'portal:apps:'

export function saveApps(uid: string, apps: PortalApp[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(`${KEY_PREFIX}${uid}`, JSON.stringify(apps))
  } catch {
    // Ignore storage errors (e.g. storage quota exceeded)
  }
}

export function loadApps(uid: string): PortalApp[] | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const data = localStorage.getItem(`${KEY_PREFIX}${uid}`)
    if (!data) return null
    const parsed = JSON.parse(data)
    if (!Array.isArray(parsed)) return null
    return parsed as PortalApp[]
  } catch {
    return null
  }
}

export function clearApps(uid?: string): void {
  if (typeof localStorage === 'undefined') return
  if (uid !== undefined) {
    localStorage.removeItem(`${KEY_PREFIX}${uid}`)
    return
  }

  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(KEY_PREFIX)) {
      keysToRemove.push(key)
    }
  }

  for (const key of keysToRemove) {
    localStorage.removeItem(key)
  }
}
