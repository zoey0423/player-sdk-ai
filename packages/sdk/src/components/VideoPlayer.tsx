import { useRef, useEffect, useCallback } from 'react'
import { usePlayerStore, SubtitleTrack } from '../store/playerStore'
import { ProgressBar } from './ProgressBar'

export interface VideoPlayerProps {
  src: string
  apiKey?: string
  theme?: 'light' | 'dark'
  subtitles?: SubtitleTrack[]
}

const PLAYBACK_RATES = [1, 1.5, 2] as const

export function VideoPlayer({ src, theme = 'dark', subtitles = [] }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    playing, volume, muted, playbackRate,
    isFullscreen, isPip, subtitlesEnabled, activeSubtitleIndex,
    togglePlay, setCurrentTime, setDuration, setVolume, toggleMute,
    setPlaybackRate, setFullscreen, setPip, toggleSubtitles, seek,
    skipForward, skipBackward,
  } = usePlayerStore()

  // Sync playing → video
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (playing) {
      video.play().catch(() => usePlayerStore.getState().pause())
    } else {
      video.pause()
    }
  }, [playing])

  // Sync volume/muted → video
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.volume = muted ? 0 : volume
  }, [volume, muted])

  // Sync playbackRate → video
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = playbackRate
  }, [playbackRate])

  // Sync store seek → video.currentTime
  useEffect(() => {
    return usePlayerStore.subscribe((state) => {
      const video = videoRef.current
      if (!video) return
      if (Math.abs(state.currentTime - video.currentTime) > 0.5) {
        video.currentTime = state.currentTime
      }
    })
  }, [])

  // Sync subtitle track visibility
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    Array.from(video.textTracks).forEach((track, i) => {
      track.mode = subtitlesEnabled && i === activeSubtitleIndex ? 'showing' : 'hidden'
    })
  }, [subtitlesEnabled, activeSubtitleIndex])

  // Listen for fullscreenchange to sync store
  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [setFullscreen])

  // Listen for PiP events to sync store
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onEnterPip = () => setPip(true)
    const onLeavePip = () => setPip(false)
    video.addEventListener('enterpictureinpicture', onEnterPip)
    video.addEventListener('leavepictureinpicture', onLeavePip)
    return () => {
      video.removeEventListener('enterpictureinpicture', onEnterPip)
      video.removeEventListener('leavepictureinpicture', onLeavePip)
    }
  }, [setPip])

  const handleSeek = useCallback(
    (time: number) => {
      seek(time)
      if (videoRef.current) videoRef.current.currentTime = time
    },
    [seek],
  )

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  const handlePip = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    if (!document.pictureInPictureEnabled) return
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture()
    } else {
      await video.requestPictureInPicture()
    }
  }, [])

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
          handleFullscreen()
          break
        case 'KeyM':
          toggleMute()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlay, skipForward, skipBackward, toggleMute, handleFullscreen])

  const isDark = theme === 'dark'
  const pipSupported = typeof document !== 'undefined' && 'pictureInPictureEnabled' in document

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
      >
        {subtitles.map((track, i) => (
          <track
            key={track.src}
            kind="subtitles"
            src={track.src}
            srcLang={track.lang}
            label={track.label}
            default={i === 0 && track.default}
          />
        ))}
      </video>

      {/* Controls */}
      <div className="aip-absolute aip-bottom-0 aip-left-0 aip-right-0 aip-flex aip-flex-col aip-gap-2 aip-bg-gradient-to-t aip-from-black/70 aip-p-3">
        <ProgressBar onSeek={handleSeek} />

        <div className="aip-flex aip-items-center aip-gap-3">
          <button aria-label="Rewind 10 seconds" className="aip-text-white aip-opacity-80 hover:aip-opacity-100" onClick={skipBackward}>⏪</button>
          <button aria-label={playing ? 'Pause' : 'Play'} className="aip-text-white aip-text-xl" onClick={togglePlay}>{playing ? '⏸' : '▶️'}</button>
          <button aria-label="Forward 10 seconds" className="aip-text-white aip-opacity-80 hover:aip-opacity-100" onClick={skipForward}>⏩</button>

          <button aria-label={muted ? 'Unmute' : 'Mute'} className="aip-text-white" onClick={toggleMute}>{muted ? '🔇' : '🔊'}</button>
          <input
            type="range" min={0} max={1} step={0.05}
            value={muted ? 0 : volume}
            aria-label="Volume"
            className="aip-w-20"
            onChange={(e) => setVolume(Number((e.target as HTMLInputElement).value))}
          />

          <span className="aip-flex-1" />

          {/* Subtitles toggle */}
          {subtitles.length > 0 && (
            <button
              aria-label={subtitlesEnabled ? 'Disable subtitles' : 'Enable subtitles'}
              aria-pressed={subtitlesEnabled}
              className={`aip-rounded aip-px-1.5 aip-py-0.5 aip-text-xs aip-text-white ${subtitlesEnabled ? 'aip-bg-white/30' : 'aip-opacity-60'}`}
              onClick={toggleSubtitles}
            >
              CC
            </button>
          )}

          {/* Playback rate */}
          <div className="aip-flex aip-gap-1">
            {PLAYBACK_RATES.map((rate) => (
              <button
                key={rate}
                aria-label={`${rate}x speed`}
                aria-pressed={playbackRate === rate}
                className={`aip-rounded aip-px-1.5 aip-py-0.5 aip-text-xs aip-text-white ${playbackRate === rate ? 'aip-bg-white/30' : 'aip-opacity-60'}`}
                onClick={() => setPlaybackRate(rate)}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* PiP */}
          {pipSupported && (
            <button
              aria-label={isPip ? 'Exit picture-in-picture' : 'Picture-in-picture'}
              className="aip-text-white aip-opacity-80 hover:aip-opacity-100"
              onClick={handlePip}
            >
              ⧉
            </button>
          )}

          {/* Fullscreen */}
          <button
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="aip-text-white"
            onClick={handleFullscreen}
          >
            {isFullscreen ? '⛶' : '⛶'}
          </button>
        </div>
      </div>
    </div>
  )
}
