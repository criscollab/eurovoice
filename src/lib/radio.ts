import { Station, Song } from '@prisma/client'

/**
 * Euro Voice — Personal mode radio logic.
 *
 * Each listener has their own queue. When they connect to a station, they
 * start at the first song. They can:
 *   - Play/pause
 *   - Skip to next/previous song
 *   - Click on any song in the playlist to jump to it
 *   - Toggle repeat mode: off | all | one
 *
 * When a song ends naturally, the player advances to the next song (or
 * repeats the current one if repeatMode === 'one'). If repeatMode === 'off'
 * and we're at the last song, playback stops.
 */

export type RepeatMode = 'off' | 'all' | 'one'

/**
 * Returns the initial song index for a listener joining a station.
 * Default is 0 (first song), but could be randomized in the future.
 */
export function getInitialSongIndex(songs: Song[]): number {
  if (!songs || songs.length === 0) return -1
  return 0
}

/**
 * Returns the next song index based on the current index and repeat mode.
 *
 * - repeatMode 'off': returns -1 if at last song (stop), otherwise index + 1
 * - repeatMode 'all': wraps around to 0 if at last song, otherwise index + 1
 * - repeatMode 'one': returns the same index (repeat current song)
 */
export function getNextSongIndex(
  currentIndex: number,
  totalSongs: number,
  repeatMode: RepeatMode
): number {
  if (totalSongs === 0) return -1
  if (repeatMode === 'one') return currentIndex
  if (currentIndex < totalSongs - 1) return currentIndex + 1
  // We're at the last song
  if (repeatMode === 'all') return 0
  return -1 // stop
}

/**
 * Returns the previous song index. Wraps around to the last song if at the
 * first song (regardless of repeat mode — going backwards always works).
 */
export function getPreviousSongIndex(
  currentIndex: number,
  totalSongs: number
): number {
  if (totalSongs === 0) return -1
  if (currentIndex > 0) return currentIndex - 1
  return totalSongs - 1 // wrap to last song
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
