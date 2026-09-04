import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from './supabase'

describe('db', () => {
  const originalUrl = import.meta.env.VITE_SUPABASE_URL
  const originalKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

  beforeEach(() => {
    vi.resetModules()
    import.meta.env.VITE_SUPABASE_URL = originalUrl
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = originalKey
  })

  it('throws an error when VITE_SUPABASE_URL is missing', () => {
    import.meta.env.VITE_SUPABASE_URL = ''
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'test-key'

    expect(() => db()).toThrow(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env'
    )
  })

  it('throws an error when VITE_SUPABASE_PUBLISHABLE_KEY is missing', () => {
    import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = ''

    expect(() => db()).toThrow(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env'
    )
  })

  it('throws an error when both env vars are missing', () => {
    import.meta.env.VITE_SUPABASE_URL = ''
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = ''

    expect(() => db()).toThrow(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env'
    )
  })

  it('initializes and returns the Supabase client when env vars are present', async () => {
    import.meta.env.VITE_SUPABASE_URL = 'https://example.supabase.co'
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'valid-key'

    const { db: freshDb } = await import('./supabase')
    const client = freshDb()

    expect(client).toBeDefined()
  })

  it('returns cached client on subsequent calls', async () => {
    import.meta.env.VITE_SUPABASE_URL = 'https://example.supabase.co'
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'valid-key'

    const { db: freshDb } = await import('./supabase')
    const client1 = freshDb()
    const client2 = freshDb()

    expect(client1).toBe(client2)
  })
})
