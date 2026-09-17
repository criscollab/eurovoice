import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * POST /api/stations/[id]/reorder
 * Admin-only — requires authenticated session.
 * Reorders the songs of a station.
 * Body: { orderedSongIds: string[] }
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión como administrador.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { orderedSongIds } = body || {}

    if (!Array.isArray(orderedSongIds) || orderedSongIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere una lista de IDs de canciones' },
        { status: 400 }
      )
    }

    const station = await db.station.findUnique({ where: { id } })
    if (!station) {
      return NextResponse.json(
        { error: 'Emisora no encontrada' },
        { status: 404 }
      )
    }

    // Update each song's order in parallel
    await db.$transaction(
      orderedSongIds.map((songId: string, index: number) =>
        db.song.update({
          where: { id: songId, stationId: id },
          data: { order: index },
        })
      )
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to reorder songs:', error)
    return NextResponse.json(
      { error: 'No se pudo reordenar la lista' },
      { status: 500 }
    )
  }
}
