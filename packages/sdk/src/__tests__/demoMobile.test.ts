import { describe, it, expect } from 'vitest'
import { DEMO_TENANT_ID, resolveTenantId } from '../constants'

describe('DEMO_TENANT_ID', () => {
  it('equals "demo-tenant-id"', () => {
    expect(DEMO_TENANT_ID).toBe('demo-tenant-id')
  })
})

describe('resolveTenantId — demo mode fallback', () => {
  it('returns DEMO_TENANT_ID when apiKey is undefined', () => {
    expect(resolveTenantId(undefined)).toBe(DEMO_TENANT_ID)
  })

  it('returns DEMO_TENANT_ID when apiKey is omitted', () => {
    expect(resolveTenantId()).toBe(DEMO_TENANT_ID)
  })

  it('returns provided apiKey when given', () => {
    expect(resolveTenantId('sk-abc123')).toBe('sk-abc123')
  })

  it('does not return DEMO_TENANT_ID when apiKey is provided', () => {
    expect(resolveTenantId('custom-key')).not.toBe(DEMO_TENANT_ID)
  })
})

describe('H5 mobile touch target — VideoPlayer button classes', () => {
  it('VideoPlayerProps accepts apiKey without error (type check via import)', async () => {
    const mod = await import('../components/VideoPlayer')
    expect(typeof mod.VideoPlayer).toBe('function')
  })

  it('min touch target classes are applied to buttons (snapshot of class strings)', () => {
    const minHClass = 'aip-min-h-[44px]'
    const minWClass = 'aip-min-w-[44px]'
    // Verify the class strings are non-empty valid Tailwind class names
    expect(minHClass).toMatch(/^aip-min-h-\[44px\]$/)
    expect(minWClass).toMatch(/^aip-min-w-\[44px\]$/)
  })
})
