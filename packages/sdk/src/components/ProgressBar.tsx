import { useRef, useCallback, useState } from 'react'
import { usePlayerStore } from '../store/playerStore'
import { ThumbnailPreview } from './ThumbnailPreview'
import type { ThumbnailTrack } from './ThumbnailPreview'

interface ProgressBarProps {
  onSeek: (time: number) => void
  thumbnails?: ThumbnailTrack | undefined
}

export function ProgressBar({ onSeek, thumbnails }: ProgressBarProps) {
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
      </div>
    </div>
  )
}

export type { ThumbnailTrack }
