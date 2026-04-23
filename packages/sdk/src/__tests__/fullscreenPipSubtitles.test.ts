import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayerStore } from '../store/playerStore'
import type { SubtitleTrack } from '../store/playerStore'

beforeEach(() => {
  usePlayerStore.setState({
    playing: false,
    currentTime: 0,
    duration: 120,
    volume: 1,
    muted: false,
    playbackRate: 1,
    isFullscreen: false,
    isPip: false,
    subtitlesEnabled: false,
    activeSubtitleIndex: 0,
  })
})

describe('playerStore — fullscreen', () => {
  it('setFullscreen sets isFullscreen', () => {
    usePlayerStore.getState().setFullscreen(true)
    expect(usePlayerStore.getState().isFullscreen).toBe(true)
  })

  it('toggleFullscreen flips isFullscreen', () => {
    usePlayerStore.getState().toggleFullscreen()
    expect(usePlayerStore.getState().isFullscreen).toBe(true)
    usePlayerStore.getState().toggleFullscreen()
    expect(usePlayerStore.getState().isFullscreen).toBe(false)
  })
})

describe('playerStore — picture-in-picture', () => {
  it('setPip sets isPip', () => {
    usePlayerStore.getState().setPip(true)
    expect(usePlayerStore.getState().isPip).toBe(true)
  })

  it('togglePip flips isPip', () => {
    usePlayerStore.getState().togglePip()
    expect(usePlayerStore.getState().isPip).toBe(true)
    usePlayerStore.getState().togglePip()
    expect(usePlayerStore.getState().isPip).toBe(false)
  })
})

describe('playerStore — subtitles', () => {
  it('toggleSubtitles flips subtitlesEnabled', () => {
    usePlayerStore.getState().toggleSubtitles()
    expect(usePlayerStore.getState().subtitlesEnabled).toBe(true)
    usePlayerStore.getState().toggleSubtitles()
    expect(usePlayerStore.getState().subtitlesEnabled).toBe(false)
  })

  it('setSubtitlesEnabled sets value directly', () => {
    usePlayerStore.getState().setSubtitlesEnabled(true)
    expect(usePlayerStore.getState().subtitlesEnabled).toBe(true)
  })

  it('setActiveSubtitleIndex updates index', () => {
    usePlayerStore.getState().setActiveSubtitleIndex(2)
    expect(usePlayerStore.getState().activeSubtitleIndex).toBe(2)
  })
})

describe('SubtitleTrack type', () => {
  it('accepts valid subtitle track objects', () => {
    const track: SubtitleTrack = {
      src: 'https://example.com/subs.vtt',
      label: '中文',
      lang: 'zh',
      default: true,
    }
    expect(track.src).toBeDefined()
    expect(track.lang).toBe('zh')
  })

  it('default field is optional', () => {
    const track: SubtitleTrack = {
      src: 'https://example.com/subs.vtt',
      label: 'English',
      lang: 'en',
    }
    expect(track.default).toBeUndefined()
  })
})
