import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app'

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  it('returns JSON content-type', async () => {
    const res = await request(app).get('/health')
    expect(res.headers['content-type']).toMatch(/application\/json/)
  })

  it('includes db field in response', async () => {
    const res = await request(app).get('/health')
    expect(res.body).toHaveProperty('db')
    expect(['connected', 'disconnected']).toContain(res.body.db)
  })
})
