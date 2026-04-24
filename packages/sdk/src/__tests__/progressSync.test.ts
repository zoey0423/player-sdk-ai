import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getOrCreateViewerId } from '../utils/viewerId'

const makeStorage = () => {
  const store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { for (const k in store) delete store[k] },
    length: 0,
    key: (_: number) => null,
  }
}

describe('getOrCreateViewerId', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeStorage())
  })

  it('creates a new viewerId if none stored', () => {
    const id = getOrCreateViewerId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('returns the same viewerId on subsequent calls', () => {
    const id1 = getOrCreateViewerId()
    const id2 = getOrCreateViewerId()
    expect(id1).toBe(id2)
  })

  it('stores viewerId in localStorage under aip_viewer_id', () => {
    const id = getOrCreateViewerId()
    expect(localStorage.getItem('aip_viewer_id')).toBe(id)
  })

  it('returns existing value when aip_viewer_id already stored', () => {
    localStorage.setItem('aip_viewer_id', 'preset-uuid-123')
    const id = getOrCreateViewerId()
    expect(id).toBe('preset-uuid-123')
  })

  it('returns "anon" when localStorage is undefined', () => {
    vi.stubGlobal('localStorage', undefined)
    const id = getOrCreateViewerId()
    expect(id).toBe('anon')
  })
})

describe('useProgressSync — module exports', () => {
  it('exports useProgressSync as a function', async () => {
    const mod = await import('../hooks/useProgressSync')
    expect(typeof mod.useProgressSync).toBe('function')
  })
})

describe('useProgressResume — module exports', () => {
  it('exports useProgressResume as a function', async () => {
    const mod = await import('../hooks/useProgressResume')
    expect(typeof mod.useProgressResume).toBe('function')
  })
})
