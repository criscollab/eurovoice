/**
 * LRC parser and helpers for synced lyrics.
 *
 * LRC format example:
 *   [ti:Song Title]
 *   [ar:Artist]
 *   [00:12.34]First line of lyrics
 *   [00:15.67]Second line of lyrics
 *   [00:18.90]Third line of lyrics
 *
 * Each line starts with a timestamp `[mm:ss.xx]` (minutes:seconds.fractional).
 * We parse these timestamps to find the active line for a given playback time.
 */

export interface LrcLine {
  /** Time in seconds when this line should be displayed */
  time: number
  /** The lyrics text for this line (without the timestamp) */
  text: string
}

export interface ParsedLyrics {
  /** Metadata (title, artist, etc.) if present in the LRC */
  metadata: Record<string, string>
  /** Parsed lines with timestamps, sorted by time ascending */
  lines: LrcLine[]
}

/**
 * Parses an LRC string into structured data.
 * Returns { metadata, lines } where lines are sorted by time.
 *
 * If the input doesn't look like LRC (no timestamps), returns empty lines
 * so the caller can fall back to plain text.
 *
 * @param lrc The raw LRC string (with [mm:ss.xx] timestamps)
 */
export function parseLrc(lrc: string): ParsedLyrics {
  const result: ParsedLyrics = { metadata: {}, lines: [] }
  if (!lrc || typeof lrc !== 'string') return result

  // Regex to match timestamps like [00:12.34] or [01:23] (no fractional part)
  // Also matches metadata tags like [ti:Song Title], [ar:Artist]
  const lineRegex = /^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/
  const metadataRegex = /^\[(\w+):(.+)\]$/

  for (const rawLine of lrc.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    // Try timestamp line first
    const lineMatch = line.match(lineRegex)
    if (lineMatch) {
      const minutes = parseInt(lineMatch[1], 10)
      const seconds = parseFloat(lineMatch[2])
      const text = lineMatch[3].trim()
      result.lines.push({
        time: minutes * 60 + seconds,
        text,
      })
      continue
    }

    // Try metadata line
    const metaMatch = line.match(metadataRegex)
    if (metaMatch) {
      result.metadata[metaMatch[1]] = metaMatch[2].trim()
    }
  }

  // Sort lines by time
  result.lines.sort((a, b) => a.time - b.time)
  return result
}

/**
 * Given a parsed lyrics object and a current playback time (in seconds),
 * returns the index of the active line — the line that should currently be highlighted.
 *
 * The active line is the most recent line whose time <= currentTime.
 * Returns -1 if no line is active (currentTime is before the first line).
 */
export function getActiveLineIndex(parsed: ParsedLyrics, currentTime: number): number {
  if (parsed.lines.length === 0) return -1

  // Binary search for the largest time <= currentTime
  let low = 0
  let high = parsed.lines.length - 1
  let result = -1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (parsed.lines[mid].time <= currentTime) {
      result = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return result
}

/**
 * Splits a plain lyrics string into lines (splitting on newlines).
 * Used as a fallback when no LRC is available.
 */
export function splitPlainLyrics(plain: string): string[] {
  if (!plain || typeof plain !== 'string') return []
  return plain
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}

/**
 * Formats a time in seconds as `m:ss` (used for display next to each LRC line).
 */
export function formatLrcTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
