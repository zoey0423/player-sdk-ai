import OpenAI from 'openai'

export interface TranscriptWord {
  word: string
  startTime: number
  endTime: number
}

export interface AnalysisResult {
  summary: string
  highlights: { startTime: number; endTime: number; label: string; confidence: number }[]
}

// ─── DashScope Paraformer transcription ──────────────────────────────────────

interface DashScopeSubmitResponse {
  output: { task_id: string }
  request_id: string
}

interface DashScopeResultResponse {
  output: {
    task_status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'
    results?: {
      transcription_url?: string
    }[]
  }
}

interface ParaformerTranscript {
  transcripts: {
    sentences: {
      text: string
      begin_time: number
      end_time: number
      words?: { text: string; begin_time: number; end_time: number }[]
    }[]
  }[]
}

export async function pollDashScope(
  taskId: string,
  apiKey: string,
  delayMs = 5000,
): Promise<DashScopeResultResponse> {
  const url = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`
  for (let attempt = 0; attempt < 60; attempt++) {
    await new Promise((r) => setTimeout(r, delayMs))
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
    if (!res.ok) throw new Error(`DashScope poll failed: ${res.status}`)
    const data = (await res.json()) as DashScopeResultResponse
    const status = data.output.task_status
    if (status === 'SUCCEEDED' || status === 'FAILED') return data
  }
  throw new Error('DashScope ASR timed out after 5 minutes')
}

export async function transcribeVideo(
  videoUrl: string,
  _unused?: unknown,
  pollDelayMs = 5000,
): Promise<TranscriptWord[]> {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) throw new Error('DASHSCOPE_API_KEY is not configured')

  // Submit async transcription task
  const submitRes = await fetch(
    'https://dashscope.aliyuncs.com/api/v1/services/audio/asr/transcription',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify({
        model: 'paraformer-v2',
        input: { file_urls: [videoUrl] },
        parameters: { language_hints: ['zh', 'en'], enable_words: true },
      }),
    },
  )

  if (!submitRes.ok) throw new Error(`DashScope submit failed: ${submitRes.status}`)
  const submitData = (await submitRes.json()) as DashScopeSubmitResponse
  const taskId = submitData.output.task_id

  // Poll for completion
  const result = await pollDashScope(taskId, apiKey, pollDelayMs)
  if (result.output.task_status === 'FAILED') throw new Error('DashScope ASR task failed')

  const transcriptionUrl = result.output.results?.[0]?.transcription_url
  if (!transcriptionUrl) return []

  const transcriptRes = await fetch(transcriptionUrl)
  if (!transcriptRes.ok) throw new Error(`Failed to fetch transcript: ${transcriptRes.status}`)
  const transcript = (await transcriptRes.json()) as ParaformerTranscript

  const words: TranscriptWord[] = []
  for (const t of transcript.transcripts ?? []) {
    for (const sentence of t.sentences ?? []) {
      if (sentence.words && sentence.words.length > 0) {
        for (const w of sentence.words) {
          words.push({
            word: w.text,
            startTime: w.begin_time / 1000,
            endTime: w.end_time / 1000,
          })
        }
      } else {
        // Fallback: treat whole sentence as one word entry
        words.push({
          word: sentence.text,
          startTime: sentence.begin_time / 1000,
          endTime: sentence.end_time / 1000,
        })
      }
    }
  }

  return words
}

// ─── OpenAI GPT analysis (summary + highlights) ──────────────────────────────

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function analyzeTranscript(
  transcript: TranscriptWord[],
  client: OpenAI | null = getOpenAIClient(),
): Promise<AnalysisResult> {
  if (!client) throw new Error('OPENAI_API_KEY is not configured')

  const transcriptText = transcript.map((w) => w.word).join(' ')

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a video content analyst. Given a video transcript, produce:
1. A concise summary (2-3 sentences)
2. 3-5 highlight segments with startTime, endTime (in seconds), label, and confidence (0-1)

The transcript is word-level with timing. Estimate timestamps based on word positions.

Return JSON: { "summary": string, "highlights": [{ "startTime": number, "endTime": number, "label": string, "confidence": number }] }`,
      },
      { role: 'user', content: transcriptText },
    ],
  })

  const parsed = JSON.parse(response.choices[0]?.message.content ?? '{}') as {
    summary?: string
    highlights?: { startTime: number; endTime: number; label: string; confidence: number }[]
  }

  return {
    summary: parsed.summary ?? '',
    highlights: (parsed.highlights ?? []).map((h) => ({
      startTime: Number(h.startTime),
      endTime: Number(h.endTime),
      label: String(h.label),
      confidence: Math.min(1, Math.max(0, Number(h.confidence))),
    })),
  }
}
