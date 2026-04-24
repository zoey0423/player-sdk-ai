import express from 'express'
import { neon } from '@neondatabase/serverless'
import { progressRouter } from './routes/progress'

export const app = express()

app.use(express.json())

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

app.use('/api/v1/progress', progressRouter)

export default app
