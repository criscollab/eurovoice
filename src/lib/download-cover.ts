import { parseYouTubeUrl } from '@/lib/youtube'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

/**
 * Directory where downloaded cover images are stored.
 * Resolves to <project-root>/public/covers.
 */
export const COVERS_DIR = path.join(process.cwd(), 'public', 'covers')

const THUMBNAIL_QUALITIES = ['maxresdefault', 'hqdefault', 'mqdefault'] as const

/**
 * Downloads a YouTube video thumbnail and saves it locally.
 *
 * Tries each quality in order (maxresdefault → hqdefault → mqdefault) and uses
 * the first one that exists and downloads successfully.
 *
 * @param youtubeUrl Any valid YouTube URL (watch, youtu.be, embed, shorts).
 * @returns The relative URL of the saved image (e.g. "/covers/dQw4w9WgXcQ.jpg"),
 *          or null if the URL is invalid or all downloads fail.
 *
 * This function NEVER throws — all errors are caught and result in `null`.
 */
export async function downloadYouTubeCover(
  youtubeUrl: string
): Promise<string | null> {
  try {
    const parsed = parseYouTubeUrl(youtubeUrl)
    if (!parsed) return null
    const { videoId } = parsed

    // Ensure the directory exists
    try {
      if (!existsSync(COVERS_DIR)) {
        await mkdir(COVERS_DIR, { recursive: true })
      }
    } catch {
      // ignore — we'll try writing and fail gracefully
    }

    for (const quality of THUMBNAIL_QUALITIES) {
      const url = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
      try {
        const res = await fetch(url, { method: 'GET' })
        if (!res.ok) continue
        const contentType = res.headers.get('content-type') || ''
        if (!contentType.startsWith('image/')) continue
        const buffer = Buffer.from(await res.arrayBuffer())
        // Skip tiny placeholder images (YouTube returns a 120x90 gray placeholder
        // for missing thumbnails — typically < 2KB).
        if (buffer.length < 2000) continue

        const targetPath = path.join(COVERS_DIR, `${videoId}.jpg`)
        await writeFile(targetPath, buffer)
        return `/covers/${videoId}.jpg`
      } catch {
        // try next quality
        continue
      }
    }

    return null
  } catch {
    return null
  }
}
