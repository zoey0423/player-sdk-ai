import { create } from 'zustand'

export interface SubtitleTrack {
  src: string
  label: string
  lang: string
  default?: boolean
}

export interface PlayerState {
  playing: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  playbackRate: number
  isFullscreen: boolean
  isPip: boolean
  subtitlesEnabled: boolean
  activeSubtitleIndex: number
}

export interface PlayerActions {
  play: () => void
  pause: () => void
  togglePlay: () => void
  seek: (time: number) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  setPlaybackRate: (rate: number) => void
  setFullscreen: (value: boolean) => void
  toggleFullscreen: () => void
  setPip: (value: boolean) => void
  togglePip: () => void
  setSubtitlesEnabled: (value: boolean) => void
  toggleSubtitles: () => void
  setActiveSubtitleIndex: (index: number) => void
  skipForward: () => void
  skipBackward: () => void
}

export type PlayerStore = PlayerState & PlayerActions

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  playing: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  playbackRate: 1,
  isFullscreen: false,
  isPip: false,
  subtitlesEnabled: false,
  activeSubtitleIndex: 0,

  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  seek: (time) => {
    const { duration } = get()
    const clamped = Math.max(0, Math.min(time, duration))
    set({ currentTime: clamped })
  },
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)), muted: false }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),
  setPip: (isPip) => set({ isPip }),
  togglePip: () => set((s) => ({ isPip: !s.isPip })),
  setSubtitlesEnabled: (subtitlesEnabled) => set({ subtitlesEnabled }),
  toggleSubtitles: () => set((s) => ({ subtitlesEnabled: !s.subtitlesEnabled })),
  setActiveSubtitleIndex: (activeSubtitleIndex) => set({ activeSubtitleIndex }),
  skipForward: () => {
    const { currentTime, duration } = get()
    set({ currentTime: Math.min(currentTime + 10, duration) })
  },
  skipBackward: () => {
    const { currentTime } = get()
    set({ currentTime: Math.max(0, currentTime - 10) })
  },
}))
