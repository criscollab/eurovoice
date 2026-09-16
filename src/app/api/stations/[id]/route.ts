import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * GET /api/stations/[id]
 * Returns a single station with its songs.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const station = await db.station.findUnique({
      where: { id },
      include: {
        songs: { orderBy: { order: 'asc' } },
      },
    })

    if (!station) {
      return NextResponse.json(
        { error: 'Emisora no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ station })
  } catch (error) {
    console.error('Failed to fetch station:', error)
    return NextResponse.json(
      { error: 'No se pudo cargar la emisora' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/stations/[id]
 * Updates a station.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, description, language, color, coverUrl } = body || {}

    const existing = await db.station.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Emisora no encontrada' },
        { status: 404 }
      )
    }

    const station = await db.station.update({
      where: { id },
      data: {
        ...(typeof name === 'string' && name.trim() ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(typeof language === 'string' && language.trim() ? { language: language.trim() } : {}),
        ...(typeof color === 'string' && color.trim() ? { color: color.trim() } : {}),
        ...(coverUrl !== undefined ? { coverUrl: coverUrl?.trim() || null } : {}),
      },
    })

    return NextResponse.json({ station })
  } catch (error) {
    console.error('Failed to update station:', error)
    return NextResponse.json(
      { error: 'No se pudo actualizar la emisora' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/stations/[id]
 * Deletes a station (cascades to its songs).
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const existing = await db.station.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Emisora no encontrada' },
        { status: 404 }
      )
    }

    await db.station.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to delete station:', error)
    return NextResponse.json(
      { error: 'No se pudo eliminar la emisora' },
      { status: 500 }
    )
  }
}
