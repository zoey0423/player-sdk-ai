import { usePlayerStore } from '../store/playerStore'
import { useAIStore } from '../store/aiStore'

export function usePlayer() {
  const playerState = usePlayerStore()
  const aiState = useAIStore()
  return { ...playerState, ...aiState }
}
