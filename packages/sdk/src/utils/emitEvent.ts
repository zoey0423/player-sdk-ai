import type { PlayerEvent, PlayerEventType } from '../types/events'

export function emitEvent<T extends PlayerEventType>(
  onEvent: ((event: PlayerEvent) => void) | undefined,
  type: T,
  payload: PlayerEvent<T>['payload'],
): void {
  if (!onEvent) return
  try {
    onEvent({ type, timestamp: Date.now(), payload } as PlayerEvent)
  } catch {
    // swallow — caller errors must not break playback
  }
}
