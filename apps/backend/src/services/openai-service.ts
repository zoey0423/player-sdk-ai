import OpenAI, { toFile } from 'openai'

export interface TranscriptWord {
  word: string
  startTime: number
  endTime: number
}

export interface AnalysisResult {
  summary: string
  highlights: { startTime: number; endTime: number; label: string; confidence: number }[]
}

function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function transcribeVideo(
  videoUrl: string,
  client: OpenAI | null = getClient(),
): Promise<TranscriptWord[]> {
  if (!client) throw new Error('OPENAI_API_KEY is not configured')

  // Fetch audio as a stream for the Whisper API
  const audioResponse = await fetch(videoUrl)
  if (!audioResponse.ok) throw new Error(`Failed to fetch video: ${audioResponse.status}`)

  const arrayBuffer = await audioResponse.arrayBuffer()
  const audioFile = await toFile(Buffer.from(arrayBuffer), 'audio.mp4', { type: 'audio/mp4' })

  const result = await client.audio.transcriptions.create({
    model: 'gpt-4o-mini-transcribe',
    file: audioFile,
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  })

  const words = (result as unknown as { words?: { word: string; start: number; end: number }[] }).words ?? []
  return words.map((w) => ({ word: w.word, startTime: w.start, endTime: w.end }))
}

export async function analyzeTranscript(
  transcript: TranscriptWord[],
  client: OpenAI | null = getClient(),
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
