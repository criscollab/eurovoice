/**
 * YouTube URL utilities — parse, validate, and normalize YouTube URLs.
 *
 * Supports:
 *   - https://www.youtube.com/watch?v=VIDEO_ID
 *   - https://youtu.be/VIDEO_ID
 *   - https://www.youtube.com/embed/VIDEO_ID
 *   - https://www.youtube.com/shorts/VIDEO_ID
 *   - https://m.youtube.com/watch?v=VIDEO_ID
 *
 * Returns null if the URL is not a valid YouTube URL.
 */

const YOUTUBE_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]

export interface ParsedYouTube {
  videoId: string
  normalizedUrl: string
}

/**
 * Extracts the YouTube video ID from any supported YouTube URL format.
 * Returns null if the URL is not a valid YouTube URL or has no video ID.
 */
export function parseYouTubeUrl(url: string): ParsedYouTube | null {
  if (!url || typeof url !== 'string') return null

  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.toLowerCase()

    if (!YOUTUBE_HOSTS.includes(host)) return null

    let videoId: string | null = null

    // youtu.be/VIDEO_ID
    if (host === 'youtu.be') {
      videoId = parsed.pathname.slice(1).split('/')[0] || null
    }
    // youtube.com/watch?v=VIDEO_ID
    else if (parsed.pathname === '/watch') {
      videoId = parsed.searchParams.get('v')
    }
    // youtube.com/embed/VIDEO_ID
    else if (parsed.pathname.startsWith('/embed/')) {
      videoId = parsed.pathname.slice('/embed/'.length).split('/')[0]
    }
    // youtube.com/shorts/VIDEO_ID
    else if (parsed.pathname.startsWith('/shorts/')) {
      videoId = parsed.pathname.slice('/shorts/'.length).split('/')[0]
    }
    // youtube.com/v/VIDEO_ID (legacy embed)
    else if (parsed.pathname.startsWith('/v/')) {
      videoId = parsed.pathname.slice('/v/'.length).split('/')[0]
    }

    if (!videoId) return null

    // Validate video ID format: YouTube IDs are 11 characters, alphanumeric + - _
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return null

    return {
      videoId,
      normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
    }
  } catch {
    return null
  }
}

/**
 * Returns true if the URL is a valid YouTube URL with an extractable video ID.
 */
export function isValidYouTubeUrl(url: string): boolean {
  return parseYouTubeUrl(url) !== null
}

/**
 * Normalizes a YouTube URL to the canonical form: https://www.youtube.com/watch?v=VIDEO_ID
 * Returns null if the URL is not a valid YouTube URL.
 */
export function normalizeYouTubeUrl(url: string): string | null {
  return parseYouTubeUrl(url)?.normalizedUrl ?? null
}

/**
 * Returns the YouTube thumbnail URL for a given video ID.
 * Useful for preview images.
 */
export function getYouTubeThumbnail(url: string): string | null {
  const parsed = parseYouTubeUrl(url)
  if (!parsed) return null
  return `https://img.youtube.com/vi/${parsed.videoId}/hqdefault.jpg`
}
