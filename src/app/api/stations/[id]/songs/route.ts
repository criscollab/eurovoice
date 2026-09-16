import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * GET /api/stations/[id]/songs
 * Returns all songs of a station, ordered by `order`.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const station = await db.station.findUnique({ where: { id } })
    if (!station) {
      return NextResponse.json(
        { error: 'Emisora no encontrada' },
        { status: 404 }
      )
    }

    const songs = await db.song.findMany({
      where: { stationId: id },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ songs })
  } catch (error) {
    console.error('Failed to list songs:', error)
    return NextResponse.json(
      { error: 'No se pudieron cargar las canciones' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/stations/[id]/songs
 * Adds a new song to a station. The new song is appended at the end of the queue.
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const station = await db.station.findUnique({ where: { id } })
    if (!station) {
      return NextResponse.json(
        { error: 'Emisora no encontrada' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { title, artist, audioUrl, duration, coverUrl, order } = body || {}

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'El título de la canción es obligatorio' },
        { status: 400 }
      )
    }
    if (!audioUrl || typeof audioUrl !== 'string' || !audioUrl.trim()) {
      return NextResponse.json(
        { error: 'La URL del audio es obligatoria' },
        { status: 400 }
      )
    }

    // Determine the order: if not provided, append at the end
    let nextOrder: number
    if (typeof order === 'number' && Number.isFinite(order)) {
      nextOrder = order
    } else {
      const maxOrderAgg = await db.song.aggregate({
        where: { stationId: id },
        _max: { order: true },
      })
      nextOrder = (maxOrderAgg._max.order ?? -1) + 1
    }

    const song = await db.song.create({
      data: {
        title: title.trim(),
        artist: typeof artist === 'string' ? artist.trim() : 'Artista desconocido',
        audioUrl: audioUrl.trim(),
        duration: typeof duration === 'number' && duration > 0 ? Math.floor(duration) : 180,
        coverUrl: typeof coverUrl === 'string' && coverUrl.trim() ? coverUrl.trim() : null,
        order: nextOrder,
        stationId: id,
      },
    })

    return NextResponse.json({ song }, { status: 201 })
  } catch (error) {
    console.error('Failed to add song:', error)
    return NextResponse.json(
      { error: 'No se pudo agregar la canción' },
      { status: 500 }
    )
  }
}
