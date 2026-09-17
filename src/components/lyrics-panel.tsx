'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Music2, Loader2, AlertCircle, X, Mic2, RefreshCw } from 'lucide-react'
import { parseLrc, getActiveLineIndex, splitPlainLyrics, formatLrcTime, type ParsedLyrics } from '@/lib/lrc'
import { cn } from '@/lib/utils'

interface LyricsPanelProps {
  /** ID of the currently playing song */
  songId: string
  /** Title of the song (for display) */
  title: string
  /** Artist of the song (for display) */
  artist: string
  /** Accent color for highlights */
  accent: string
  /** Current playback time in seconds (used to highlight the active line) */
  currentTime: number
  /** Whether the audio is currently playing (used for visual feedback) */
  isPlaying: boolean
  /** Callback to close the panel */
  onClose: () => void
}

type LoadStatus = 'idle' | 'loading' | 'success' | 'error' | 'not_found'

/**
 * LyricsPanel
 *
 * Fetches lyrics for the current song (via /api/songs/[id]/lyrics) and
 * displays them. If LRC (synced lyrics) is available, the active line is
 * highlighted and auto-scrolled as the song progresses. If only plain lyrics
 * are available, they are displayed as static text.
 *
 * The panel is optional — the listener can open/close it via a button in
 * the player. The preference persists in localStorage.
 */
export function LyricsPanel({
  songId,
  title,
  artist,
  accent,
  currentTime,
  isPlaying,
  onClose,
}: LyricsPanelProps) {
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [lyricsLrc, setLyricsLrc] = useState<string | null>(null)
  const [lyricsPlain, setLyricsPlain] = useState<string | null>(null)
  const [source, setSource] = useState<'database' | 'lrclib' | 'none'>('none')
  const [message, setMessage] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedLyrics>({ metadata: {}, lines: [] })
  const [isPlainMode, setIsPlainMode] = useState(false)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const activeLineRef = useRef<HTMLDivElement | null>(null)
  const userScrolledRef = useRef(false)
  const userScrolledTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // === Fetch lyrics when songId changes ===
  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (cancelled) return
      setStatus('loading')
      setMessage(null)
    })

    fetch(`/api/songs/${songId}/lyrics`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.error) {
          setStatus('error')
          setMessage(data.error)
          return
        }
        setLyricsLrc(data.lyricsLrc || null)
        setLyricsPlain(data.lyricsPlain || null)
        setSource(data.source || 'none')
        if (data.message) setMessage(data.message)

        // Prefer LRC if available, otherwise plain mode
        if (data.lyricsLrc) {
          const p = parseLrc(data.lyricsLrc)
          setParsed(p)
          setIsPlainMode(false)
          setStatus('success')
        } else if (data.lyricsPlain) {
          setParsed({ metadata: {}, lines: [] })
          setIsPlainMode(true)
          setStatus('success')
        } else {
          setStatus('not_found')
        }
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load lyrics:', err)
        setStatus('error')
        setMessage('No se pudieron cargar las letras')
      })

    return () => {
      cancelled = true
    }
  }, [songId])

  // === Compute the active line index based on currentTime ===
  const activeLineIndex = !isPlainMode && parsed.lines.length > 0
    ? getActiveLineIndex(parsed, currentTime)
    : -1

  // === Auto-scroll to the active line ===
  useEffect(() => {
    if (isPlainMode || status !== 'success' || activeLineIndex < 0) return
    // Don't auto-scroll if the user has scrolled manually in the last 5 seconds
    if (userScrolledRef.current) return

    const el = activeLineRef.current
    if (el && scrollRef.current) {
      const container = scrollRef.current
      // Scroll the active line into view, centered in the panel
      const containerHeight = container.clientHeight
      const elementTop = el.offsetTop
      const elementHeight = el.clientHeight
      const targetScroll = elementTop - (containerHeight / 2) + (elementHeight / 2)
      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth',
      })
    }
  }, [activeLineIndex, isPlainMode, status])

  // === Detect when user scrolls manually (to pause auto-scroll briefly) ===
  const handleScroll = useCallback(() => {
    userScrolledRef.current = true
    if (userScrolledTimerRef.current) {
      clearTimeout(userScrolledTimerRef.current)
    }
    // Resume auto-scroll after 5 seconds of no user scrolling
    userScrolledTimerRef.current = setTimeout(() => {
      userScrolledRef.current = false
    }, 5000)
  }, [])

  // === Retry loading ===
  const handleRetry = useCallback(() => {
    // Force a reload by triggering the effect
    setStatus('loading')
    fetch(`/api/songs/${songId}/lyrics?_=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        setLyricsLrc(data.lyricsLrc || null)
        setLyricsPlain(data.lyricsPlain || null)
        setSource(data.source || 'none')
        if (data.lyricsLrc) {
          const p = parseLrc(data.lyricsLrc)
          setParsed(p)
          setIsPlainMode(false)
          setStatus('success')
        } else if (data.lyricsPlain) {
          setIsPlainMode(true)
          setStatus('success')
        } else {
          setStatus('not_found')
        }
      })
      .catch(() => setStatus('error'))
  }, [songId])

  // === Render ===
  return (
    <div className="mt-2 max-h-[60vh] overflow-hidden rounded-lg border border-border/60 bg-secondary/40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-secondary/60 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Mic2 className="h-4 w-4 shrink-0" style={{ color: accent }} />
          <div className="min-w-0">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isPlainMode ? 'Letra' : 'Letra sincronizada'}
            </h4>
            <p className="text-[10px] text-muted-foreground truncate">
              {title} · {artist}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {source === 'lrclib' && (
            <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
              LRCLIB
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
            aria-label="Cerrar letras"
            title="Cerrar panel de letras"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3"
        style={{ maxHeight: '50vh' }}
      >
        {/* Loading state */}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Buscando letras…</p>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              {message || 'No se pudieron cargar las letras.'}
            </p>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw className="h-3 w-3" />
              Reintentar
            </Button>
          </div>
        )}

        {/* Not found state */}
        {status === 'not_found' && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Music2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              {message || 'No se encontraron letras para esta canción.'}
            </p>
            <p className="text-[10px] text-muted-foreground/70 text-center max-w-xs">
              Puedes añadirlas manualmente desde el panel de administración.
            </p>
          </div>
        )}

        {/* Success: synced LRC lyrics */}
        {status === 'success' && !isPlainMode && parsed.lines.length > 0 && (
          <div className="space-y-1">
            {parsed.lines.map((line, i) => {
              const isActive = i === activeLineIndex
              const isPast = i < activeLineIndex
              return (
                <div
                  key={i}
                  ref={isActive ? activeLineRef : null}
                  className={cn(
                    'transition-all duration-300 px-2 py-1 rounded-md',
                    isActive && 'font-semibold scale-[1.02]',
                    !isActive && 'text-muted-foreground/70',
                    isPast && 'opacity-50'
                  )}
                  style={
                    isActive
                      ? {
                          color: accent,
                          background: `color-mix(in oklch, ${accent} 12%, transparent)`,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-[9px] tabular-nums shrink-0 opacity-50"
                      aria-hidden={!isActive}
                    >
                      {formatLrcTime(line.time)}
                    </span>
                    <span className={cn('text-sm', line.text === '' && 'h-4')}>
                      {line.text || '♪'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Success: plain lyrics (no sync) */}
        {status === 'success' && isPlainMode && lyricsPlain && (
          <div className="space-y-2">
            {splitPlainLyrics(lyricsPlain).map((line, i) => (
              <p
                key={i}
                className={cn(
                  'text-sm leading-relaxed px-2 py-0.5',
                  line === '' ? 'h-4' : 'text-foreground/80'
                )}
              >
                {line || '♪'}
              </p>
            ))}
            <p className="text-[10px] text-muted-foreground/70 italic pt-2">
              ♪ Letra sin sincronizar — se muestra como texto plano.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {status === 'success' && (
        <div className="border-t border-border/60 bg-secondary/60 px-3 py-1.5 shrink-0">
          <p className="text-[9px] text-muted-foreground/70 text-center">
            {isPlaying ? '♪ Sincronizando con la música…' : 'Pausado'}
          </p>
        </div>
      )}
    </div>
  )
}
