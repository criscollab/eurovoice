import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'
import { downloadYouTubeCover } from '@/lib/download-cover'

/**
 * POST /api/admin/process-covers
 *
 * Admin-only. Iterates over all songs that have a `youtubeUrl` but no
 * `coverUrl`, downloads the YouTube thumbnail, and stores the local URL in
 * `coverUrl`.
 *
 * Returns a summary of how many covers were processed, succeeded, or failed.
 */
export async function POST() {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión como administrador.' },
        { status: 401 }
      )
    }

    const songs = await db.song.findMany({
      where: {
        AND: [
          { youtubeUrl: { not: null } },
          { coverUrl: null },
        ],
      },
      select: { id: true, youtubeUrl: true },
    })

    let success = 0
    let failed = 0
    const errors: Array<{ songId: string; error: string }> = []

    for (const song of songs) {
      if (!song.youtubeUrl) continue
      try {
        const coverUrl = await downloadYouTubeCover(song.youtubeUrl)
        if (coverUrl) {
          await db.song.update({
            where: { id: song.id },
            data: { coverUrl },
          })
          success++
        } else {
          failed++
          errors.push({ songId: song.id, error: 'No thumbnail available' })
        }
      } catch (err: unknown) {
        failed++
        errors.push({
          songId: song.id,
          error: err instanceof Error ? err.message : 'unknown error',
        })
      }
    }

    return NextResponse.json({
      processed: songs.length,
      success,
      failed,
      errors: errors.slice(0, 20), // cap to avoid huge payloads
    })
  } catch (error) {
    console.error('Failed to process covers:', error)
    return NextResponse.json(
      { error: 'No se pudieron procesar las portadas' },
      { status: 500 }
    )
  }
}
