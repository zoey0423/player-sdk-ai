import { create } from 'zustand'

export interface PlayerState {
  playing: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  playbackRate: number
  isFullscreen: boolean
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
  skipForward: () => {
    const { currentTime, duration } = get()
    const next = Math.min(currentTime + 10, duration)
    set({ currentTime: next })
  },
  skipBackward: () => {
    const { currentTime } = get()
    set({ currentTime: Math.max(0, currentTime - 10) })
  },
}))
