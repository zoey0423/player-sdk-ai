import { describe, it, expect, beforeEach } from 'vitest'
import { useAIStore } from '../store/aiStore'
import { usePlayer } from '../hooks/usePlayer'

describe('useAIStore', () => {
  beforeEach(() => {
    useAIStore.getState().resetAI()
  })

  it('initializes with idle status', () => {
    const { aiStatus, summary, highlights, transcript } = useAIStore.getState()
    expect(aiStatus).toBe('idle')
    expect(summary).toBeNull()
    expect(highlights).toEqual([])
    expect(transcript).toEqual([])
  })

  it('setAIStatus updates aiStatus', () => {
    useAIStore.getState().setAIStatus('loading')
    expect(useAIStore.getState().aiStatus).toBe('loading')
  })

  it('setAIContent sets summary, highlights, transcript and status=ready', () => {
    useAIStore.getState().setAIContent({
      summary: 'A great video',
      highlights: [],
      transcript: [],
    })
    const { aiStatus, summary } = useAIStore.getState()
    expect(aiStatus).toBe('ready')
    expect(summary).toBe('A great video')
  })

  it('setAIError sets status=failed and error message', () => {
    useAIStore.getState().setAIError('Network error')
    const { aiStatus, aiError } = useAIStore.getState()
    expect(aiStatus).toBe('failed')
    expect(aiError).toBe('Network error')
  })

  it('resetAI restores initial state', () => {
    useAIStore.getState().setAIStatus('ready')
    useAIStore.getState().resetAI()
    expect(useAIStore.getState().aiStatus).toBe('idle')
  })
})

describe('usePlayer — headless hook', () => {
  it('exports usePlayer as a function', () => {
    expect(typeof usePlayer).toBe('function')
  })

  it('useAIContent hook exports as function', async () => {
    const mod = await import('../hooks/useAIContent')
    expect(typeof mod.useAIContent).toBe('function')
  })
})

describe('AI features module exports', () => {
  it('SummaryPanel exports as a function', async () => {
    const mod = await import('../components/SummaryPanel')
    expect(typeof mod.SummaryPanel).toBe('function')
  })

  it('TranscriptPanel exports as a function', async () => {
    const mod = await import('../components/TranscriptPanel')
    expect(typeof mod.TranscriptPanel).toBe('function')
  })
})
