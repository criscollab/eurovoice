import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/search?q=...
 *
 * Searches all songs by title or artist (case-insensitive, partial match).
 * Public — anyone can search.
 *
 * Returns a list of matches with the song and its station info, so the client
 * can show the station name/color next to each result and switch to the right
 * station when a result is clicked.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const q = (url.searchParams.get('q') || '').trim()
    if (!q) {
      return NextResponse.json({ matches: [] })
    }

    // SQLite's contains() is case-insensitive by default, which is what we want.
    const songs = await db.song.findMany({
      where: {
        OR: [{ title: { contains: q } }, { artist: { contains: q } }],
      },
      include: {
        station: {
          select: { id: true, name: true, color: true },
        },
      },
      take: 50,
      orderBy: { title: 'asc' },
    })

    const matches = songs.map((s) => ({
      songId: s.id,
      songTitle: s.title,
      songArtist: s.artist,
      coverUrl: s.coverUrl,
      stationId: s.station.id,
      stationName: s.station.name,
      stationColor: s.station.color,
    }))

    return NextResponse.json({ matches })
  } catch (error) {
    console.error('Search failed:', error)
    return NextResponse.json({ error: 'search failed' }, { status: 500 })
  }
}
