import { useState, useEffect } from 'react'
import { getOrCreateViewerId } from '../utils/viewerId'

interface UseProgressResumeOptions {
  src: string
  apiKey?: string | undefined
  apiBaseUrl?: string | undefined
}

export function useProgressResume({ src, apiKey, apiBaseUrl }: UseProgressResumeOptions): {
  resumePosition: number | null
  dismissResume: () => void
} {
  const [resumePosition, setResumePosition] = useState<number | null>(null)

  useEffect(() => {
    const base = apiBaseUrl ?? ((import.meta as unknown as Record<string, unknown>)['env'] as Record<string, string> | undefined)?.['VITE_API_BASE_URL'] ?? ''
    if (!base) return

    const viewerId = getOrCreateViewerId()
    const headers: Record<string, string> = {}
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    fetch(
      `${base}/api/v1/progress?videoId=${encodeURIComponent(src)}&viewerId=${encodeURIComponent(viewerId)}`,
      { headers },
    )
      .then((r) => r.json())
      .then((data: { position?: number }) => {
        if (typeof data.position === 'number' && data.position > 0) {
          setResumePosition(data.position)
        }
      })
      .catch(() => {})
  }, [src, apiKey, apiBaseUrl])

  return { resumePosition, dismissResume: () => setResumePosition(null) }
}
