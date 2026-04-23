import { useRef, useEffect, useCallback } from 'react'
import { usePlayerStore } from '../store/playerStore'
import { ProgressBar } from './ProgressBar'

export interface VideoPlayerProps {
  src: string
  apiKey?: string
  theme?: 'light' | 'dark'
}

const PLAYBACK_RATES = [1, 1.5, 2] as const

export function VideoPlayer({ src, theme = 'dark' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    playing,
    volume,
    muted,
    playbackRate,
    togglePlay,
    setCurrentTime,
    setDuration,
    setVolume,
    toggleMute,
    setPlaybackRate,
    setFullscreen,
    skipForward,
    skipBackward,
    seek,
  } = usePlayerStore()

  // Sync store → video element
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (playing) {
      video.play().catch(() => usePlayerStore.getState().pause())
    } else {
      video.pause()
    }
  }, [playing])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.volume = muted ? 0 : volume
  }, [volume, muted])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = playbackRate
  }, [playbackRate])

  // Sync store.seek → video.currentTime
  useEffect(() => {
    return usePlayerStore.subscribe((state) => {
      const video = videoRef.current
      if (!video) return
      if (Math.abs(state.currentTime - video.currentTime) > 0.5) {
        video.currentTime = state.currentTime
      }
    })
  }, [])

  const handleSeek = useCallback(
    (time: number) => {
      seek(time)
      if (videoRef.current) videoRef.current.currentTime = time
    },
    [seek],
  )

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          e.preventDefault()
          skipForward()
          if (videoRef.current)
            videoRef.current.currentTime = usePlayerStore.getState().currentTime
          break
        case 'ArrowLeft':
          e.preventDefault()
          skipBackward()
          if (videoRef.current)
            videoRef.current.currentTime = usePlayerStore.getState().currentTime
          break
        case 'KeyF':
          if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen()
            setFullscreen(true)
          } else {
            document.exitFullscreen()
            setFullscreen(false)
          }
          break
        case 'KeyM':
          toggleMute()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlay, skipForward, skipBackward, toggleMute, setFullscreen])

  const isDark = theme === 'dark'

  return (
    <div
      ref={containerRef}
      data-testid="video-player"
      className={`aip-relative aip-w-full aip-overflow-hidden aip-rounded-lg ${isDark ? 'aip-bg-black' : 'aip-bg-gray-100'}`}
    >
      <video
        ref={videoRef}
        src={src}
        className="aip-w-full aip-cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
        onEnded={() => usePlayerStore.getState().pause()}
      />

      {/* Controls */}
      <div className="aip-absolute aip-bottom-0 aip-left-0 aip-right-0 aip-flex aip-flex-col aip-gap-2 aip-bg-gradient-to-t aip-from-black/70 aip-p-3">
        <ProgressBar onSeek={handleSeek} />

        <div className="aip-flex aip-items-center aip-gap-3">
          {/* Skip back */}
          <button
            aria-label="Rewind 10 seconds"
            className="aip-text-white aip-opacity-80 hover:aip-opacity-100"
            onClick={skipBackward}
          >
            ⏪
          </button>

          {/* Play/Pause */}
          <button
            aria-label={playing ? 'Pause' : 'Play'}
            className="aip-text-white aip-text-xl"
            onClick={togglePlay}
          >
            {playing ? '⏸' : '▶️'}
          </button>

          {/* Skip forward */}
          <button
            aria-label="Forward 10 seconds"
            className="aip-text-white aip-opacity-80 hover:aip-opacity-100"
            onClick={skipForward}
          >
            ⏩
          </button>

          {/* Volume */}
          <button
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="aip-text-white"
            onClick={toggleMute}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            aria-label="Volume"
            className="aip-w-20"
            onChange={(e) => setVolume(Number((e.target as HTMLInputElement).value))}
          />

          {/* Spacer */}
          <span className="aip-flex-1" />

          {/* Playback rate */}
          <div className="aip-flex aip-gap-1">
            {PLAYBACK_RATES.map((rate) => (
              <button
                key={rate}
                aria-label={`${rate}x speed`}
                aria-pressed={playbackRate === rate}
                className={`aip-rounded aip-px-1.5 aip-py-0.5 aip-text-xs aip-text-white ${
                  playbackRate === rate ? 'aip-bg-white/30' : 'aip-opacity-60'
                }`}
                onClick={() => setPlaybackRate(rate)}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Fullscreen */}
          <button
            aria-label="Fullscreen"
            className="aip-text-white"
            onClick={() => {
              if (!document.fullscreenElement) {
                containerRef.current?.requestFullscreen()
                setFullscreen(true)
              } else {
                document.exitFullscreen()
                setFullscreen(false)
              }
            }}
          >
            ⛶
          </button>
        </div>
      </div>
    </div>
  )
}
