import { Router } from 'express'
import { db } from '../db'
import { events } from '../db/schema'
import { authMiddleware } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

router.post('/', async (req, res) => {
  const { videoId, viewerId, type, payload } = req.body as {
    videoId?: unknown; viewerId?: unknown; type?: unknown; payload?: unknown
  }

  if (typeof videoId !== 'string' || typeof viewerId !== 'string' || typeof type !== 'string') {
    res.status(400).json({ error: 'videoId, viewerId, and type are required strings' })
    return
  }

  if (!db) {
    res.json({ ok: true, persisted: false })
    return
  }

  // Fire-and-forget: non-blocking write (NFR5)
  db.insert(events).values({
    videoId,
    tenantId: req.tenantId,
    viewerId,
    type,
    payload: (payload as Record<string, unknown> | null) ?? null,
  }).catch(() => {})

  res.json({ ok: true, persisted: true })
})

export { router as eventsRouter }
