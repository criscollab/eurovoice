'use client'

/**
 * EqualizerBars
 * Animated audio-visualizer bars used to indicate "this is currently playing".
 * Purely decorative — no Web Audio API dependency.
 */
export function EqualizerBars({
  count = 5,
  className = '',
  barClassName = '',
  playing = true,
}: {
  count?: number
  className?: string
  barClassName?: string
  playing?: boolean
}) {
  const bars = Array.from({ length: count })
  return (
    <div
      className={`flex items-end gap-[2px] ${className}`}
      aria-hidden="true"
    >
      {bars.map((_, i) => (
        <span
          key={i}
          className={`eq-bar block w-[3px] rounded-full ${barClassName}`}
          style={{
            height: '14px',
            background: 'currentColor',
            animationDelay: `${(i * 0.13).toFixed(2)}s`,
            animationDuration: `${(0.7 + (i % 3) * 0.18).toFixed(2)}s`,
            animationPlayState: playing ? 'running' : 'paused',
            opacity: playing ? 1 : 0.35,
            transform: playing ? undefined : 'scaleY(0.25)',
          }}
        />
      ))}
    </div>
  )
}
