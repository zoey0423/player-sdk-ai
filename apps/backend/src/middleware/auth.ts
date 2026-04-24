import type { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import { db } from '../db'
import { apiKeys } from '../db/schema'

const DEMO_TENANT = 'demo-tenant-id'

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    req.tenantId = DEMO_TENANT
    next()
    return
  }

  const token = authHeader.slice(7).trim()
  if (!token) {
    req.tenantId = DEMO_TENANT
    next()
    return
  }

  if (!db) {
    res.status(503).json({ error: 'Database unavailable', code: 'DB_UNAVAILABLE' })
    return
  }

  try {
    const rows = await db.select({ id: apiKeys.id, tenantId: apiKeys.tenantId, keyHash: apiKeys.keyHash }).from(apiKeys)
    for (const row of rows) {
      const match = await bcrypt.compare(token, row.keyHash)
      if (match) {
        req.tenantId = row.tenantId
        next()
        return
      }
    }
    res.status(401).json({ error: '无效的 API Key', code: 'INVALID_API_KEY' })
  } catch {
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
}
