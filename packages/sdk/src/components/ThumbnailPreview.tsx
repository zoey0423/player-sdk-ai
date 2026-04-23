import { formatTime, getThumbnailFrameIndex } from '../utils/time'

export interface ThumbnailTrack {
  type: 'frames'
  urls: string[]
  intervalSeconds: number
}

interface ThumbnailPreviewProps {
  hoverTime: number
  hoverX: number
  barWidth: number
  thumbnails?: ThumbnailTrack | undefined
}

export function ThumbnailPreview({ hoverTime, hoverX, barWidth, thumbnails }: ThumbnailPreviewProps) {
  const PREVIEW_WIDTH = 120
  const left = Math.min(Math.max(hoverX - PREVIEW_WIDTH / 2, 0), barWidth - PREVIEW_WIDTH)

  const frameUrl = thumbnails
    ? thumbnails.urls[getThumbnailFrameIndex(hoverTime, thumbnails.intervalSeconds, thumbnails.urls.length)]
    : null

  return (
    <div
      role="tooltip"
      aria-label={`Preview at ${formatTime(hoverTime)}`}
      className="aip-absolute aip-bottom-6 aip-flex aip-flex-col aip-items-center aip-gap-1 aip-pointer-events-none"
      style={{ left, width: PREVIEW_WIDTH }}
    >
      {frameUrl && (
        <img
          src={frameUrl}
          alt={`Thumbnail at ${formatTime(hoverTime)}`}
          className="aip-w-full aip-rounded aip-border aip-border-white/20"
        />
      )}
      <span className="aip-rounded aip-bg-black/80 aip-px-1.5 aip-py-0.5 aip-text-xs aip-text-white">
        {formatTime(hoverTime)}
      </span>
    </div>
  )
}
