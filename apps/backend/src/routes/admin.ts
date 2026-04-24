import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { highlights, videos } from '../db/schema'
import { adminAuthMiddleware } from '../middleware/adminAuth'

const router = Router()

// Story 7.1: Admin login
router.post('/login', (req, res) => {
  const { username, password } = req.body as { username?: unknown; password?: unknown }

  const validUser = process.env.ADMIN_USERNAME ?? 'admin'
  const validPass = process.env.ADMIN_PASSWORD ?? 'admin'

  if (username !== validUser || password !== validPass) {
    res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' })
    return
  }

  const secret = process.env.JWT_SECRET ?? 'dev-secret'
  const token = jwt.sign({ admin: true }, secret, { expiresIn: '1d' })
  res.json({ token })
})

// Protect all routes below with admin JWT
router.use(adminAuthMiddleware)

// Story 7.2: List pending-review highlights
router.get('/highlights', async (_req, res) => {
  if (!db) {
    res.json({ highlights: [] })
    return
  }

  const rows = await db
    .select({
      id: highlights.id,
      videoId: highlights.videoId,
      label: highlights.label,
      startTime: highlights.startTime,
      endTime: highlights.endTime,
      confidence: highlights.confidence,
      status: highlights.status,
      videoTitle: videos.title,
    })
    .from(highlights)
    .leftJoin(videos, eq(highlights.videoId, videos.id))
    .where(eq(highlights.status, 'pending_review'))
    .orderBy(highlights.videoId)

  res.json({ highlights: rows })
})

// Story 7.3 + 7.4: Update highlight (edit times or change status)
router.patch('/highlights/:id', async (req, res) => {
  const { id } = req.params
  const { startTime, endTime, status } = req.body as {
    startTime?: unknown; endTime?: unknown; status?: unknown
  }

  const allowedStatuses = ['published', 'deleted', 'pending_review']
  if (status !== undefined && !allowedStatuses.includes(status as string)) {
    res.status(400).json({ error: `status must be one of: ${allowedStatuses.join(', ')}` })
    return
  }

  const patch: Partial<{ startTime: number; endTime: number; status: 'published' | 'deleted' | 'pending_review' }> = {}
  if (typeof startTime === 'number') patch.startTime = startTime
  if (typeof endTime === 'number') patch.endTime = endTime
  if (typeof status === 'string') patch.status = status as 'published' | 'deleted' | 'pending_review'

  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: 'Nothing to update — provide startTime, endTime, or status' })
    return
  }

  if (!db) {
    res.json({ ok: true, updated: false })
    return
  }

  const [updated] = await db
    .update(highlights)
    .set(patch)
    .where(eq(highlights.id, id))
    .returning()

  if (!updated) {
    res.status(404).json({ error: 'Highlight not found' })
    return
  }

  res.json({ ok: true, highlight: updated })
})

export { router as adminRouter }
