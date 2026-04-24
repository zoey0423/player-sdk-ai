import { eq, and } from 'drizzle-orm'
import type { Db } from '../db'
import { videos, transcripts, summaries, highlights } from '../db/schema'
import { transcribeVideo, analyzeTranscript } from './openai-service'
import { detectIntroOutro, updateIntroOutro } from './intro-detector'

export async function runAiPipeline(videoId: string, tenantId: string, videoUrl: string, db: Db): Promise<void> {
  if (!db) return

  // Mark as processing
  await db.update(videos).set({ status: 'processing' }).where(and(eq(videos.id, videoId), eq(videos.tenantId, tenantId)))

  try {
    // Step 1: Transcription
    const transcript = await transcribeVideo(videoUrl)
    await db.insert(transcripts).values(
      transcript.map((w) => ({ videoId, tenantId, word: w.word, startTime: w.startTime, endTime: w.endTime })),
    )

    // Step 2: Summary + Highlights
    const { summary, highlights: hlItems } = await analyzeTranscript(transcript)
    await db.insert(summaries).values({ videoId, tenantId, content: summary })
    if (hlItems.length > 0) {
      await db.insert(highlights).values(
        hlItems.map((h) => ({
          videoId,
          tenantId,
          label: h.label,
          startTime: h.startTime,
          endTime: h.endTime,
          confidence: h.confidence,
          status: 'pending_review' as const,
        })),
      )
    }

    // Step 3: Intro/Outro detection
    const [video] = await db.select({ duration: videos.introEnd }).from(videos).where(eq(videos.id, videoId)).limit(1)
    const duration = video?.duration ?? 0
    const introOutro = await detectIntroOutro(videoId, tenantId, duration, db)
    await updateIntroOutro(videoId, tenantId, introOutro, db)

    // Mark as ready
    await db.update(videos).set({ status: 'ready' }).where(and(eq(videos.id, videoId), eq(videos.tenantId, tenantId)))
  } catch (err) {
    console.error(`AI pipeline failed for video ${videoId}:`, err)
    await db.update(videos).set({ status: 'failed' }).where(and(eq(videos.id, videoId), eq(videos.tenantId, tenantId)))
  }
}
