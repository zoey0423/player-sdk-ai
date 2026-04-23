import { useRef, useCallback } from 'react'
import { usePlayerStore } from '../store/playerStore'

interface ProgressBarProps {
  onSeek: (time: number) => void
}

export function ProgressBar({ onSeek }: ProgressBarProps) {
  const { currentTime, duration } = usePlayerStore((s) => ({
    currentTime: s.currentTime,
    duration: s.duration,
  }))

  const barRef = useRef<HTMLDivElement>(null)
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!barRef.current || duration === 0) return
      const rect = barRef.current.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      onSeek(ratio * duration)
    },
    [duration, onSeek],
  )

  return (
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
    >
      <div
        className="aip-h-full aip-rounded-full aip-bg-white"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
