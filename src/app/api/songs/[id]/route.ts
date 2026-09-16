import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/songs/[id]
 * Updates a song's metadata or order.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, artist, audioUrl, duration, coverUrl, order } = body || {}

    const existing = await db.song.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Canción no encontrada' },
        { status: 404 }
      )
    }

    const song = await db.song.update({
      where: { id },
      data: {
        ...(typeof title === 'string' && title.trim() ? { title: title.trim() } : {}),
        ...(typeof artist === 'string' && artist.trim() ? { artist: artist.trim() } : {}),
        ...(typeof audioUrl === 'string' && audioUrl.trim() ? { audioUrl: audioUrl.trim() } : {}),
        ...(typeof duration === 'number' && duration > 0 ? { duration: Math.floor(duration) } : {}),
        ...(coverUrl !== undefined ? { coverUrl: coverUrl?.trim() || null } : {}),
        ...(typeof order === 'number' && Number.isFinite(order) ? { order: Math.floor(order) } : {}),
      },
    })

    return NextResponse.json({ song })
  } catch (error) {
    console.error('Failed to update song:', error)
    return NextResponse.json(
      { error: 'No se pudo actualizar la canción' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/songs/[id]
 * Deletes a song.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const existing = await db.song.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Canción no encontrada' },
        { status: 404 }
      )
    }

    await db.song.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to delete song:', error)
    return NextResponse.json(
      { error: 'No se pudo eliminar la canción' },
      { status: 500 }
    )
  }
}
