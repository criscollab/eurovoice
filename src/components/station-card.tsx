'use client'

import { useRadioStore, type StationWithCount } from '@/lib/radio-store'
import { VinylDisc } from '@/components/vinyl-disc'
import { EqualizerBars } from '@/components/equalizer-bars'
import { Music2, Languages, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * StationCard
 * Clickable card representing a single radio station. Clicking it loads
 * the station into the player.
 */
export function StationCard({ station }: { station: StationWithCount }) {
  const { activeStation, setActiveStation, isPlaying } = useRadioStore()
  const isActive = activeStation?.id === station.id
  const accent = station.color

  return (
    <button
      onClick={() => setActiveStation(station)}
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-all',
        'hover:-translate-y-1 hover:shadow-2xl',
        isActive ? 'border-transparent' : 'border-white/5 hover:border-white/15'
      )}
      style={{
        background:
          'linear-gradient(135deg, color-mix(in oklch, var(--card) 80%, transparent) 0%, color-mix(in oklch, var(--card) 40%, transparent) 100%)',
        boxShadow: isActive
          ? `0 0 0 2px ${accent}, 0 0 40px -6px ${accent}`
          : undefined,
      }}
    >
      {/* Decorative glow */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-60"
        style={{ background: accent }}
      />

      {/* Top row: vinyl + live badge */}
      <div className="relative flex items-start justify-between">
        <VinylDisc
          spinning={isActive && isPlaying}
          color={accent}
          size={72}
        />
        {isActive ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{
              color: accent,
              background: `color-mix(in oklch, ${accent} 18%, transparent)`,
            }}
          >
            <span
              className="animate-live-pulse h-1.5 w-1.5 rounded-full"
              style={{ background: accent }}
            />
            En vivo
          </span>
        ) : (
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
            {station._count.songs} {station._count.songs === 1 ? 'canción' : 'canciones'}
          </span>
        )}
      </div>

      {/* Title + language */}
      <div className="mt-4">
        <h3 className="text-lg font-bold text-foreground">{station.name}</h3>
        <div
          className="mt-1 inline-flex items-center gap-1.5 text-xs"
          style={{ color: accent }}
        >
          <Languages className="h-3 w-3" />
          <span>{station.language}</span>
        </div>
      </div>

      {/* Description */}
      {station.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {station.description}
        </p>
      )}

      {/* Footer: now playing or play CTA */}
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        {isActive ? (
          <div className="flex items-center gap-2">
            <span style={{ color: accent }}>
              <EqualizerBars playing={isPlaying} count={4} />
            </span>
            <span className="text-xs font-medium text-foreground">
              Reproduciendo
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Radio className="h-3.5 w-3.5" />
            <span>Sintonizar</span>
          </div>
        )}
        <Music2
          className="h-4 w-4 transition-colors"
          style={{ color: isActive ? accent : 'currentColor' }}
        />
      </div>
    </button>
  )
}
