import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

/**
 * GET /api/stats/top-songs
 *
 * Returns the top-played songs across all stations (or filtered by stationId
 * via query param). Admin-only.
 *
 * Query: ?limit=20&stationId=...
 */
export async function GET(req: Request) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión como administrador.' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 100)
    const stationId = url.searchParams.get('stationId')

    const songs = await db.song.findMany({
      where: stationId ? { stationId } : {},
      orderBy: { playCount: 'desc' },
      take: limit,
      include: { station: { select: { name: true } } },
    })

    return NextResponse.json({
      songs: songs.map((s) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        playCount: s.playCount,
        stationName: s.station.name,
        duration: s.duration,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch top songs:', error)
    return NextResponse.json({ error: 'Failed to fetch top songs' }, { status: 500 })
  }
}
