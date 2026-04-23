export interface VideoPlayerProps {
  src: string
  apiKey?: string
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  return (
    <div data-testid="video-player">
      <video src={src} controls />
    </div>
  )
}
