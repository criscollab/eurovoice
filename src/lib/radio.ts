import { Station, Song } from '@prisma/client'

/**
 * NowPlaying calculation result.
 * Represents what should be currently playing on a station at a given moment.
 */
export interface NowPlaying {
  song: Song
  index: number
  offset: number // seconds into the current song
  remaining: number // seconds remaining in the current song
  totalDuration: number // total playlist duration in seconds
  nextSong?: Song // the next song in the circular queue
  serverTime: number // server timestamp (ms) used for the calculation
}

/**
 * Calculates the currently playing song for a station based on a continuous timeline.
 *
 * The station's playlist is treated as a circular queue that started playing at station.createdAt
 * and loops forever. Every listener connecting at the same moment hears the same song at the
 * same offset, simulating a live 24/7 broadcast.
 *
 * Algorithm:
 *  1. Sort songs by their `order` field.
 *  2. Compute total playlist duration = sum(song.duration).
 *  3. Elapsed seconds since station.createdAt = (now - createdAt) / 1000.
 *  4. Position in the circular playlist = elapsed % totalDuration.
 *  5. Walk the sorted list to find which song contains that position.
 *  6. Return the song, its offset, and remaining time.
 */
export function computeNowPlaying(
  station: Pick<Station, 'createdAt'>,
  songs: Song[],
  now: number = Date.now()
): NowPlaying | null {
  if (!songs || songs.length === 0) return null

  const sorted = [...songs].sort((a, b) => a.order - b.order)
  const totalDuration = sorted.reduce((sum, s) => sum + Math.max(1, s.duration), 0)
  if (totalDuration <= 0) return null

  const startTime = new Date(station.createdAt).getTime()
  // If the station was created in the future (clock skew), treat as 0
  const elapsed = Math.max(0, (now - startTime) / 1000)
  const positionInPlaylist = elapsed % totalDuration

  let cumulative = 0
  for (let i = 0; i < sorted.length; i++) {
    const song = sorted[i]
    const dur = Math.max(1, song.duration)
    if (positionInPlaylist < cumulative + dur) {
      const offset = positionInPlaylist - cumulative
      const nextIndex = (i + 1) % sorted.length
      return {
        song,
        index: i,
        offset: Math.max(0, offset),
        remaining: Math.max(0, dur - offset),
        totalDuration,
        nextSong: sorted[nextIndex],
        serverTime: now,
      }
    }
    cumulative += dur
  }

  // Fallback (shouldn't happen, but for safety)
  const last = sorted[sorted.length - 1]
  return {
    song: last,
    index: sorted.length - 1,
    offset: 0,
    remaining: Math.max(1, last.duration),
    totalDuration,
    nextSong: sorted[0],
    serverTime: now,
  }
}

/**
 * Formats seconds as mm:ss (or h:mm:ss if longer than an hour).
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}
