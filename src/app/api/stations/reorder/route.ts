import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

/**
 * POST /api/stations/reorder
 * Admin-only — reorders stations.
 *
 * Body: { orderedStationIds: string[] }
 *
 * Updates the `order` field of each station to match its position in the
 * provided array. The array must contain all station IDs in the desired order.
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
    const { orderedStationIds } = body || {}

    if (!Array.isArray(orderedStationIds) || orderedStationIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere una lista de IDs de emisoras' },
        { status: 400 }
      )
    }

    // Update each station's order in a transaction
    await db.$transaction(
      orderedStationIds.map((stationId: string, index: number) =>
        db.station.update({
          where: { id: stationId },
          data: { order: index },
        })
      )
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to reorder stations:', error)
    return NextResponse.json(
      { error: 'No se pudo reordenar las emisoras' },
      { status: 500 }
    )
  }
}
