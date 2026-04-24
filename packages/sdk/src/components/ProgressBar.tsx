import { useRef, useCallback, useState } from 'react'
import { usePlayerStore } from '../store/playerStore'
import { ThumbnailPreview } from './ThumbnailPreview'
import type { ThumbnailTrack } from './ThumbnailPreview'
import type { AIHighlight } from '../store/aiStore'
import type { PlayerEvent } from '../types/events'
import { emitEvent } from '../utils/emitEvent'

interface ProgressBarProps {
  onSeek: (time: number) => void
  thumbnails?: ThumbnailTrack | undefined
  highlights?: AIHighlight[] | undefined
  onEvent?: ((event: PlayerEvent) => void) | undefined
}

export function ProgressBar({ onSeek, thumbnails, highlights = [], onEvent }: ProgressBarProps) {
  const { currentTime, duration } = usePlayerStore((s) => ({
    currentTime: s.currentTime,
    duration: s.duration,
  }))

  const barRef = useRef<HTMLDivElement>(null)
  const [hoverState, setHoverState] = useState<{ x: number; time: number } | null>(null)
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  const getTimeFromEvent = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!barRef.current || duration === 0) return null
      const rect = barRef.current.getBoundingClientRect()
      const ratio = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1))
      return { x: e.clientX - rect.left, time: ratio * duration, width: rect.width }
    },
    [duration],
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const result = getTimeFromEvent(e)
      if (result) onSeek(result.time)
    },
    [getTimeFromEvent, onSeek],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const result = getTimeFromEvent(e)
      if (result) setHoverState({ x: result.x, time: result.time })
    },
    [getTimeFromEvent],
  )

  const handleMouseLeave = useCallback(() => setHoverState(null), [])

  const barWidth = barRef.current?.getBoundingClientRect().width ?? 0

  return (
    <div className="aip-relative">
      {hoverState && (
        <ThumbnailPreview
          hoverTime={hoverState.time}
          hoverX={hoverState.x}
          barWidth={barWidth}
          thumbnails={thumbnails}
        />
      )}
      <div
        ref={barRef}
        role="slider"
        aria-label="Seek"
        aria-valuenow={currentTime}
        aria-valuemin={0}
        aria-valuemax={duration}
        tabIndex={0}
        className="aip-relative aip-h-1.5 aip-w-full aip-cursor-pointer aip-rounded-full aip-bg-white/30"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="aip-h-full aip-rounded-full aip-bg-white"
          style={{ width: `${pct}%` }}
        />
        {/* Published highlight markers */}
        {highlights
          .filter((h) => h.status === 'published')
          .map((h) => {
            const markerPct = duration > 0 ? (h.startTime / duration) * 100 : 0
            return (
              <button
                key={h.id}
                aria-label={`Highlight: ${h.label}`}
                className="aip-absolute aip-top-1/2 aip-h-3 aip-w-3 -aip-translate-x-1/2 -aip-translate-y-1/2 aip-rounded-full aip-bg-orange-400 hover:aip-scale-125 aip-transition-transform"
                style={{ left: `${markerPct}%` }}
                onClick={(e) => {
                  e.stopPropagation()
                  onSeek(h.startTime)
                  emitEvent(onEvent, 'highlight:click', { highlightId: h.id, timestamp: h.startTime })
                }}
              />
            )
          })}
      </div>
    </div>
  )
}

export type { ThumbnailTrack }
