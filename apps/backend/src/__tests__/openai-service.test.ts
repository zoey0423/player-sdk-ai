import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { transcribeVideo, analyzeTranscript, type TranscriptWord } from '../services/openai-service'

vi.stubGlobal('fetch', vi.fn())

describe('transcribeVideo (DashScope Paraformer)', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    vi.mocked(fetch).mockReset()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('throws when DASHSCOPE_API_KEY is not set', async () => {
    delete process.env.DASHSCOPE_API_KEY
    await expect(transcribeVideo('https://example.com/video.mp4')).rejects.toThrow('DASHSCOPE_API_KEY')
  })

  it('submits task, polls, fetches transcript and returns words', async () => {
    process.env.DASHSCOPE_API_KEY = 'test-key'

    const mockFetch = vi.mocked(fetch)

    // 1. Submit response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ output: { task_id: 'task-123' }, request_id: 'req-1' }),
    } as Response)

    // 2. Poll response (SUCCEEDED)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        output: {
          task_status: 'SUCCEEDED',
          results: [{ transcription_url: 'https://cdn.example.com/transcript.json' }],
        },
      }),
    } as Response)

    // 3. Fetch transcript JSON
    const transcriptPayload = {
      transcripts: [{
        sentences: [{
          text: '你好世界',
          begin_time: 0,
          end_time: 2000,
          words: [
            { text: '你好', begin_time: 0, end_time: 1000 },
            { text: '世界', begin_time: 1000, end_time: 2000 },
          ],
        }],
      }],
    }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => transcriptPayload,
    } as Response)

    const result = await transcribeVideo('https://example.com/video.mp4', undefined, 0)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ word: '你好', startTime: 0, endTime: 1 })
    expect(result[1]).toEqual({ word: '世界', startTime: 1, endTime: 2 })
  })

  it('falls back to sentence-level when no words array', async () => {
    process.env.DASHSCOPE_API_KEY = 'test-key'
    const mockFetch = vi.mocked(fetch)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ output: { task_id: 'task-456' }, request_id: 'req-2' }),
    } as Response)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        output: {
          task_status: 'SUCCEEDED',
          results: [{ transcription_url: 'https://cdn.example.com/t2.json' }],
        },
      }),
    } as Response)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transcripts: [{ sentences: [{ text: '测试句子', begin_time: 0, end_time: 3000 }] }],
      }),
    } as Response)

    const result = await transcribeVideo('https://example.com/video.mp4', undefined, 0)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ word: '测试句子', startTime: 0, endTime: 3 })
  })

  it('throws when task status is FAILED', async () => {
    process.env.DASHSCOPE_API_KEY = 'test-key'
    const mockFetch = vi.mocked(fetch)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ output: { task_id: 'task-789' }, request_id: 'req-3' }),
    } as Response)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ output: { task_status: 'FAILED', results: [] } }),
    } as Response)

    await expect(transcribeVideo('https://example.com/video.mp4', undefined, 0)).rejects.toThrow('DashScope ASR task failed')
  })

  it('returns empty array when no transcription_url in result', async () => {
    process.env.DASHSCOPE_API_KEY = 'test-key'
    const mockFetch = vi.mocked(fetch)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ output: { task_id: 'task-000' }, request_id: 'req-4' }),
    } as Response)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ output: { task_status: 'SUCCEEDED', results: [{}] } }),
    } as Response)

    const result = await transcribeVideo('https://example.com/video.mp4', undefined, 0)
    expect(result).toEqual([])
  })
})

describe('analyzeTranscript', () => {
  it('throws when client is null', async () => {
    await expect(analyzeTranscript([], null)).rejects.toThrow('OPENAI_API_KEY')
  })

  it('parses summary and highlights from GPT response', async () => {
    const mockResponse = {
      summary: 'A test video about programming.',
      highlights: [
        { startTime: 10, endTime: 30, label: 'Key concept', confidence: 0.9 },
      ],
    }

    const mockClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: JSON.stringify(mockResponse) } }],
          }),
        },
      },
    }

    const transcript: TranscriptWord[] = [{ word: 'hello', startTime: 0, endTime: 0.5 }]
    const result = await analyzeTranscript(transcript, mockClient as never)
    expect(result.summary).toBe('A test video about programming.')
    expect(result.highlights).toHaveLength(1)
    expect(result.highlights[0]?.confidence).toBe(0.9)
  })

  it('clamps confidence to [0, 1]', async () => {
    const mockResponse = {
      summary: 'Test',
      highlights: [{ startTime: 0, endTime: 10, label: 'x', confidence: 1.5 }],
    }

    const mockClient = {
      chat: { completions: { create: vi.fn().mockResolvedValue({ choices: [{ message: { content: JSON.stringify(mockResponse) } }] }) } },
    }

    const result = await analyzeTranscript([], mockClient as never)
    expect(result.highlights[0]?.confidence).toBeLessThanOrEqual(1)
  })
})
