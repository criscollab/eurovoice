'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRadioStore } from '@/lib/radio-store'
import { formatTime, getNextSongIndex, getPreviousSongIndex } from '@/lib/radio'
import { parseYouTubeUrl, normalizeYouTubeUrl } from '@/lib/youtube'
import { useYouTubePlayer } from '@/lib/use-youtube-player'
import { AlbumArt } from '@/components/album-art'
import { ReactionButtons } from '@/components/reaction-buttons'
import { EqualizerBars } from '@/components/equalizer-bars'
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
  Youtube,
  Expand,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RepeatMode } from '@/lib/radio'

/**
 * StickyPlayer (YouTube Embed Edition)
 *
 * Personal-mode player using YouTube IFrame API:
 *   - Plays videos directly from YouTube (100% legal, no copyright issues)
 *   - Auto-advances when a video ends (radio feel)
 *   - Sticky video visible at bottom of screen
 *   - Click to expand to fullscreen
 *   - Volume control, repeat mode, playlist panel
 *
 * Each listener has their own queue — no server-side sync.
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
    togglePlaylist,
  } = useRadioStore()

  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loadingTrack, setLoadingTrack] = useState(false)

  const currentSong =
    currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null

  // Extract YouTube video ID from current song
  const videoId = currentSong?.youtubeUrl
    ? parseYouTubeUrl(currentSong.youtubeUrl)?.videoId ?? null
    : null

  // === Handle video end → auto-advance ===
  const handleVideoEnd = useCallback(() => {
    const nextIndex = getNextSongIndex(currentIndex, queue.length, repeatMode)
    if (nextIndex === -1) {
      setIsPlaying(false)
      setProgress(0)
    } else if (nextIndex === currentIndex) {
      // Repeat one — replay same song
      // The hook handles this internally by seeking to 0
    } else {
      setCurrentIndex(nextIndex)
      setIsPlaying(true)
    }
  }, [currentIndex, queue.length, repeatMode, setCurrentIndex, setIsPlaying])

  // === Handle time updates ===
  const handleTimeUpdate = useCallback((current: number, dur: number) => {
    setProgress(current)
    if (dur > 0) setDuration(dur)
  }, [])

  const { containerRef, isReady, play, pause, setVolume: setPlayerVolume } = useYouTubePlayer({
    videoId,
    autoplay: false,
    volume,
    onEnded: handleVideoEnd,
    onTimeUpdate: handleTimeUpdate,
  })

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

  // === Loading indicator when switching songs ===
  useEffect(() => {
    if (!currentSong) return
    setLoadingTrack(true)
    const t = setTimeout(() => setLoadingTrack(false), 2000)
    return () => clearTimeout(t)
  }, [currentSong?.id])

  // === Volume control ===
  useEffect(() => {
    setPlayerVolume(volume)
  }, [volume, setPlayerVolume])

  // === Play/pause control ===
  useEffect(() => {
    if (!isReady || !currentSong) return
    if (isPlaying) {
      play()
    } else {
      pause()
    }
  }, [isPlaying, isReady, currentSong, play, pause])

  // === Track play count ===
  useEffect(() => {
    if (!currentSong || !isPlaying) return
    fetch(`/api/songs/${currentSong.id}/play`, { method: 'POST' }).catch(() => {})
  }, [currentSong?.id])

  // === Track listener heartbeat ===
  useEffect(() => {
    if (!activeStation || !isPlaying) return
    let sessionId = ''
    if (typeof window !== 'undefined') {
      sessionId = localStorage.getItem('eurovoice_session_id') || ''
      if (!sessionId) {
        sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2)}`
        localStorage.setItem('eurovoice_session_id', sessionId)
      }
    }
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
    const next = getNextSongIndex(currentIndex, queue.length, 'all')
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

  // === Expand video to fullscreen ===
  const handleExpand = useCallback(() => {
    const iframe = containerRef.current?.querySelector('iframe')
    if (iframe) {
      try {
        if (iframe.requestFullscreen) iframe.requestFullscreen()
      } catch {}
    }
  }, [containerRef])

  if (!activeStation) {
    // Even when no station is active, we still need to render the YouTube
    // container so the hook can initialize the player. Otherwise, the
    // containerRef will be null when the hook's useEffect runs, and the
    // YouTube player will never be created.
    return (
      <div className="sr-only" aria-hidden="true">
        <div ref={containerRef} />
      </div>
    )
  }

  const accent = activeStation.color
  const totalDuration = duration || currentSong?.duration || 1

  const repeatIcon = repeatMode === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />
  const repeatActive = repeatMode !== 'off'

  return (
    <>
      {/* YouTube player container — hidden, only used as API host */}
      <div className="sr-only" aria-hidden="true">
        <div ref={containerRef} />
      </div>

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
            {/* YouTube video thumbnail (clickable to expand) */}
            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={handleExpand}
                className="relative h-14 w-20 overflow-hidden rounded-lg bg-black md:h-16 md:w-24"
                aria-label="Expandir video a pantalla completa"
                title="Expandir video"
              >
                {videoId ? (
                  <img
                    src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                    alt={currentSong?.title || 'YouTube video'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Radio className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                {/* Play indicator overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                  <Expand className="h-5 w-5 text-white" />
                </div>
                {/* Live indicator */}
                {isPlaying && (
                  <div className="absolute left-1 top-1 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5">
                    <span
                      className="animate-live-pulse h-1 w-1 rounded-full"
                      style={{ background: accent }}
                    />
                    <span className="text-[8px] font-bold uppercase text-white">LIVE</span>
                  </div>
                )}
              </button>

              <div className="min-w-0 max-w-[180px] md:max-w-[280px]">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color: accent,
                      background: `color-mix(in oklch, ${accent} 15%, transparent)`,
                    }}
                  >
                    <Youtube className="h-3 w-3" />
                    YouTube
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
                    {/* Reaction buttons (desktop only) */}
                    <div className="mt-1 hidden md:block">
                      <ReactionButtons songId={currentSong.id} accent={accent} />
                    </div>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Sin programación</p>
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
                  disabled={!currentSong || loadingTrack || !isReady}
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

                {/* Open in YouTube (new tab) */}
                {currentSong?.youtubeUrl && (() => {
                  const normalized = normalizeYouTubeUrl(currentSong.youtubeUrl)
                  if (!normalized) return null
                  return (
                    <a
                      href={normalized}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      aria-label="Abrir en YouTube (nueva pestaña)"
                      title="Abrir en YouTube"
                    >
                      <Youtube className="h-4 w-4" />
                    </a>
                  )
                })()}
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

          {/* Reaction buttons (mobile only) */}
          {currentSong && (
            <div className="md:hidden">
              <ReactionButtons songId={currentSong.id} accent={accent} />
            </div>
          )}

          {/* Expanded playlist panel */}
          {playlistOpen && (
            <PlaylistPanel accent={accent} onSongClick={handleSongClick} />
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
