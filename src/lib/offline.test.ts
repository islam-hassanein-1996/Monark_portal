import { beforeEach, describe, expect, it } from 'vitest'
import { clearApps, loadApps, saveApps } from './offline'
import type { PortalApp } from './portal'

// Polyfill localStorage for Node test environment if not present
if (typeof localStorage === 'undefined') {
  const store = new Map<string, string>()
  const mockStorage: Storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    },
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
  })
}

const mockAppsUserA: PortalApp[] = [
  {
    id: 'app-1',
    slug: 'drill-logs',
    name: 'Drill Logs',
    description: 'Drill hole log viewer',
    url: '/pages/drill.html',
    kind: 'static',
    icon: '⛏️',
    sort_order: 1,
  },
]

const mockAppsUserB: PortalApp[] = [
  {
    id: 'app-2',
    slug: 'mining-reports',
    name: 'Mining Reports',
    description: 'External python reporting tool',
    url: 'https://reports.pythonanywhere.com',
    kind: 'redirect',
    icon: '📊',
    sort_order: 2,
  },
]

describe('offline storage helper', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('happy path: saveApps followed by loadApps returns the correct dataset', () => {
    saveApps('user-a', mockAppsUserA)
    const loaded = loadApps('user-a')
    expect(loaded).toEqual(mockAppsUserA)
  })

  it('corrupted JSON safety: returns null if the stored value is invalid JSON', () => {
    localStorage.setItem('portal:apps:user-corrupt', '{invalid_json}')
    const loaded = loadApps('user-corrupt')
    expect(loaded).toBeNull()
  })

  it('corrupted JSON safety: returns null if stored JSON is not an array', () => {
    localStorage.setItem('portal:apps:user-object', JSON.stringify({ not: 'an array' }))
    const loaded = loadApps('user-object')
    expect(loaded).toBeNull()
  })

  it('isolation: saving apps for User A does not leak or overwrite User B cache', () => {
    saveApps('user-a', mockAppsUserA)
    saveApps('user-b', mockAppsUserB)

    expect(loadApps('user-a')).toEqual(mockAppsUserA)
    expect(loadApps('user-b')).toEqual(mockAppsUserB)
  })

  it('purge with uid: clearApps(uid) deletes only that user cache', () => {
    saveApps('user-a', mockAppsUserA)
    saveApps('user-b', mockAppsUserB)

    clearApps('user-a')

    expect(loadApps('user-a')).toBeNull()
    expect(loadApps('user-b')).toEqual(mockAppsUserB)
  })

  it('purge without uid: clearApps() purges all portal:apps: keys while preserving non-portal keys', () => {
    saveApps('user-a', mockAppsUserA)
    saveApps('user-b', mockAppsUserB)
    localStorage.setItem('unrelated_key', 'some_value')

    clearApps()

    expect(loadApps('user-a')).toBeNull()
    expect(loadApps('user-b')).toBeNull()
    expect(localStorage.getItem('unrelated_key')).toBe('some_value')
  })
})
