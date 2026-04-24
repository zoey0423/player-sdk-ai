import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app'

// DATABASE_URL is not set in test environment — db module returns null
// All tests exercise the "no-db" code paths

describe('PUT /api/v1/progress', () => {
  it('returns 200 with ok:true when no DATABASE_URL', async () => {
    const res = await request(app)
      .put('/api/v1/progress')
      .send({ videoId: 'vid-1', viewerId: 'viewer-abc', currentTime: 42.5 })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.persisted).toBe(false)
  })

  it('returns 400 when videoId is missing', async () => {
    const res = await request(app)
      .put('/api/v1/progress')
      .send({ viewerId: 'viewer-abc', currentTime: 10 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/videoId/)
  })

  it('returns 400 when currentTime is not a number', async () => {
    const res = await request(app)
      .put('/api/v1/progress')
      .send({ videoId: 'vid-1', viewerId: 'viewer-abc', currentTime: '10' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when body is empty', async () => {
    const res = await request(app).put('/api/v1/progress').send({})
    expect(res.status).toBe(400)
  })
})

describe('GET /api/v1/progress', () => {
  it('returns position:0 when no DATABASE_URL', async () => {
    const res = await request(app)
      .get('/api/v1/progress')
      .query({ videoId: 'vid-1', viewerId: 'viewer-abc' })
    expect(res.status).toBe(200)
    expect(res.body.position).toBe(0)
  })

  it('returns 400 when videoId is missing', async () => {
    const res = await request(app)
      .get('/api/v1/progress')
      .query({ viewerId: 'viewer-abc' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/videoId/)
  })

  it('returns 400 when viewerId is missing', async () => {
    const res = await request(app)
      .get('/api/v1/progress')
      .query({ videoId: 'vid-1' })
    expect(res.status).toBe(400)
  })
})

describe('getTenantId — demo mode', () => {
  it('uses demo-tenant-id when no Authorization header', async () => {
    const res = await request(app)
      .put('/api/v1/progress')
      .send({ videoId: 'v', viewerId: 'u', currentTime: 0 })
    // Passes without error — implicitly using demo-tenant-id
    expect(res.status).toBe(200)
  })

  it('accepts Bearer token in Authorization header', async () => {
    const res = await request(app)
      .put('/api/v1/progress')
      .set('Authorization', 'Bearer my-api-key')
      .send({ videoId: 'v', viewerId: 'u', currentTime: 5 })
    expect(res.status).toBe(200)
  })
})
