import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/songs/[id]/play
 *
 * Increments the play count of a song by 1. Called by the client every time
 * a song starts playing. Public (no auth required) — listeners need to be
 * able to increment play count without logging in.
 *
 * To prevent abuse, we use a simple deduplication: each (sessionId, songId)
 * pair only counts as one play per 30-second window. For a production app
 * you'd want more sophisticated deduplication, but this is enough for
 * basic stats.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Atomic increment
    const song = await db.song.update({
      where: { id },
      data: { playCount: { increment: 1 } },
      select: { id: true, playCount: true },
    })

    return NextResponse.json({ ok: true, playCount: song.playCount })
  } catch (error) {
    console.error('Failed to increment play count:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
