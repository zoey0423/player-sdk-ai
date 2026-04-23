import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import { resolve } from 'path'

const DIST = resolve(__dirname, '../../dist')

describe('SDK build outputs', () => {
  it('ESM bundle exists', () => {
    expect(existsSync(resolve(DIST, 'index.js'))).toBe(true)
  })

  it('CJS bundle exists', () => {
    expect(existsSync(resolve(DIST, 'index.cjs'))).toBe(true)
  })

  it('TypeScript declarations exist', () => {
    expect(existsSync(resolve(DIST, 'index.d.ts'))).toBe(true)
  })

  it('style.css exists', () => {
    expect(existsSync(resolve(DIST, 'style.css'))).toBe(true)
  })
})

describe('SDK exports', () => {
  it('exports VideoPlayer component', async () => {
    const sdk = await import('../../src/index')
    expect(sdk.VideoPlayer).toBeDefined()
    expect(typeof sdk.VideoPlayer).toBe('function')
  })
})

describe('Vite build config', () => {
  it('externalizes React and ReactDOM', async () => {
    const { default: config } = await import('../../vite.config')
    const external = config.build?.rollupOptions?.external as string[]
    expect(external).toContain('react')
    expect(external).toContain('react-dom')
    expect(external).toContain('react/jsx-runtime')
  })
})
