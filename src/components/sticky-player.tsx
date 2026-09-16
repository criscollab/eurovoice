'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRadioStore } from '@/lib/radio-store'
import { formatTime } from '@/lib/radio'
import { VinylDisc } from '@/components/vinyl-disc'
import { EqualizerBars } from '@/components/equalizer-bars'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Volume2, VolumeX, Pause, Play, Radio, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * StickyPlayer
 * Persistent bottom player. Syncs to the station's 24/7 timeline:
 * - Polls /api/stations/[id]/now-playing every 5s
 * - When the song changes, loads the new audio at the correct offset
 * - When the song's remaining time runs out, advances automatically
 */
export function StickyPlayer() {
  const {
    activeStation,
    nowPlaying,
    setNowPlaying,
    isPlaying,
    setIsPlaying,
    togglePlay,
    volume,
    setVolume,
  } = useRadioStore()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [progress, setProgress] = useState(0) // seconds played in current song
  const [expanded, setExpanded] = useState(false)
  const [loadingTrack, setLoadingTrack] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastSongIdRef = useRef<string | null>(null)

  // === Fetch now-playing info from the server ===
  const fetchNowPlaying = useCallback(async () => {
    if (!activeStation) return null
    try {
      const res = await fetch(`/api/stations/${activeStation.id}/now-playing`, {
        cache: 'no-store',
      })
      if (!res.ok) return null
      const data = await res.json()
      return data?.nowPlaying ?? null
    } catch {
      return null
    }
  }, [activeStation])

  // === Polling loop: refresh now-playing periodically ===
  useEffect(() => {
    if (!activeStation) {
      setNowPlaying(null)
      setIsPlaying(false)
      return
    }

    let cancelled = false

    const tick = async () => {
      const np = await fetchNowPlaying()
      if (cancelled || !np) return
      setNowPlaying(np)
      // Schedule the next poll well before the current song ends,
      // but no later than 5s.
      const nextDelay = Math.min(5000, Math.max(2000, (np.remaining * 1000) - 1500))
      pollTimerRef.current = setTimeout(tick, nextDelay)
    }

    tick()

    return () => {
      cancelled = true
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    }
  }, [activeStation])

  // === When the song changes, load the new audio at the correct offset ===
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !nowPlaying) return

    const songId = nowPlaying.song.id
    if (lastSongIdRef.current === songId) return
    lastSongIdRef.current = songId

    // Defer state updates to avoid synchronous setState in the effect body
    Promise.resolve().then(() => {
      setLoadingTrack(true)
      setError(null)
    })

    const url = nowPlaying.song.audioUrl
    // Force the audio element to reload with the new source.
    audio.src = url
    audio.load()

    // We need to seek to the offset once metadata is loaded
    const handleLoadedMetadata = () => {
      try {
        // Clamp offset to a safe range
        const dur = audio.duration && Number.isFinite(audio.duration) ? audio.duration : nowPlaying.song.duration
        const offset = Math.min(Math.max(0, nowPlaying.offset), Math.max(0, dur - 0.5))
        audio.currentTime = offset
        setProgress(offset)
      } catch {
        // Some browsers throw if not yet seekable; ignore
      }
      setLoadingTrack(false)
      // Auto-play if the user previously had it playing
      if (isPlaying) {
        audio.play().catch((e) => {
          console.warn('Autoplay blocked:', e)
          setIsPlaying(false)
        })
      }
    }

    const handleError = () => {
      setError('No se pudo cargar el audio. Verifica la URL.')
      setLoadingTrack(false)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('error', handleError)
    }
  }, [nowPlaying?.song.id])

  // === Update volume on the audio element ===
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // === Handle play/pause ===
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.play().catch((e) => {
        console.warn('Play failed:', e)
        setIsPlaying(false)
      })
    } else {
      audio.pause()
    }
  }, [isPlaying])

  // === Track time updates for progress bar ===
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => {
      setProgress(audio.currentTime)
    }
    audio.addEventListener('timeupdate', onTimeUpdate)
    return () => audio.removeEventListener('timeupdate', onTimeUpdate)
  }, [])

  // === Auto-advance to the next song when current ends ===
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onEnded = () => {
      // Force a fresh fetch of now-playing — the server will tell us the next song
      fetchNowPlaying().then((np) => {
        if (np) {
          setNowPlaying(np)
          lastSongIdRef.current = null // allow the song-change effect to re-run
        }
      })
    }
    audio.addEventListener('ended', onEnded)
    return () => audio.removeEventListener('ended', onEnded)
  }, [nowPlaying?.song.id, activeStation])

  if (!activeStation) return null

  const accent = activeStation.color
  const song = nowPlaying?.song
  const totalDuration = song?.duration ?? 1

  return (
    <>
      <audio ref={audioRef} preload="auto" />
      {/* Player container */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur-xl transition-all',
          expanded ? 'h-[88vh] rounded-t-2xl' : 'h-auto'
        )}
        style={{
          borderColor: `color-mix(in oklch, ${accent} 25%, var(--border))`,
          boxShadow: `0 -8px 32px -8px color-mix(in oklch, ${accent} 20%, transparent)`,
        }}
      >
        {/* Top accent bar */}
        <div
          className="h-[2px] w-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          }}
        />

        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:px-6">
          {/* Main row */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Vinyl + cover */}
            <div className="flex shrink-0 items-center gap-3">
              <VinylDisc
                spinning={isPlaying && !loadingTrack}
                color={accent}
                size={56}
                className="md:hidden"
              />
              <VinylDisc
                spinning={isPlaying && !loadingTrack}
                color={accent}
                size={72}
                className="hidden md:block"
              />
              <div className="min-w-0 max-w-[180px] md:max-w-[280px]">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
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
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {activeStation.name}
                  </span>
                </div>
                {song ? (
                  <>
                    <p className="mt-1 truncate text-sm font-semibold text-foreground">
                      {song.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {song.artist}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sin programación
                  </p>
                )}
              </div>
            </div>

            {/* Controls (center) */}
            <div className="flex flex-1 flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpanded((e) => !e)}
                  className="hidden md:inline-flex"
                  aria-label={expanded ? 'Contraer' : 'Expandir'}
                >
                  <ChevronUp
                    className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
                  />
                </Button>
                <Button
                  onClick={togglePlay}
                  disabled={!song || loadingTrack}
                  className="h-12 w-12 rounded-full p-0"
                  style={{
                    background: accent,
                    color: '#ffffff',
                    boxShadow: `0 4px 16px -2px ${accent}aa`,
                  }}
                  aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                >
                  {loadingTrack ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 translate-x-[1px]" />
                  )}
                </Button>
                <div style={{ color: accent }}>
                  <EqualizerBars
                    playing={isPlaying && !loadingTrack}
                    className="hidden h-4 md:flex"
                  />
                </div>
              </div>

              {/* Progress bar */}
              <div className="hidden w-full max-w-md items-center gap-2 md:flex">
                <span className="w-10 text-right text-[10px] tabular-nums text-muted-foreground">
                  {formatTime(progress)}
                </span>
                <div
                  className="h-1 flex-1 overflow-hidden rounded-full bg-secondary"
                  role="progressbar"
                  aria-valuenow={Math.floor(progress)}
                  aria-valuemax={totalDuration}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-200"
                    style={{
                      width: `${Math.min(100, (progress / totalDuration) * 100)}%`,
                      background: accent,
                    }}
                  />
                </div>
                <span className="w-10 text-[10px] tabular-nums text-muted-foreground">
                  {formatTime(totalDuration)}
                </span>
              </div>
            </div>

            {/* Volume (right) */}
            <div className="hidden shrink-0 items-center gap-2 md:flex">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
                className="h-9 w-9"
                aria-label={volume === 0 ? 'Activar sonido' : 'Silenciar'}
              >
                {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={[Math.round(volume * 100)]}
                max={100}
                step={1}
                onValueChange={(v) => setVolume(v[0] / 100)}
                className="w-24"
                aria-label="Volumen"
              />
            </div>
          </div>

          {/* Mobile progress bar */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="w-10 text-right text-[10px] tabular-nums text-muted-foreground">
              {formatTime(progress)}
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-[width] duration-200"
                style={{
                  width: `${Math.min(100, (progress / totalDuration) * 100)}%`,
                  background: accent,
                }}
              />
            </div>
            <span className="w-10 text-[10px] tabular-nums text-muted-foreground">
              {formatTime(totalDuration)}
            </span>
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {/* Expanded panel — upcoming songs */}
          {expanded && (
            <UpcomingPanel accent={accent} stationId={activeStation.id} />
          )}
        </div>
      </div>
    </>
  )
}

/**
 * UpcomingPanel
 * Shown when the player is expanded. Shows the current song + the next songs
 * in the queue. Reuses a fresh fetch of the station's songs (no live polling —
 * just the static playlist, ordered).
 */
function UpcomingPanel({ accent, stationId }: { accent: string; stationId: string }) {
  const { nowPlaying } = useRadioStore()
  const [songs, setSongs] = useState<{ id: string; title: string; artist: string; duration: number; order: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    // Defer the loading state to avoid a synchronous setState in the effect body
    Promise.resolve().then(() => {
      if (cancelled) return
      setLoading(true)
      fetch(`/api/stations/${stationId}/songs`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return
          setSongs(d?.songs ?? [])
        })
        .catch(() => {})
        .finally(() => !cancelled && setLoading(false))
    })
    return () => { cancelled = true }
  }, [stationId])

  const currentIndex = nowPlaying?.index ?? -1

  return (
    <div className="mt-2 max-h-[60vh] overflow-y-auto rounded-lg border border-border/60 bg-secondary/40 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Radio className="h-4 w-4" style={{ color: accent }} />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Cola de reproducción
        </h4>
      </div>
      {loading ? (
        <p className="py-4 text-center text-xs text-muted-foreground">Cargando…</p>
      ) : songs.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          No hay canciones en esta emisora
        </p>
      ) : (
        <ul className="space-y-1">
          {songs.map((s, i) => {
            const isCurrent = i === currentIndex
            return (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-md px-2 py-1.5"
                style={{
                  background: isCurrent
                    ? `color-mix(in oklch, ${accent} 14%, transparent)`
                    : 'transparent',
                }}
              >
                <span
                  className="w-5 text-center text-[10px] tabular-nums"
                  style={{ color: isCurrent ? accent : undefined }}
                >
                  {isCurrent ? (
                    <span style={{ color: accent }} className="mx-auto flex h-3 justify-center">
                      <EqualizerBars playing count={3} />
                    </span>
                  ) : (
                    i + 1
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-xs ${
                      isCurrent ? 'font-semibold' : 'text-foreground/80'
                    }`}
                  >
                    {s.title}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {s.artist}
                  </p>
                </div>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {formatTime(s.duration)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
