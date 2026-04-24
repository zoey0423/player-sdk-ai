import { useRef, useEffect, useCallback } from 'react'
import { usePlayerStore, SubtitleTrack } from '../store/playerStore'
import { ProgressBar } from './ProgressBar'
import { ThumbnailTrack } from './ThumbnailPreview'
import { PlayerFeatures, resolveFeatures } from '../types/features'
import { PlayerEvent } from '../types/events'
import { emitEvent } from '../utils/emitEvent'
import { resolveTenantId } from '../constants'
import { useProgressSync } from '../hooks/useProgressSync'
import { useProgressResume } from '../hooks/useProgressResume'
import { formatTime } from '../utils/time'

export interface VideoPlayerProps {
  src: string
  apiKey?: string | undefined
  apiBaseUrl?: string | undefined
  theme?: 'light' | 'dark' | undefined
  subtitles?: SubtitleTrack[] | undefined
  thumbnails?: ThumbnailTrack | undefined
  features?: PlayerFeatures | undefined
  onEvent?: ((event: PlayerEvent) => void) | undefined
}

const PLAYBACK_RATES = [1, 1.5, 2] as const

export function VideoPlayer({
  src,
  apiKey,
  apiBaseUrl,
  theme = 'dark',
  subtitles = [],
  thumbnails,
  features: featuresProp,
  onEvent,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tenantId = resolveTenantId(apiKey)
  const features = resolveFeatures(featuresProp)

  useProgressSync({ src, apiKey, apiBaseUrl, videoRef })
  const { resumePosition, dismissResume } = useProgressResume({ src, apiKey, apiBaseUrl })

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

  // Listen for fullscreenchange
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [setFullscreen])

  // Listen for PiP events
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

  const handleTogglePlay = useCallback(() => {
    const { playing: isPlaying, currentTime } = usePlayerStore.getState()
    togglePlay()
    emitEvent(onEvent, isPlaying ? 'player:pause' : 'player:play', { currentTime })
  }, [togglePlay, onEvent])

  const handleSeek = useCallback(
    (time: number) => {
      const from = usePlayerStore.getState().currentTime
      seek(time)
      if (videoRef.current) videoRef.current.currentTime = time
      emitEvent(onEvent, 'player:seek', { from, to: time })
    },
    [seek, onEvent],
  )

  const handleSetVolume = useCallback(
    (vol: number) => {
      setVolume(vol)
      emitEvent(onEvent, 'player:volume', { volume: vol, muted: false })
    },
    [setVolume, onEvent],
  )

  const handleToggleMute = useCallback(() => {
    const { muted: isMuted, volume: vol } = usePlayerStore.getState()
    toggleMute()
    emitEvent(onEvent, 'player:volume', { volume: vol, muted: !isMuted })
  }, [toggleMute, onEvent])

  const handleSetRate = useCallback(
    (rate: number) => {
      setPlaybackRate(rate)
      emitEvent(onEvent, 'player:rate', { rate })
    },
    [setPlaybackRate, onEvent],
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
    if (!video || !document.pictureInPictureEnabled) return
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture()
    } else {
      await video.requestPictureInPicture()
    }
  }, [])

  const handleSkipForward = useCallback(() => {
    const from = usePlayerStore.getState().currentTime
    skipForward()
    const to = usePlayerStore.getState().currentTime
    if (videoRef.current) videoRef.current.currentTime = to
    emitEvent(onEvent, 'player:seek', { from, to })
  }, [skipForward, onEvent])

  const handleSkipBackward = useCallback(() => {
    const from = usePlayerStore.getState().currentTime
    skipBackward()
    const to = usePlayerStore.getState().currentTime
    if (videoRef.current) videoRef.current.currentTime = to
    emitEvent(onEvent, 'player:seek', { from, to })
  }, [skipBackward, onEvent])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          handleTogglePlay()
          break
        case 'ArrowRight':
          e.preventDefault()
          handleSkipForward()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handleSkipBackward()
          break
        case 'KeyF':
          handleFullscreen()
          break
        case 'KeyM':
          handleToggleMute()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleTogglePlay, handleSkipForward, handleSkipBackward, handleToggleMute, handleFullscreen])

  const isDark = theme === 'dark'
  const pipSupported = typeof document !== 'undefined' && 'pictureInPictureEnabled' in document

  return (
    <div
      ref={containerRef}
      data-testid="video-player"
      data-tenant-id={tenantId}
      className={`aip-relative aip-w-full aip-overflow-hidden aip-rounded-lg ${isDark ? 'aip-bg-black' : 'aip-bg-gray-100'}`}
    >
      <video
        ref={videoRef}
        src={src}
        className="aip-w-full aip-cursor-pointer"
        onClick={handleTogglePlay}
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

      {resumePosition !== null && (
        <div
          data-testid="resume-banner"
          className="aip-absolute aip-top-3 aip-left-1/2 aip-z-10 -aip-translate-x-1/2 aip-flex aip-items-center aip-gap-2 aip-rounded-lg aip-bg-black/80 aip-px-4 aip-py-2 aip-text-sm aip-text-white"
        >
          <span>继续观看 {formatTime(resumePosition)}</span>
          <button
            aria-label="Resume from last position"
            className="aip-rounded aip-bg-white/20 aip-px-2 aip-py-1 aip-text-xs hover:aip-bg-white/30"
            onClick={() => {
              if (videoRef.current) videoRef.current.currentTime = resumePosition
              seek(resumePosition)
              dismissResume()
            }}
          >
            继续
          </button>
          <button
            aria-label="Start from beginning"
            className="aip-rounded aip-px-2 aip-py-1 aip-text-xs aip-opacity-70 hover:aip-opacity-100"
            onClick={dismissResume}
          >
            从头
          </button>
        </div>
      )}

      <div className="aip-absolute aip-bottom-0 aip-left-0 aip-right-0 aip-flex aip-flex-col aip-gap-2 aip-bg-gradient-to-t aip-from-black/70 aip-p-3">
        <ProgressBar onSeek={handleSeek} thumbnails={thumbnails} />

        <div className="aip-flex aip-items-center aip-gap-3">
          <button aria-label="Rewind 10 seconds" className="aip-flex aip-items-center aip-justify-center aip-min-w-[44px] aip-min-h-[44px] aip-text-white aip-opacity-80 hover:aip-opacity-100" onClick={handleSkipBackward}>⏪</button>
          <button aria-label={playing ? 'Pause' : 'Play'} className="aip-flex aip-items-center aip-justify-center aip-min-w-[44px] aip-min-h-[44px] aip-text-white aip-text-xl" onClick={handleTogglePlay}>{playing ? '⏸' : '▶️'}</button>
          <button aria-label="Forward 10 seconds" className="aip-flex aip-items-center aip-justify-center aip-min-w-[44px] aip-min-h-[44px] aip-text-white aip-opacity-80 hover:aip-opacity-100" onClick={handleSkipForward}>⏩</button>

          <button aria-label={muted ? 'Unmute' : 'Mute'} className="aip-flex aip-items-center aip-justify-center aip-min-w-[44px] aip-min-h-[44px] aip-text-white" onClick={handleToggleMute}>{muted ? '🔇' : '🔊'}</button>
          <input
            type="range" min={0} max={1} step={0.05}
            value={muted ? 0 : volume}
            aria-label="Volume"
            className="aip-w-20"
            onChange={(e) => handleSetVolume(Number((e.target as HTMLInputElement).value))}
          />

          <span className="aip-flex-1" />

          {subtitles.length > 0 && features.subtitles && (
            <button
              aria-label={subtitlesEnabled ? 'Disable subtitles' : 'Enable subtitles'}
              aria-pressed={subtitlesEnabled}
              className={`aip-flex aip-items-center aip-justify-center aip-min-h-[44px] aip-rounded aip-px-2 aip-py-0.5 aip-text-xs aip-text-white ${subtitlesEnabled ? 'aip-bg-white/30' : 'aip-opacity-60'}`}
              onClick={toggleSubtitles}
            >
              CC
            </button>
          )}

          <div className="aip-flex aip-gap-1">
            {PLAYBACK_RATES.map((rate) => (
              <button
                key={rate}
                aria-label={`${rate}x speed`}
                aria-pressed={playbackRate === rate}
                className={`aip-flex aip-items-center aip-justify-center aip-min-h-[44px] aip-rounded aip-px-2 aip-py-0.5 aip-text-xs aip-text-white ${playbackRate === rate ? 'aip-bg-white/30' : 'aip-opacity-60'}`}
                onClick={() => handleSetRate(rate)}
              >
                {rate}x
              </button>
            ))}
          </div>

          {pipSupported && features.pip && (
            <button
              aria-label={isPip ? 'Exit picture-in-picture' : 'Picture-in-picture'}
              className="aip-flex aip-items-center aip-justify-center aip-min-w-[44px] aip-min-h-[44px] aip-text-white aip-opacity-80 hover:aip-opacity-100"
              onClick={handlePip}
            >
              ⧉
            </button>
          )}

          <button
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="aip-flex aip-items-center aip-justify-center aip-min-w-[44px] aip-min-h-[44px] aip-text-white"
            onClick={handleFullscreen}
          >
            {isFullscreen ? '⛶' : '⛶'}
          </button>
        </div>
      </div>
    </div>
  )
}
