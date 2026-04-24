import { useRef, useEffect } from 'react'
import { usePlayerStore } from '../store/playerStore'
import { useAIStore } from '../store/aiStore'
import { emitEvent } from '../utils/emitEvent'
import type { PlayerEvent } from '../types/events'

interface TranscriptPanelProps {
  isDark: boolean
  onEvent?: ((event: PlayerEvent) => void) | undefined
}

export function TranscriptPanel({ isDark, onEvent }: TranscriptPanelProps) {
  const { aiStatus, transcript } = useAIStore()
  const currentTime = usePlayerStore((s) => s.currentTime)
  const { seek } = usePlayerStore()
  const activeRef = useRef<HTMLButtonElement>(null)

  const activeIndex = transcript.findIndex(
    (w) => currentTime >= w.startTime && currentTime <= w.endTime,
  )

  // Auto-scroll active word into view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeIndex])

  if (aiStatus === 'failed' || aiStatus === 'idle') return null

  const bg = isDark ? 'aip-bg-gray-900 aip-text-gray-100' : 'aip-bg-gray-50 aip-text-gray-800'

  if (aiStatus === 'loading') {
    return (
      <div className={`aip-rounded-lg aip-p-4 ${bg}`} aria-label="Loading transcript" aria-busy>
        <div className="aip-animate-pulse aip-space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aip-h-3 aip-rounded aip-bg-current aip-opacity-20" style={{ width: `${60 + (i % 3) * 15}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (transcript.length === 0) return null

  return (
    <div
      className={`aip-max-h-48 aip-overflow-y-auto aip-rounded-lg aip-p-4 ${bg}`}
      data-testid="transcript-panel"
    >
      <h3 className="aip-mb-2 aip-text-sm aip-font-semibold aip-opacity-60">转录</h3>
      <div className="aip-flex aip-flex-wrap aip-gap-x-1 aip-gap-y-0.5">
        {transcript.map((word, i) => {
          const isActive = i === activeIndex
          return (
            <button
              key={word.id}
              ref={isActive ? activeRef : undefined}
              aria-label={`Jump to ${word.word} at ${word.startTime}s`}
              className={`aip-rounded aip-px-0.5 aip-text-sm aip-transition-colors ${
                isActive
                  ? 'aip-bg-yellow-400 aip-text-black'
                  : 'hover:aip-bg-white/10'
              }`}
              onClick={() => {
                seek(word.startTime)
                emitEvent(onEvent, 'transcript:click', { word: word.word, timestamp: word.startTime })
              }}
            >
              {word.word}
            </button>
          )
        })}
      </div>
    </div>
  )
}
