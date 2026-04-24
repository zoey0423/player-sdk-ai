import { useEffect, useRef } from 'react'
import { getOrCreateViewerId } from '../utils/viewerId'

const SYNC_INTERVAL_MS = 30_000

interface UseProgressSyncOptions {
  src: string
  apiKey?: string | undefined
  apiBaseUrl?: string | undefined
  videoRef: React.RefObject<HTMLVideoElement | null>
}

export function useProgressSync({ src, apiKey, apiBaseUrl, videoRef }: UseProgressSyncOptions): void {
  const viewerIdRef = useRef<string>('')

  useEffect(() => {
    viewerIdRef.current = getOrCreateViewerId()
  }, [])

  useEffect(() => {
    const base = apiBaseUrl ?? ((import.meta as unknown as Record<string, unknown>)['env'] as Record<string, string> | undefined)?.['VITE_API_BASE_URL'] ?? ''
    if (!base) return

    const save = () => {
      const currentTime = videoRef.current?.currentTime ?? 0
      const body = JSON.stringify({ videoId: src, viewerId: viewerIdRef.current, currentTime })
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

      fetch(`${base}/api/v1/progress`, { method: 'PUT', headers, body }).catch(() => {})
    }

    const intervalId = setInterval(save, SYNC_INTERVAL_MS)
    window.addEventListener('beforeunload', save)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('beforeunload', save)
    }
  }, [src, apiKey, apiBaseUrl, videoRef])
}
