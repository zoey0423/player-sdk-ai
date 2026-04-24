import express from 'express'
import rateLimit from 'express-rate-limit'
import { neon } from '@neondatabase/serverless'
import { progressRouter } from './routes/progress'
import { videosRouter } from './routes/videos'
import { eventsRouter } from './routes/events'
import { adminRouter } from './routes/admin'

export const app = express()

app.use(express.json())

// CORS — allow SDK to call from any origin
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (_req.method === 'OPTIONS') { res.sendStatus(204); return }
  next()
})

const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: '请求过于频繁', code: 'RATE_LIMITED' }),
})

const eventsLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: '请求过于频繁', code: 'RATE_LIMITED' }),
})

app.get('/health', async (_req, res) => {
  let dbStatus: 'connected' | 'disconnected' = 'disconnected'

  if (process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL)
      await sql`SELECT 1`
      dbStatus = 'connected'
    } catch {
      dbStatus = 'disconnected'
    }
  }

  res.json({ status: 'ok', db: dbStatus })
})

app.use('/api/v1/progress', apiLimiter, progressRouter)
app.use('/api/v1/videos', apiLimiter, videosRouter)
app.use('/api/v1/events', eventsLimiter, eventsRouter)
app.use('/api/v1/admin', apiLimiter, adminRouter)

export default app
