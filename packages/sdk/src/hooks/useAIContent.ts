import { useEffect } from 'react'
import { useAIStore, type AIHighlight, type AITranscriptWord } from '../store/aiStore'

const POLL_INTERVAL_MS = 5_000

interface AIPollResponse {
  status: string
  summary?: string | null
  highlights?: AIHighlight[]
  transcript?: AITranscriptWord[]
}

interface UseAIContentOptions {
  videoId?: string | undefined
  apiKey?: string | undefined
  apiBaseUrl?: string | undefined
}

export function useAIContent({ videoId, apiKey, apiBaseUrl }: UseAIContentOptions): void {
  const { setAIStatus, setAIContent, setAIError } = useAIStore()

  useEffect(() => {
    if (!videoId) return

    const base =
      apiBaseUrl ??
      ((import.meta as unknown as Record<string, unknown>)['env'] as Record<string, string> | undefined)?.['VITE_API_BASE_URL'] ??
      ''
    if (!base) return

    const headers: Record<string, string> = {}
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    let stopped = false

    const poll = async () => {
      if (stopped) return
      try {
        const res = await fetch(`${base}/api/v1/videos/${encodeURIComponent(videoId)}/ai`, { headers })
        if (!res.ok) { setAIError(`HTTP ${res.status}`); return }
        const data = (await res.json()) as AIPollResponse

        if (data.status === 'ready') {
          setAIContent({
            summary: data.summary ?? null,
            highlights: data.highlights ?? [],
            transcript: data.transcript ?? [],
          })
        } else if (data.status === 'failed') {
          setAIStatus('failed')
        }
        // 'pending'/'processing' → keep polling
      } catch {
        setAIError('Failed to load AI content')
      }
    }

    setAIStatus('loading')
    poll()

    const intervalId = setInterval(() => {
      const { aiStatus } = useAIStore.getState()
      if (aiStatus === 'ready' || aiStatus === 'failed') return
      poll()
    }, POLL_INTERVAL_MS)

    return () => {
      stopped = true
      clearInterval(intervalId)
    }
  }, [videoId, apiKey, apiBaseUrl, setAIStatus, setAIContent, setAIError])
}
