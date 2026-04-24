import { describe, it, expect, vi } from 'vitest'
import { transcribeVideo, analyzeTranscript, type TranscriptWord } from '../services/openai-service'

// Mock the global fetch for video download
vi.stubGlobal('fetch', vi.fn())

describe('transcribeVideo', () => {
  it('throws when client is null (no OPENAI_API_KEY)', async () => {
    await expect(transcribeVideo('https://example.com/video.mp4', null)).rejects.toThrow('OPENAI_API_KEY')
  })

  it('calls client.audio.transcriptions.create with correct model', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    } as Response)

    const mockClient = {
      audio: {
        transcriptions: {
          create: vi.fn().mockResolvedValue({
            words: [
              { word: 'hello', start: 0, end: 0.5 },
              { word: 'world', start: 0.5, end: 1.0 },
            ],
          }),
        },
      },
    }

    const result = await transcribeVideo('https://example.com/video.mp4', mockClient as never)
    expect(mockClient.audio.transcriptions.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-4o-mini-transcribe' }),
    )
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ word: 'hello', startTime: 0, endTime: 0.5 })
    expect(result[1]).toEqual({ word: 'world', startTime: 0.5, endTime: 1.0 })
  })

  it('returns empty array when no words in response', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    } as Response)

    const mockClient = {
      audio: {
        transcriptions: {
          create: vi.fn().mockResolvedValue({}),
        },
      },
    }

    const result = await transcribeVideo('https://example.com/video.mp4', mockClient as never)
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
