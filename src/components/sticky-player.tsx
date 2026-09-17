'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRadioStore } from '@/lib/radio-store'
import { formatTime, getNextSongIndex, getPreviousSongIndex } from '@/lib/radio'
import { VinylDisc } from '@/components/vinyl-disc'
import { EqualizerBars } from '@/components/equalizer-bars'
import { LyricsPanel } from '@/components/lyrics-panel'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  ChevronUp,
  ListMusic,
  Radio,
  Mic2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RepeatMode } from '@/lib/radio'

/**
 * StickyPlayer
 * Personal-mode player with:
 *   - Play/pause
 *   - Previous / Next track
 *   - Repeat mode (off / all / one)
 *   - Volume control
 *   - Expandable playlist with clickable songs
 *
 * No server-side 24/7 sync — each listener has their own queue.
 */
export function StickyPlayer() {
  const {
    activeStation,
    queue,
    setQueue,
    currentIndex,
    setCurrentIndex,
    isPlaying,
    setIsPlaying,
    togglePlay,
    volume,
    setVolume,
    repeatMode,
    cycleRepeatMode,
    playlistOpen,
    setPlaylistOpen,
    togglePlaylist,
  } = useRadioStore()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [progress, setProgress] = useState(0)
  const [loadingTrack, setLoadingTrack] = useState(false)
  const [lyricsOpen, setLyricsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentSong = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null

  // === Load queue when station changes ===
  useEffect(() => {
    if (!activeStation) {
      setQueue([])
      setCurrentIndex(-1)
      setIsPlaying(false)
      return
    }
    let cancelled = false
    Promise.resolve().then(() => setLoadingTrack(true))
    fetch(`/api/stations/${activeStation.id}/songs`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const songs: any[] = data?.songs ?? []
        setQueue(songs)
        if (songs.length > 0) {
          setCurrentIndex(0)
        } else {
          setCurrentIndex(-1)
          setIsPlaying(false)
        }
      })
      .catch((err) => {
        console.error('Failed to load station songs:', err)
      })
      .finally(() => {
        if (!cancelled) setLoadingTrack(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeStation, setQueue, setCurrentIndex, setIsPlaying])

  // === When currentIndex changes, load the new song ===
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentSong) return

    Promise.resolve().then(() => {
      setLoadingTrack(true)
      setError(null)
    })
    audio.src = currentSong.audioUrl
    audio.load()

    const handleLoadedMetadata = () => {
      setLoadingTrack(false)
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
     
  }, [currentSong?.id])

  // === Volume control ===
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // === Play/pause control ===
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentSong) return
    if (isPlaying) {
      audio.play().catch((e) => {
        console.warn('Play failed:', e)
        setIsPlaying(false)
      })
    } else {
      audio.pause()
    }
     
  }, [isPlaying])

  // === Track time updates ===
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => setProgress(audio.currentTime)
    audio.addEventListener('timeupdate', onTimeUpdate)
    return () => audio.removeEventListener('timeupdate', onTimeUpdate)
  }, [])

  // === When song ends, advance based on repeat mode ===
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentSong) return

    const onEnded = () => {
      const nextIndex = getNextSongIndex(currentIndex, queue.length, repeatMode)
      if (nextIndex === -1) {
        // End of queue, repeat off → stop
        setIsPlaying(false)
        setProgress(0)
      } else if (nextIndex === currentIndex) {
        // Repeat one → replay the same song
        audio.currentTime = 0
        audio.play().catch(() => {})
      } else {
        // Advance to next song
        setCurrentIndex(nextIndex)
        setIsPlaying(true)
      }
    }

    audio.addEventListener('ended', onEnded)
    return () => audio.removeEventListener('ended', onEnded)
  }, [currentIndex, queue.length, repeatMode, currentSong, setCurrentIndex, setIsPlaying])

  // === Track play count: when a song starts playing, increment its count ===
  useEffect(() => {
    if (!currentSong || !isPlaying) return
    // Fire and forget — we don't want to block playback if this fails
    fetch(`/api/songs/${currentSong.id}/play`, { method: 'POST' }).catch(() => {})
     
  }, [currentSong?.id])

  // === Track listener: register this browser as an active listener ===
  useEffect(() => {
    if (!activeStation || !isPlaying) return
    // Get or create a sessionId in localStorage
    let sessionId = ''
    if (typeof window !== 'undefined') {
      sessionId = localStorage.getItem('eurovoice_session_id') || ''
      if (!sessionId) {
        sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2)}`
        localStorage.setItem('eurovoice_session_id', sessionId)
      }
    }
    // Send heartbeat every 30 seconds while playing
    const sendHeartbeat = () => {
      fetch('/api/listeners/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, stationId: activeStation.id }),
      }).catch(() => {})
    }
    sendHeartbeat()
    const interval = setInterval(sendHeartbeat, 30000)
    return () => clearInterval(interval)
  }, [activeStation, isPlaying])

  // === Skip to next song ===
  const handleNext = useCallback(() => {
    const next = getNextSongIndex(currentIndex, queue.length, 'all') // always advance when manually skipping
    if (next !== -1) {
      setCurrentIndex(next)
      setIsPlaying(true)
    }
  }, [currentIndex, queue.length, setCurrentIndex, setIsPlaying])

  // === Skip to previous song ===
  const handlePrevious = useCallback(() => {
    const prev = getPreviousSongIndex(currentIndex, queue.length)
    if (prev !== -1) {
      setCurrentIndex(prev)
      setIsPlaying(true)
    }
  }, [currentIndex, queue.length, setCurrentIndex, setIsPlaying])

  // === Click on a song in the playlist ===
  const handleSongClick = useCallback(
    (index: number) => {
      setCurrentIndex(index)
      setIsPlaying(true)
    },
    [setCurrentIndex, setIsPlaying]
  )

  if (!activeStation) return null

  const accent = activeStation.color
  const totalDuration = currentSong?.duration ?? 1

  const repeatIcon = repeatMode === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />
  const repeatActive = repeatMode !== 'off'

  return (
    <>
      <audio ref={audioRef} preload="auto" />
      {/* Player container */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur-xl transition-all',
          playlistOpen ? 'h-[88vh] rounded-t-2xl' : 'h-auto'
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
                      background: `color-mix(in oklch, ${accent} 15%, transparent)`,
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
                {currentSong ? (
                  <>
                    <p className="mt-1 truncate text-sm font-semibold text-foreground">
                      {currentSong.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {currentSong.artist}
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
              <div className="flex items-center gap-1 md:gap-2">
                {/* Previous */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  disabled={!currentSong || queue.length === 0}
                  className="h-9 w-9 md:h-10 md:w-10"
                  aria-label="Canción anterior"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                {/* Play/Pause */}
                <Button
                  onClick={togglePlay}
                  disabled={!currentSong || loadingTrack}
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

                {/* Next */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  disabled={!currentSong || queue.length === 0}
                  className="h-9 w-9 md:h-10 md:w-10"
                  aria-label="Siguiente canción"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                {/* Repeat */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={cycleRepeatMode}
                  className="h-9 w-9 md:h-10 md:w-10"
                  style={{ color: repeatActive ? accent : undefined }}
                  aria-label={`Repetir: ${repeatMode}`}
                  title={`Repetir: ${repeatMode}`}
                >
                  {repeatIcon}
                  {repeatMode === 'off' && <span className="sr-only">Repetir apagado</span>}
                </Button>

                {/* Equalizer (visual feedback) */}
                <div style={{ color: accent }} className="hidden md:flex">
                  <EqualizerBars playing={isPlaying && !loadingTrack} />
                </div>

                {/* Playlist toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlaylist}
                  className="hidden md:inline-flex h-9 w-9 md:h-10 md:w-10"
                  style={{ color: playlistOpen ? accent : undefined }}
                  aria-label="Ver cola de reproducción"
                  title="Ver cola de reproducción"
                >
                  <ListMusic className="h-4 w-4" />
                </Button>

                {/* Lyrics toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setLyricsOpen((v) => !v)
                    // If opening lyrics, close playlist to avoid both being open
                    if (!lyricsOpen) setPlaylistOpen(false)
                  }}
                  className="hidden md:inline-flex h-9 w-9 md:h-10 md:w-10"
                  style={{ color: lyricsOpen ? accent : undefined }}
                  aria-label={lyricsOpen ? 'Cerrar letras' : 'Ver letra'}
                  title={lyricsOpen ? 'Cerrar letras' : 'Ver letra de la canción'}
                >
                  <Mic2 className="h-4 w-4" />
                </Button>
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

            {/* Expand button (mobile) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlaylist}
              className="md:hidden h-9 w-9"
              aria-label={playlistOpen ? 'Contrair' : 'Expandir'}
            >
              <ChevronUp
                className={cn('h-4 w-4 transition-transform', playlistOpen && 'rotate-180')}
              />
            </Button>
          </div>

          {/* Mobile progress bar */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="w-10 text-right text-[10px] tabular-nums text-muted-foreground">
              {formatTime(progress)}
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
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

          {/* Expanded playlist panel */}
          {playlistOpen && (
            <PlaylistPanel accent={accent} onSongClick={handleSongClick} />
          )}

          {/* Lyrics panel (optional, requires current song) */}
          {lyricsOpen && currentSong && (
            <LyricsPanel
              songId={currentSong.id}
              title={currentSong.title}
              artist={currentSong.artist}
              accent={accent}
              currentTime={progress}
              isPlaying={isPlaying}
              onClose={() => setLyricsOpen(false)}
            />
          )}
        </div>
      </div>
    </>
  )
}

/**
 * PlaylistPanel
 * Visible playlist with all songs of the active station. Each song is clickable.
 * The currently playing song is highlighted.
 */
function PlaylistPanel({
  accent,
  onSongClick,
}: {
  accent: string
  onSongClick: (index: number) => void
}) {
  const { queue, currentIndex, isPlaying } = useRadioStore()

  return (
    <div className="mt-2 max-h-[60vh] overflow-y-auto rounded-lg border border-border/60 bg-secondary/40 p-3">
      <div className="mb-2 flex items-center gap-2">
        <ListMusic className="h-4 w-4" style={{ color: accent }} />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Cola de reproducción ({queue.length})
        </h4>
      </div>
      {queue.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          No hay canciones en esta emisora
        </p>
      ) : (
        <ul className="space-y-1">
          {queue.map((song, i) => {
            const isCurrent = i === currentIndex
            return (
              <li
                key={song.id}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-secondary cursor-pointer"
                onClick={() => onSongClick(i)}
                style={{
                  background: isCurrent
                    ? `color-mix(in oklch, ${accent} 14%, transparent)`
                    : undefined,
                }}
              >
                <span
                  className="w-5 text-center text-[10px] tabular-nums"
                  style={{ color: isCurrent ? accent : undefined }}
                >
                  {isCurrent ? (
                    <span style={{ color: accent }} className="mx-auto flex h-3 justify-center">
                      <EqualizerBars playing={isPlaying} count={3} />
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
                    {song.title}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {song.artist}
                  </p>
                </div>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {formatTime(song.duration)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
