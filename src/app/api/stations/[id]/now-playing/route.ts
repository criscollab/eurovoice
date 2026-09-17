import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { computeNowPlaying } from '@/lib/radio'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * GET /api/stations/[id]/now-playing
 * Returns the song that should be currently playing on this station
 * at this exact moment, calculated from a continuous 24/7 timeline.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const station = await db.station.findUnique({
      where: { id },
      include: { songs: { orderBy: { order: 'asc' } } },
    })

    if (!station) {
      return NextResponse.json(
        { error: 'Emisora no encontrada' },
        { status: 404 }
      )
    }

    const now = Date.now()
    const nowPlaying = computeNowPlaying(station, station.songs, now)

    if (!nowPlaying) {
      return NextResponse.json({
        stationId: station.id,
        stationName: station.name,
        nowPlaying: null,
        serverTime: now,
      })
    }

    return NextResponse.json({
      stationId: station.id,
      stationName: station.name,
      nowPlaying,
      serverTime: now,
    })
  } catch (error) {
    console.error('Failed to fetch now-playing:', error)
    return NextResponse.json(
      { error: 'No se pudo obtener la canción actual' },
      { status: 500 }
    )
  }
}
