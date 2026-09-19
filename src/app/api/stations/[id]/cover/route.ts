import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * GET /api/stations/[id]/cover
 *
 * Public. Returns the cover URL of the most-played song in this station
 * that has a cover image. Used by station cards to display a representative
 * album cover.
 *
 * Response:
 *   - 200 { coverUrl: string } if a cover exists
 *   - 200 { coverUrl: null } if no song has a cover (caller falls back to vinyl)
 *   - 404 if the station doesn't exist
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const station = await db.station.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!station) {
      return NextResponse.json(
        { error: 'Emisora no encontrada' },
        { status: 404 }
      )
    }

    const song = await db.song.findFirst({
      where: {
        stationId: id,
        coverUrl: { not: null },
      },
      orderBy: { playCount: 'desc' },
      select: { coverUrl: true },
    })

    return NextResponse.json({ coverUrl: song?.coverUrl ?? null })
  } catch (error) {
    console.error('Failed to fetch station cover:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
