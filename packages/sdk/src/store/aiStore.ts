import { create } from 'zustand'

export interface AIHighlight {
  id: string
  videoId: string
  startTime: number
  endTime: number
  label: string
  confidence: number
  status: 'published' | 'pending_review' | 'deleted'
}

export interface AITranscriptWord {
  id: string
  word: string
  startTime: number
  endTime: number
}

export type AIStatus = 'idle' | 'loading' | 'ready' | 'failed'

interface AIState {
  aiStatus: AIStatus
  summary: string | null
  highlights: AIHighlight[]
  transcript: AITranscriptWord[]
  aiError: string | null
}

interface AIActions {
  setAIStatus: (status: AIStatus) => void
  setAIContent: (data: { summary?: string | null; highlights?: AIHighlight[]; transcript?: AITranscriptWord[] }) => void
  setAIError: (error: string | null) => void
  resetAI: () => void
}

const INITIAL: AIState = {
  aiStatus: 'idle',
  summary: null,
  highlights: [],
  transcript: [],
  aiError: null,
}

export const useAIStore = create<AIState & AIActions>((set) => ({
  ...INITIAL,
  setAIStatus: (aiStatus) => set({ aiStatus }),
  setAIContent: (data) =>
    set({
      summary: data.summary ?? null,
      highlights: data.highlights ?? [],
      transcript: data.transcript ?? [],
      aiStatus: 'ready',
      aiError: null,
    }),
  setAIError: (aiError) => set({ aiError, aiStatus: 'failed' }),
  resetAI: () => set(INITIAL),
}))
