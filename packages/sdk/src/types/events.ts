export type PlayerEventType =
  | 'player:play'
  | 'player:pause'
  | 'player:seek'
  | 'player:volume'
  | 'player:rate'
  | 'highlight:click'
  | 'transcript:click'

export interface PlayerEvent<T extends PlayerEventType = PlayerEventType> {
  type: T
  timestamp: number
  payload: PlayerEventPayloadMap[T]
}

export interface PlayerEventPayloadMap {
  'player:play': { currentTime: number }
  'player:pause': { currentTime: number }
  'player:seek': { from: number; to: number }
  'player:volume': { volume: number; muted: boolean }
  'player:rate': { rate: number }
  'highlight:click': { highlightId: string; timestamp: number }
  'transcript:click': { word: string; timestamp: number }
}
