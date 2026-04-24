import { and, eq, count } from 'drizzle-orm'
import type { Db } from '../db'
import { events, videos } from '../db/schema'

const FALLBACK_INTRO_END = 5    // seconds
const MIN_SEEK_EVENTS = 10

interface IntroOutroResult {
  introEnd: number
  outroStart: number
  method: 'behavior' | 'fallback'
}

export async function detectIntroOutro(
  videoId: string,
  tenantId: string,
  videoDuration: number,
  db: Db,
): Promise<IntroOutroResult> {
  if (!db) {
    return { introEnd: FALLBACK_INTRO_END, outroStart: Math.max(videoDuration - 5, FALLBACK_INTRO_END), method: 'fallback' }
  }

  const [{ value: seekCount }] = await db
    .select({ value: count() })
    .from(events)
    .where(and(eq(events.videoId, videoId), eq(events.tenantId, tenantId), eq(events.type, 'player:seek')))

  if (seekCount < MIN_SEEK_EVENTS) {
    return { introEnd: FALLBACK_INTRO_END, outroStart: Math.max(videoDuration - 5, FALLBACK_INTRO_END), method: 'fallback' }
  }

  // Behavior-based: find the most common "skip-forward" target cluster near the start → intro_end
  // and most common "skip-forward" near the end → outro_start
  // Simplified: find average seek target in first 20% and last 20% of video
  const allSeeks = await db
    .select({ payload: events.payload })
    .from(events)
    .where(and(eq(events.videoId, videoId), eq(events.tenantId, tenantId), eq(events.type, 'player:seek')))

  const toTimes = allSeeks
    .map((e) => (e.payload as Record<string, number> | null)?.to ?? null)
    .filter((t): t is number => t !== null)

  const introThreshold = videoDuration * 0.2
  const outroThreshold = videoDuration * 0.8

  const introSkips = toTimes.filter((t) => t < introThreshold)
  const outroSkips = toTimes.filter((t) => t > outroThreshold)

  const introEnd = introSkips.length > 0
    ? introSkips.reduce((a, b) => a + b, 0) / introSkips.length
    : FALLBACK_INTRO_END

  const outroStart = outroSkips.length > 0
    ? outroSkips.reduce((a, b) => a + b, 0) / outroSkips.length
    : videoDuration - 5

  return { introEnd, outroStart, method: 'behavior' }
}

export async function updateIntroOutro(
  videoId: string,
  tenantId: string,
  result: IntroOutroResult,
  db: Db,
): Promise<void> {
  if (!db) return
  await db
    .update(videos)
    .set({
      introEnd: result.introEnd,
      outroStart: result.outroStart,
      introDetectionMethod: result.method,
    })
    .where(and(eq(videos.id, videoId), eq(videos.tenantId, tenantId)))
}
