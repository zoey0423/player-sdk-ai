import { describe, it, expect, vi } from 'vitest'
import { emitEvent } from '../utils/emitEvent'
import { resolveFeatures, DEFAULT_FEATURES } from '../types/features'
import type { PlayerEvent, PlayerEventType } from '../types/events'

describe('emitEvent', () => {
  it('calls onEvent with correct structure', () => {
    const onEvent = vi.fn()
    emitEvent(onEvent, 'player:play', { currentTime: 10 })
    expect(onEvent).toHaveBeenCalledOnce()
    const event: PlayerEvent = onEvent.mock.calls[0][0]
    expect(event.type).toBe('player:play')
    expect(event.payload).toEqual({ currentTime: 10 })
    expect(typeof event.timestamp).toBe('number')
  })

  it('does nothing when onEvent is undefined', () => {
    expect(() => emitEvent(undefined, 'player:pause', { currentTime: 5 })).not.toThrow()
  })

  it('swallows errors thrown by onEvent callback', () => {
    const throwing = () => { throw new Error('boom') }
    expect(() => emitEvent(throwing, 'player:seek', { from: 0, to: 10 })).not.toThrow()
  })

  it('includes timestamp close to Date.now()', () => {
    const before = Date.now()
    const onEvent = vi.fn()
    emitEvent(onEvent, 'player:play', { currentTime: 0 })
    const after = Date.now()
    const event: PlayerEvent = onEvent.mock.calls[0][0]
    expect(event.timestamp).toBeGreaterThanOrEqual(before)
    expect(event.timestamp).toBeLessThanOrEqual(after)
  })
})

describe('event type naming — noun:verb convention', () => {
  const eventTypes: PlayerEventType[] = [
    'player:play', 'player:pause', 'player:seek',
    'player:volume', 'player:rate',
    'highlight:click', 'transcript:click',
  ]

  it.each(eventTypes)('%s matches noun:verb pattern', (type) => {
    expect(type).toMatch(/^[a-z]+:[a-z]+$/)
  })
})

describe('resolveFeatures', () => {
  it('returns all true when no features provided', () => {
    const f = resolveFeatures()
    expect(f).toEqual(DEFAULT_FEATURES)
    expect(f.pip).toBe(true)
    expect(f.subtitles).toBe(true)
    expect(f.summary).toBe(true)
  })

  it('merges partial features with defaults', () => {
    const f = resolveFeatures({ pip: false })
    expect(f.pip).toBe(false)
    expect(f.subtitles).toBe(true)
    expect(f.highlights).toBe(true)
  })

  it('allows disabling all features', () => {
    const f = resolveFeatures({ summary: false, highlights: false, transcript: false, pip: false, subtitles: false })
    expect(Object.values(f).every((v) => v === false)).toBe(true)
  })
})
