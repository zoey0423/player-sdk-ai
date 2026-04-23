import { describe, it, expect } from 'vitest'
import {
  videos,
  transcripts,
  highlights,
  summaries,
  apiKeys,
  events,
  watchProgress,
  videoStatusEnum,
  highlightStatusEnum,
} from '../db/schema'

describe('DB Schema — table definitions', () => {
  const tables = { videos, transcripts, highlights, summaries, apiKeys, events, watchProgress }

  it('exports all 7 tables', () => {
    expect(Object.keys(tables)).toHaveLength(7)
    for (const table of Object.values(tables)) {
      expect(table).toBeDefined()
    }
  })

  it('all tables have tenant_id column', () => {
    for (const [name, table] of Object.entries(tables)) {
      const cols = Object.keys(table)
      expect(cols, `${name} missing tenantId`).toContain('tenantId')
    }
  })

  it('videos table has status, introEnd, outroStart fields', () => {
    expect(Object.keys(videos)).toContain('status')
    expect(Object.keys(videos)).toContain('introEnd')
    expect(Object.keys(videos)).toContain('outroStart')
    expect(Object.keys(videos)).toContain('introDetectionMethod')
  })

  it('highlights table has confidence and status fields', () => {
    expect(Object.keys(highlights)).toContain('confidence')
    expect(Object.keys(highlights)).toContain('status')
  })

  it('videoStatusEnum has correct values', () => {
    expect(videoStatusEnum.enumValues).toEqual(['pending', 'processing', 'ready', 'failed'])
  })

  it('highlightStatusEnum has correct values', () => {
    expect(highlightStatusEnum.enumValues).toEqual(['pending_review', 'published', 'deleted'])
  })
})

describe('DB Schema — /health endpoint with DB check', () => {
  it('returns disconnected when no DATABASE_URL is set', async () => {
    const { app } = await import('../app')
    const request = (await import('supertest')).default

    const original = process.env.DATABASE_URL
    delete process.env.DATABASE_URL

    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.db).toBe('disconnected')

    process.env.DATABASE_URL = original
  })
})
