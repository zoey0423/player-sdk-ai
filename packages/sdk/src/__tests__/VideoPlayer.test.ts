import { describe, it, expect } from 'vitest'
import { VideoPlayer } from '../components/VideoPlayer'

describe('VideoPlayer', () => {
  it('is exported from the SDK entry point', () => {
    expect(VideoPlayer).toBeDefined()
    expect(typeof VideoPlayer).toBe('function')
  })
})
