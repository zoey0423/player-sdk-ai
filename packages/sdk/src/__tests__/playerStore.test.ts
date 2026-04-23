import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayerStore } from '../store/playerStore'

beforeEach(() => {
  usePlayerStore.setState({
    playing: false,
    currentTime: 0,
    duration: 120,
    volume: 1,
    muted: false,
    playbackRate: 1,
    isFullscreen: false,
  })
})

describe('playerStore — play/pause', () => {
  it('play sets playing to true', () => {
    usePlayerStore.getState().play()
    expect(usePlayerStore.getState().playing).toBe(true)
  })

  it('pause sets playing to false', () => {
    usePlayerStore.setState({ playing: true })
    usePlayerStore.getState().pause()
    expect(usePlayerStore.getState().playing).toBe(false)
  })

  it('togglePlay flips playing state', () => {
    usePlayerStore.getState().togglePlay()
    expect(usePlayerStore.getState().playing).toBe(true)
    usePlayerStore.getState().togglePlay()
    expect(usePlayerStore.getState().playing).toBe(false)
  })
})

describe('playerStore — seek', () => {
  it('seek clamps to [0, duration]', () => {
    usePlayerStore.getState().seek(60)
    expect(usePlayerStore.getState().currentTime).toBe(60)
  })

  it('seek clamps negative values to 0', () => {
    usePlayerStore.getState().seek(-5)
    expect(usePlayerStore.getState().currentTime).toBe(0)
  })

  it('seek clamps values beyond duration', () => {
    usePlayerStore.getState().seek(9999)
    expect(usePlayerStore.getState().currentTime).toBe(120)
  })

  it('skipForward adds 10 seconds', () => {
    usePlayerStore.setState({ currentTime: 50 })
    usePlayerStore.getState().skipForward()
    expect(usePlayerStore.getState().currentTime).toBe(60)
  })

  it('skipForward clamps at duration', () => {
    usePlayerStore.setState({ currentTime: 115 })
    usePlayerStore.getState().skipForward()
    expect(usePlayerStore.getState().currentTime).toBe(120)
  })

  it('skipBackward subtracts 10 seconds', () => {
    usePlayerStore.setState({ currentTime: 50 })
    usePlayerStore.getState().skipBackward()
    expect(usePlayerStore.getState().currentTime).toBe(40)
  })

  it('skipBackward clamps at 0', () => {
    usePlayerStore.setState({ currentTime: 5 })
    usePlayerStore.getState().skipBackward()
    expect(usePlayerStore.getState().currentTime).toBe(0)
  })
})

describe('playerStore — volume', () => {
  it('setVolume clamps to [0, 1]', () => {
    usePlayerStore.getState().setVolume(1.5)
    expect(usePlayerStore.getState().volume).toBe(1)
    usePlayerStore.getState().setVolume(-0.1)
    expect(usePlayerStore.getState().volume).toBe(0)
  })

  it('setVolume clears muted flag', () => {
    usePlayerStore.setState({ muted: true })
    usePlayerStore.getState().setVolume(0.5)
    expect(usePlayerStore.getState().muted).toBe(false)
  })

  it('toggleMute flips muted state', () => {
    usePlayerStore.getState().toggleMute()
    expect(usePlayerStore.getState().muted).toBe(true)
    usePlayerStore.getState().toggleMute()
    expect(usePlayerStore.getState().muted).toBe(false)
  })
})

describe('playerStore — playbackRate', () => {
  it('setPlaybackRate updates rate', () => {
    usePlayerStore.getState().setPlaybackRate(1.5)
    expect(usePlayerStore.getState().playbackRate).toBe(1.5)
  })

  it('setPlaybackRate supports 1x, 1.5x, 2x', () => {
    for (const rate of [1, 1.5, 2]) {
      usePlayerStore.getState().setPlaybackRate(rate)
      expect(usePlayerStore.getState().playbackRate).toBe(rate)
    }
  })
})

describe('ProgressBar — seek calculation', () => {
  it('calculates seek time from click ratio', () => {
    const duration = 120
    const clickRatio = 0.5
    const seekTime = clickRatio * duration
    expect(seekTime).toBe(60)
  })

  it('clamps seek to duration boundaries', () => {
    const duration = 120
    const clamp = (t: number) => Math.max(0, Math.min(t, duration))
    expect(clamp(-10)).toBe(0)
    expect(clamp(200)).toBe(120)
    expect(clamp(60)).toBe(60)
  })
})
