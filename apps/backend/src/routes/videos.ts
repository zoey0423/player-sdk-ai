import { Router } from 'express'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { videos, summaries, highlights, transcripts } from '../db/schema'
import { authMiddleware } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

router.post('/', async (req, res) => {
  const { url, title } = req.body as { url?: unknown; title?: unknown }

  if (typeof url !== 'string') {
    res.status(400).json({ error: 'url is required' })
    return
  }

  if (!db) {
    res.status(202).json({ data: { videoId: 'demo-video-id', status: 'pending' } })
    return
  }

  const [row] = await db
    .insert(videos)
    .values({ tenantId: req.tenantId, url, title: typeof title === 'string' ? title : null, status: 'pending' })
    .returning({ id: videos.id })

  // AI pipeline trigger happens in Story 5.x
  res.status(202).json({ data: { videoId: row?.id, status: 'pending' } })
})

router.get('/:id/ai', async (req, res) => {
  const videoId = req.params.id

  if (!db) {
    res.json({ status: 'pending' })
    return
  }

  const [video] = await db
    .select()
    .from(videos)
    .where(and(eq(videos.id, videoId), eq(videos.tenantId, req.tenantId)))
    .limit(1)

  if (!video) {
    res.status(404).json({ error: 'Video not found' })
    return
  }

  if (video.status !== 'ready') {
    res.json({ status: video.status })
    return
  }

  const [summaryRows, highlightRows, transcriptRows] = await Promise.all([
    db.select().from(summaries).where(and(eq(summaries.videoId, videoId), eq(summaries.tenantId, req.tenantId))).limit(1),
    db.select().from(highlights).where(and(eq(highlights.videoId, videoId), eq(highlights.tenantId, req.tenantId))),
    db.select().from(transcripts).where(and(eq(transcripts.videoId, videoId), eq(transcripts.tenantId, req.tenantId))),
  ])

  res.json({
    status: 'ready',
    summary: summaryRows[0]?.content ?? null,
    highlights: highlightRows,
    transcript: transcriptRows,
  })
})

export { router as videosRouter }
