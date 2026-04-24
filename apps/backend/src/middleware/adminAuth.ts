import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', code: 'MISSING_TOKEN' })
    return
  }

  const token = authHeader.slice(7).trim()
  const secret = process.env.JWT_SECRET ?? 'dev-secret'

  try {
    jwt.verify(token, secret)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' })
  }
}
