export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const remaining = s % 60
  return `${m}:${String(remaining).padStart(2, '0')}`
}

export function getThumbnailFrameIndex(
  hoverTime: number,
  intervalSeconds: number,
  frameCount: number,
): number {
  return Math.min(Math.floor(hoverTime / intervalSeconds), frameCount - 1)
}
