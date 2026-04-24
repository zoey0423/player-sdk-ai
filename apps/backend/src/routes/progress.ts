import { Router } from 'express'
import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { watchProgress } from '../db/schema'

const router = Router()

const DEMO_TENANT = 'demo-tenant-id'

function getTenantId(authHeader?: string): string {
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    if (token) return token
  }
  return DEMO_TENANT
}

router.put('/', async (req, res) => {
  const tenantId = getTenantId(req.headers.authorization)
  const { videoId, viewerId, currentTime } = req.body as {
    videoId?: unknown; viewerId?: unknown; currentTime?: unknown
  }

  if (typeof videoId !== 'string' || typeof viewerId !== 'string' || typeof currentTime !== 'number') {
    res.status(400).json({ error: 'videoId (string), viewerId (string), and currentTime (number) are required' })
    return
  }

  if (!db) {
    res.json({ ok: true, persisted: false })
    return
  }

  const existing = await db
    .select({ id: watchProgress.id })
    .from(watchProgress)
    .where(
      and(
        eq(watchProgress.videoId, videoId),
        eq(watchProgress.viewerId, viewerId),
        eq(watchProgress.tenantId, tenantId),
      ),
    )
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(watchProgress)
      .set({ position: currentTime, updatedAt: new Date() })
      .where(
        and(
          eq(watchProgress.videoId, videoId),
          eq(watchProgress.viewerId, viewerId),
          eq(watchProgress.tenantId, tenantId),
        ),
      )
  } else {
    await db.insert(watchProgress).values({ videoId, tenantId, viewerId, position: currentTime })
  }

  res.json({ ok: true, persisted: true })
})

router.get('/', async (req, res) => {
  const tenantId = getTenantId(req.headers.authorization)
  const { videoId, viewerId } = req.query as { videoId?: string; viewerId?: string }

  if (!videoId || !viewerId) {
    res.status(400).json({ error: 'videoId and viewerId are required query params' })
    return
  }

  if (!db) {
    res.json({ position: 0 })
    return
  }

  const rows = await db
    .select({ position: watchProgress.position })
    .from(watchProgress)
    .where(
      and(
        eq(watchProgress.videoId, videoId),
        eq(watchProgress.viewerId, viewerId),
        eq(watchProgress.tenantId, tenantId),
      ),
    )
    .limit(1)

  res.json({ position: rows[0]?.position ?? 0 })
})

export { router as progressRouter }
