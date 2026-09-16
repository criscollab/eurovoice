import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

/**
 * GET /api/stations
 * Public — anyone can list stations.
 */
export async function GET() {
  try {
    const stations = await db.station.findMany({
      include: {
        _count: { select: { songs: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ stations })
  } catch (error) {
    console.error('Failed to list stations:', error)
    return NextResponse.json(
      { error: 'No se pudieron cargar las emisoras' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/stations
 * Admin-only — requires authenticated session.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión como administrador.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, description, language, color, coverUrl } = body || {}

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'El nombre de la emisora es obligatorio' },
        { status: 400 }
      )
    }

    const station = await db.station.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        language: language?.trim() || 'Español',
        color: color?.trim() || '#ec4899',
        coverUrl: coverUrl?.trim() || null,
      },
    })

    return NextResponse.json({ station }, { status: 201 })
  } catch (error) {
    console.error('Failed to create station:', error)
    return NextResponse.json(
      { error: 'No se pudo crear la emisora' },
      { status: 500 }
    )
  }
}
