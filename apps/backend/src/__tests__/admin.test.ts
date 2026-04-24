import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app'

describe('POST /api/v1/admin/login', () => {
  it('returns 401 for wrong credentials', async () => {
    const res = await request(app)
      .post('/api/v1/admin/login')
      .send({ username: 'wrong', password: 'wrong' })
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('INVALID_CREDENTIALS')
  })

  it('returns JWT token for correct credentials', async () => {
    // Default env: ADMIN_USERNAME and ADMIN_PASSWORD default to 'admin'/'admin' in code
    const res = await request(app)
      .post('/api/v1/admin/login')
      .send({ username: 'admin', password: 'admin' })
    expect(res.status).toBe(200)
    expect(typeof res.body.token).toBe('string')
    expect(res.body.token.split('.').length).toBe(3) // JWT has 3 parts
  })
})

describe('Admin JWT middleware', () => {
  it('returns 401 when no Authorization header', async () => {
    const res = await request(app).get('/api/v1/admin/highlights')
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('MISSING_TOKEN')
  })

  it('returns 401 for invalid JWT', async () => {
    const res = await request(app)
      .get('/api/v1/admin/highlights')
      .set('Authorization', 'Bearer not-a-real-jwt')
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('INVALID_TOKEN')
  })

  it('allows access with valid JWT', async () => {
    const loginRes = await request(app)
      .post('/api/v1/admin/login')
      .send({ username: 'admin', password: 'admin' })
    const { token } = loginRes.body as { token: string }

    const res = await request(app)
      .get('/api/v1/admin/highlights')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.highlights).toEqual([]) // no DB → empty array
  })
})

describe('GET /api/v1/admin/highlights', () => {
  it('returns empty list when no DATABASE_URL', async () => {
    const loginRes = await request(app)
      .post('/api/v1/admin/login')
      .send({ username: 'admin', password: 'admin' })
    const token = (loginRes.body as { token: string }).token

    const res = await request(app)
      .get('/api/v1/admin/highlights')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.highlights)).toBe(true)
  })
})

describe('PATCH /api/v1/admin/highlights/:id', () => {
  let token: string
  const setup = async () => {
    const loginRes = await request(app)
      .post('/api/v1/admin/login')
      .send({ username: 'admin', password: 'admin' })
    token = (loginRes.body as { token: string }).token
  }

  it('returns 400 for invalid status value', async () => {
    await setup()
    const res = await request(app)
      .patch('/api/v1/admin/highlights/some-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'invalid-status' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/status/)
  })

  it('returns 400 when body is empty', async () => {
    await setup()
    const res = await request(app)
      .patch('/api/v1/admin/highlights/some-id')
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Nothing to update/)
  })

  it('returns ok:true with updated:false when no DATABASE_URL', async () => {
    await setup()
    const res = await request(app)
      .patch('/api/v1/admin/highlights/some-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'published' })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.updated).toBe(false)
  })
})
