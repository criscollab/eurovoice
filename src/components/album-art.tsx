'use client'

import { cn } from '@/lib/utils'
import { VinylDisc } from '@/components/vinyl-disc'

/**
 * AlbumArt
 *
 * Shows the song's cover image with a vinyl record effect:
 *   - If `coverUrl` is provided, the image is shown inside a circle with SVG
 *     vinyl grooves overlaid around the edge.
 *   - If no `coverUrl`, falls back to a plain <VinylDisc />.
 *
 * While `spinning` is true, the disc rotates (handled by the `animate-vinyl-spin`
 * class defined globally).
 *
 * The SVG uses a unique gradient id per color so multiple AlbumArt instances on
 * the same page don't clash with each other.
 */
export function AlbumArt({
  coverUrl,
  spinning = false,
  color = '#3b82f6',
  size = 64,
  className = '',
}: {
  coverUrl?: string | null
  spinning?: boolean
  color?: string
  size?: number
  className?: string
}) {
  // Sanitize the color into a safe suffix for SVG ids. We only keep alphanumerics
  // so weird hex colors (#3b82f6) become "3b82f6" — safe to embed inside an id.
  const safeSuffix = (color || '').replace(/[^a-zA-Z0-9]/g, '') || 'accent'
  const groovesId = `album-grooves-${safeSuffix}`
  const glowId = `album-glow-${safeSuffix}`

  // No cover? Use the plain vinyl disc component.
  if (!coverUrl) {
    return (
      <VinylDisc
        spinning={spinning}
        color={color}
        size={size}
        className={className}
      />
    )
  }

  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div
        className={cn(
          'relative h-full w-full overflow-hidden rounded-full',
          spinning && 'animate-vinyl-spin'
        )}
        style={{
          background:
            'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 28%, #161616 30%, #0a0a0a 100%)',
          boxShadow: `0 0 0 2px rgba(0,0,0,0.2), 0 2px 12px -2px ${color}77`,
        }}
      >
        {/* SVG overlay: vinyl grooves + center label with the cover image clipped inside */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.9" />
              <stop offset="60%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
            <clipPath id={groovesId}>
              <circle cx="50" cy="50" r="26" />
            </clipPath>
          </defs>

          {/* Concentric vinyl grooves (outside the cover circle) */}
          {[30, 36, 42, 46].map((r) => (
            <circle
              key={r}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
            />
          ))}

          {/* Cover image, clipped to a circle in the center */}
          <image
            href={coverUrl}
            x="24"
            y="24"
            width="52"
            height="52"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${groovesId})`}
          />

          {/* Subtle ring around the cover */}
          <circle
            cx="50"
            cy="50"
            r="26"
            fill="none"
            stroke={color}
            strokeOpacity="0.4"
            strokeWidth="0.8"
          />

          {/* Subtle highlight reflection (top-right quadrant) */}
          <path
            d="M 50 50 L 50 8 A 42 42 0 0 1 92 50 Z"
            fill={`url(#${glowId})`}
            opacity="0.4"
          />

          {/* Spindle hole */}
          <circle cx="50" cy="50" r="2" fill="#000" />
        </svg>
      </div>
    </div>
  )
}
