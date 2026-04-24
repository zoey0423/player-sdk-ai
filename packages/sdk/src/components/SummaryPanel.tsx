import { useAIStore } from '../store/aiStore'

interface SummaryPanelProps {
  isDark: boolean
}

export function SummaryPanel({ isDark }: SummaryPanelProps) {
  const { aiStatus, summary } = useAIStore()

  if (aiStatus === 'failed' || aiStatus === 'idle') return null

  const bg = isDark ? 'aip-bg-gray-900 aip-text-gray-100' : 'aip-bg-gray-50 aip-text-gray-800'

  if (aiStatus === 'loading') {
    return (
      <div className={`aip-rounded-lg aip-p-4 ${bg}`} aria-label="Loading summary" aria-busy>
        <div className="aip-animate-pulse aip-space-y-2">
          <div className="aip-h-3 aip-w-3/4 aip-rounded aip-bg-current aip-opacity-20" />
          <div className="aip-h-3 aip-w-full aip-rounded aip-bg-current aip-opacity-20" />
          <div className="aip-h-3 aip-w-5/6 aip-rounded aip-bg-current aip-opacity-20" />
        </div>
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className={`aip-rounded-lg aip-p-4 ${bg}`} data-testid="summary-panel">
      <h3 className="aip-mb-2 aip-text-sm aip-font-semibold aip-opacity-60">AI 摘要</h3>
      <p className="aip-text-sm aip-leading-relaxed">{summary}</p>
    </div>
  )
}
