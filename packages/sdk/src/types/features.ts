export interface PlayerFeatures {
  summary?: boolean | undefined
  highlights?: boolean | undefined
  transcript?: boolean | undefined
  pip?: boolean | undefined
  subtitles?: boolean | undefined
}

export const DEFAULT_FEATURES: Required<PlayerFeatures> = {
  summary: true,
  highlights: true,
  transcript: true,
  pip: true,
  subtitles: true,
}

export function resolveFeatures(features?: PlayerFeatures | undefined): Required<PlayerFeatures> {
  return { ...DEFAULT_FEATURES, ...features }
}
