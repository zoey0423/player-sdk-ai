import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(__dirname, '../../../..')

function readWorkflow(name: string) {
  const path = resolve(ROOT, `.github/workflows/${name}`)
  expect(existsSync(path), `${name} should exist`).toBe(true)
  return readFileSync(path, 'utf-8')
}

describe('GitHub Actions workflows', () => {
  it('ci.yml exists and triggers on pull_request to main', () => {
    const content = readWorkflow('ci.yml')
    expect(content).toContain('pull_request')
    expect(content).toContain('main')
  })

  it('ci.yml runs type check and tests', () => {
    const content = readWorkflow('ci.yml')
    expect(content).toContain('check-types')
    expect(content).toContain('pnpm test')
  })

  it('release.yml exists and triggers on push to main', () => {
    const content = readWorkflow('release.yml')
    expect(content).toContain('push')
    expect(content).toContain('main')
  })

  it('release.yml publishes SDK to npm', () => {
    const content = readWorkflow('release.yml')
    expect(content).toContain('pnpm publish')
    expect(content).toContain('NPM_TOKEN')
  })

  it('release.yml deploys backend to Railway', () => {
    const content = readWorkflow('release.yml')
    expect(content).toContain('RAILWAY_TOKEN')
    expect(content).toContain('RAILWAY_SERVICE_ID')
  })

  it('release.yml builds SDK before publishing', () => {
    const content = readWorkflow('release.yml')
    const buildIdx = content.indexOf('Build SDK')
    const publishIdx = content.indexOf('Publish SDK to npm')
    expect(buildIdx).toBeGreaterThan(-1)
    expect(publishIdx).toBeGreaterThan(-1)
    expect(buildIdx).toBeLessThan(publishIdx)
  })
})
