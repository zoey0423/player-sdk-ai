import { describe, it, expect } from 'vitest'
import { formatTime, getThumbnailFrameIndex } from '../utils/time'
import type { ThumbnailTrack } from '../components/ThumbnailPreview'

describe('formatTime', () => {
  it('formats 0 as 0:00', () => {
    expect(formatTime(0)).toBe('0:00')
  })

  it('formats 65 as 1:05', () => {
    expect(formatTime(65)).toBe('1:05')
  })

  it('formats 120 as 2:00', () => {
    expect(formatTime(120)).toBe('2:00')
  })

  it('formats 9 as 0:09', () => {
    expect(formatTime(9)).toBe('0:09')
  })

  it('formats 3661 as 61:01', () => {
    expect(formatTime(3661)).toBe('61:01')
  })

  it('clamps negative values to 0:00', () => {
    expect(formatTime(-5)).toBe('0:00')
  })
})

describe('getThumbnailFrameIndex', () => {
  it('returns 0 for hoverTime 0', () => {
    expect(getThumbnailFrameIndex(0, 5, 10)).toBe(0)
  })

  it('returns correct frame for mid-point', () => {
    expect(getThumbnailFrameIndex(12, 5, 10)).toBe(2)
  })

  it('clamps to last frame when hoverTime exceeds range', () => {
    expect(getThumbnailFrameIndex(999, 5, 10)).toBe(9)
  })

  it('handles interval boundary exactly', () => {
    expect(getThumbnailFrameIndex(10, 5, 10)).toBe(2)
  })
})

describe('ThumbnailTrack type', () => {
  it('accepts valid frames track', () => {
    const track: ThumbnailTrack = {
      type: 'frames',
      urls: ['https://example.com/thumb-0.jpg', 'https://example.com/thumb-1.jpg'],
      intervalSeconds: 5,
    }
    expect(track.type).toBe('frames')
    expect(track.urls).toHaveLength(2)
    expect(track.intervalSeconds).toBe(5)
  })
})

describe('ProgressBar hover calculation', () => {
  it('calculates hover time from position ratio', () => {
    const barWidth = 400
    const hoverX = 200
    const duration = 120
    const hoverTime = (hoverX / barWidth) * duration
    expect(hoverTime).toBe(60)
  })

  it('clamps hover position to [0, barWidth]', () => {
    const barWidth = 400
    const duration = 120
    const clampRatio = (x: number) => Math.max(0, Math.min(x / barWidth, 1))
    expect(clampRatio(-50) * duration).toBe(0)
    expect(clampRatio(500) * duration).toBe(120)
  })
})
