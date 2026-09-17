'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, Music2, Headphones, TrendingUp, Radio, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ListenerStats {
  totalActive: number
  totalUnique: number
  perStation: Array<{ stationId: string; stationName: string; count: number }>
  byCountry: Array<{ country: string | null; count: number }>
  timestamp: string
}

interface TopSong {
  id: string
  title: string
  artist: string
  playCount: number
  stationName: string
  duration: number
}

/**
 * AdminStats
 * Statistics view shown in the admin panel. Polls /api/stats/listeners every
 * 5 seconds for near-real-time listener count, and /api/stats/top-songs
 * every 30 seconds for the top-played songs list.
 */
export function AdminStats() {
  const [listenerStats, setListenerStats] = useState<ListenerStats | null>(null)
  const [topSongs, setTopSongs] = useState<TopSong[]>([])
  const [loadingListeners, setLoadingListeners] = useState(true)
  const [loadingSongs, setLoadingSongs] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchListenerStats = async () => {
    try {
      const res = await fetch('/api/stats/listeners', { cache: 'no-store' })
      if (!res.ok) {
        if (res.status === 401) {
          setError('Necesitas iniciar sesión para ver las estadísticas')
          return
        }
        throw new Error('Failed to fetch')
      }
      const data = await res.json()
      setListenerStats(data)
      setError(null)
    } catch {
      // ignore — keep last good data
    } finally {
      setLoadingListeners(false)
    }
  }

  const fetchTopSongs = async () => {
    try {
      const res = await fetch('/api/stats/top-songs?limit=20', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTopSongs(data?.songs ?? [])
    } catch {
      // ignore
    } finally {
      setLoadingSongs(false)
    }
  }

  useEffect(() => {
    fetchListenerStats()
    fetchTopSongs()

    // Poll listeners every 5 seconds
    const listenerInterval = setInterval(fetchListenerStats, 5000)
    // Poll top songs every 30 seconds
    const songsInterval = setInterval(fetchTopSongs, 30000)

    return () => {
      clearInterval(listenerInterval)
      clearInterval(songsInterval)
    }
  }, [])

  const maxPlayCount = topSongs.length > 0 ? topSongs[0].playCount : 1

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold">Estadísticas</h3>
        <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
          <span className="animate-live-pulse h-1.5 w-1.5 rounded-full bg-green-500" />
          En vivo
        </span>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Top stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Users className="h-4 w-4 text-primary" />
              Oyentes en vivo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">
                {loadingListeners ? '—' : listenerStats?.totalActive ?? 0}
              </span>
              <span className="text-xs text-muted-foreground">ahora</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Headphones className="h-4 w-4 text-primary" />
              Oyentes únicos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">
                {loadingListeners ? '—' : listenerStats?.totalUnique ?? 0}
              </span>
              <span className="text-xs text-muted-foreground">total</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-station listeners */}
      {listenerStats && listenerStats.perStation.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Radio className="h-4 w-4 text-primary" />
              Oyentes por emisora
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {listenerStats.perStation.map((s) => {
              const pct = listenerStats.totalActive > 0 ? (s.count / listenerStats.totalActive) * 100 : 0
              return (
                <div key={s.stationId} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground/80 truncate">{s.stationName}</span>
                    <span className="font-semibold tabular-nums text-foreground">{s.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* By country (only if there's data) */}
      {listenerStats && listenerStats.byCountry.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Oyentes por país
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            {listenerStats.byCountry.map((c, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-foreground/80">{c.country || 'Desconocido'}</span>
                <span className="font-semibold tabular-nums text-foreground">{c.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Top songs */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Music2 className="h-4 w-4 text-primary" />
            Canciones más reproducidas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingSongs ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Cargando…</p>
          ) : topSongs.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Aún no se han reproducido canciones
            </p>
          ) : (
            <ScrollArea className="max-h-72">
              <ol className="space-y-1">
                {topSongs.map((song, i) => {
                  const pct = (song.playCount / maxPlayCount) * 100
                  return (
                    <li key={song.id} className="relative overflow-hidden rounded-md px-2 py-1.5">
                      <div
                        className="absolute inset-y-0 left-0 bg-primary/10"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative flex items-center gap-3">
                        <span className="w-5 text-center text-[10px] tabular-nums text-muted-foreground">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-foreground">
                            {song.title}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {song.artist} · {song.stationName}
                          </p>
                        </div>
                        <span className="font-semibold tabular-nums text-xs text-primary">
                          {song.playCount} 🔁
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
