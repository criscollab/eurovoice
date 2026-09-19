'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, Music2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useRadioStore } from '@/lib/radio-store'
import { cn } from '@/lib/utils'

interface SearchMatch {
  songId: string
  songTitle: string
  songArtist: string
  coverUrl: string | null
  stationId: string
  stationName: string
  stationColor: string
}

/**
 * SearchBar
 *
 * Debounced search input with a dropdown of matching songs. When the user
 * clicks a result, the player loads the song in its station.
 *
 * The `onResultsChange` callback is invoked every time the list of matching
 * stations changes — this lets the parent filter the stations grid to only
 * show stations that contain a matching song.
 */
export function SearchBar({
  onResultsChange,
  accent = '#3b82f6',
}: {
  onResultsChange?: (stationIds: string[] | null, query: string) => void
  accent?: string
}) {
  const { stations, setActiveStation, setStations, setQueue, setCurrentIndex, setIsPlaying } =
    useRadioStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // === Debounced search (300ms) ===
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setResults([])
      setLoading(false)
      setOpen(false)
      onResultsChange?.(null, '')
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          { cache: 'no-store' }
        )
        if (!res.ok) throw new Error('search failed')
        const data = await res.json()
        const matches: SearchMatch[] = data?.matches ?? []
        setResults(matches)
        setOpen(true)
        // Collect unique station ids — parent filters the grid by this list
        const stationIds = Array.from(new Set(matches.map((m) => m.stationId)))
        onResultsChange?.(stationIds, query.trim())
      } catch (err) {
        console.error('Search failed:', err)
        setResults([])
        onResultsChange?.([], query.trim())
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, onResultsChange])

  // === Close dropdown on outside click ===
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // === Load station songs and play a specific song ===
  const playSongFromSearch = useCallback(
    async (stationId: string, songId: string) => {
      // Find the station in the store, or refetch all stations if needed
      let station = stations.find((s) => s.id === stationId) || null
      if (!station) {
        try {
          const r = await fetch('/api/stations', { cache: 'no-store' })
          if (r.ok) {
            const data = await r.json()
            const list = data.stations ?? []
            if (Array.isArray(list) && list.length > 0) {
              setStations(list)
              station = list.find((s: { id: string }) => s.id === stationId) || null
            }
          }
        } catch {
          // ignore
        }
      }
      if (!station) return

      try {
        const r = await fetch(`/api/stations/${stationId}/songs`, { cache: 'no-store' })
        if (!r.ok) return
        const data = await r.json()
        const songs: any[] = data?.songs ?? []
        setQueue(songs)
        setActiveStation(station)
        const idx = songs.findIndex((s) => s.id === songId)
        setCurrentIndex(idx >= 0 ? idx : 0)
        setIsPlaying(true)
      } catch (err) {
        console.error('Failed to play song from search:', err)
      }
    },
    [stations, setStations, setQueue, setActiveStation, setCurrentIndex, setIsPlaying]
  )

  // === Handle click on a search result ===
  const handleSongClick = useCallback(
    (match: SearchMatch) => {
      setQuery('')
      onResultsChange?.([], '')
      playSongFromSearch(match.stationId, match.songId)
    },
    [onResultsChange, playSongFromSearch]
  )

  const handleClear = useCallback(() => {
    setQuery('')
    setResults([])
    setOpen(false)
    onResultsChange?.(null, '')
  }, [onResultsChange])

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Buscar canciones o artistas…"
          aria-label="Buscar canciones o artistas"
          className="h-11 rounded-full border-border/60 bg-card pl-10 pr-10 text-sm shadow-sm"
          style={{ caretColor: accent }}
        />
        {loading && (
          <span
            className="absolute right-10 top-1/2 -translate-y-1/2"
            aria-label="Buscando"
          >
            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          </span>
        )}
        {!loading && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && (
        <div className="absolute z-30 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-border/60 bg-popover shadow-lg">
          {results.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-6 text-sm text-muted-foreground">
              <Music2 className="h-4 w-4 shrink-0" />
              <span>
                No se encontraron canciones para &ldquo;{query}&rdquo;
              </span>
            </div>
          ) : (
            <ul className="py-1">
              {results.map((match) => (
                <li key={`${match.stationId}-${match.songId}`}>
                  <button
                    type="button"
                    onClick={() => handleSongClick(match)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-secondary"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary"
                      style={{ boxShadow: `inset 0 0 0 1px ${match.stationColor}33` }}
                    >
                      {match.coverUrl ? (
                        <img
                          src={match.coverUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Music2
                          className="h-4 w-4"
                          style={{ color: match.stationColor }}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {match.songTitle}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {match.songArtist}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        color: match.stationColor,
                        background: `color-mix(in oklch, ${match.stationColor} 12%, transparent)`,
                      }}
                    >
                      {match.stationName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
