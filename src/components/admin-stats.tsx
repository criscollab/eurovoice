'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, Music2, Headphones, TrendingUp, Radio, RefreshCw, ThumbsUp, Heart, ThumbsDown } from 'lucide-react'
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

interface ReactionSong {
  id: string
  title: string
  artist: string
  coverUrl: string | null
  count: number
  stationName: string
  stationColor: string
}

interface ReactionStats {
  topLiked: ReactionSong[]
  topHearted: ReactionSong[]
  topDisliked: ReactionSong[]
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
  const [reactionStats, setReactionStats] = useState<ReactionStats | null>(null)
  const [loadingListeners, setLoadingListeners] = useState(true)
  const [loadingSongs, setLoadingSongs] = useState(true)
  const [loadingReactions, setLoadingReactions] = useState(true)
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

  const fetchReactionStats = async () => {
    try {
      const res = await fetch('/api/stats/reactions?limit=10', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setReactionStats(data)
    } catch {
      // ignore
    } finally {
      setLoadingReactions(false)
    }
  }

  useEffect(() => {
    fetchListenerStats()
    fetchTopSongs()
    fetchReactionStats()

    // Poll listeners every 5 seconds
    const listenerInterval = setInterval(fetchListenerStats, 5000)
    // Poll top songs every 30 seconds
    const songsInterval = setInterval(fetchTopSongs, 30000)
    // Poll reactions every 60 seconds (less frequent — they change slower)
    const reactionsInterval = setInterval(fetchReactionStats, 60000)

    return () => {
      clearInterval(listenerInterval)
      clearInterval(songsInterval)
      clearInterval(reactionsInterval)
    }
  }, [])

  const maxPlayCount = topSongs.length > 0 ? topSongs[0].playCount : 1

  // Compute totals for reactions
  const totalLikes =
    reactionStats?.topLiked.reduce((sum, s) => sum + s.count, 0) ?? 0
  const totalHearts =
    reactionStats?.topHearted.reduce((sum, s) => sum + s.count, 0) ?? 0
  const totalDislikes =
    reactionStats?.topDisliked.reduce((sum, s) => sum + s.count, 0) ?? 0

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

      {/* === Reactions section === */}
      {/* Totals cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-border/60">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              <ThumbsUp className="h-3 w-3 text-blue-500" />
              Likes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-2xl font-bold text-foreground">
              {loadingReactions ? '—' : totalLikes}
            </span>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              <Heart className="h-3 w-3 text-pink-500 fill-pink-500" />
              Corazones
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-2xl font-bold text-foreground">
              {loadingReactions ? '—' : totalHearts}
            </span>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              <ThumbsDown className="h-3 w-3 text-red-500" />
              No me gusta
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-2xl font-bold text-foreground">
              {loadingReactions ? '—' : totalDislikes}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Top liked songs */}
      <ReactionList
        title="Canciones más gustadas"
        icon={<ThumbsUp className="h-4 w-4 text-blue-500" />}
        songs={reactionStats?.topLiked ?? []}
        loading={loadingReactions}
        accentColor="text-blue-500"
        emptyMessage="Aún no hay canciones con likes"
      />

      {/* Top hearted songs */}
      <ReactionList
        title="Canciones más amadas"
        icon={<Heart className="h-4 w-4 text-pink-500 fill-pink-500" />}
        songs={reactionStats?.topHearted ?? []}
        loading={loadingReactions}
        accentColor="text-pink-500"
        emptyMessage="Aún no hay canciones con corazones"
      />

      {/* Top disliked songs */}
      <ReactionList
        title="Canciones menos gustadas"
        icon={<ThumbsDown className="h-4 w-4 text-red-500" />}
        songs={reactionStats?.topDisliked ?? []}
        loading={loadingReactions}
        accentColor="text-red-500"
        emptyMessage="Aún no hay canciones con 'no me gusta'"
      />
    </div>
  )
}

/**
 * ReactionList
 * Reusable component for displaying a list of songs by reaction type.
 */
function ReactionList({
  title,
  icon,
  songs,
  loading,
  accentColor,
  emptyMessage,
}: {
  title: string
  icon: React.ReactNode
  songs: ReactionSong[]
  loading: boolean
  accentColor: string
  emptyMessage: string
}) {
  const maxCount = songs.length > 0 ? songs[0].count : 1

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <p className="py-4 text-center text-xs text-muted-foreground">Cargando…</p>
        ) : songs.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <ScrollArea className="max-h-60">
            <ol className="space-y-1">
              {songs.map((song, i) => {
                const pct = (song.count / maxCount) * 100
                return (
                  <li key={song.id} className="relative overflow-hidden rounded-md px-2 py-1.5">
                    <div
                      className="absolute inset-y-0 left-0 bg-current opacity-10"
                      style={{ width: `${pct}%`, color: song.stationColor }}
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
                      <span className={cn('font-semibold tabular-nums text-xs', accentColor)}>
                        {song.count}
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
  )
}
