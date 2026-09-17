'use client'

import { cn } from '@/lib/utils'

/**
 * VinylDisc
 * SVG-based vinyl record that spins while playing.
 * Color can be tinted to match the station's accent color.
 * Works on both light and dark themes.
 */
export function VinylDisc({
  spinning = true,
  color = '#3b82f6',
  size = 64,
  className = '',
}: {
  spinning?: boolean
  color?: string
  size?: number
  className?: string
}) {
  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div
        className={cn(
          'h-full w-full rounded-full',
          spinning && 'animate-vinyl-spin'
        )}
        style={{
          background:
            'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 28%, #161616 30%, #0a0a0a 100%)',
          boxShadow: `0 0 0 2px rgba(0,0,0,0.2), 0 2px 12px -2px ${color}77`,
        }}
      >
        {/* concentric grooves */}
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <radialGradient id="vinyl-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.9" />
              <stop offset="60%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          </defs>
          {[15, 22, 30, 38, 46].map((r) => (
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
          {/* center label */}
          <circle cx="50" cy="50" r="12" fill={color} />
          <circle cx="50" cy="50" r="11" fill="rgba(0,0,0,0.35)" />
          {/* spindle hole */}
          <circle cx="50" cy="50" r="2" fill="#000" />
          {/* subtle highlight reflection */}
          <path
            d="M 50 50 L 50 8 A 42 42 0 0 1 92 50 Z"
            fill="url(#vinyl-glow)"
            opacity="0.5"
          />
        </svg>
      </div>
    </div>
  )
}
