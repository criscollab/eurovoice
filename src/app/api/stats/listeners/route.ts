import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

/**
 * GET /api/stats/listeners
 *
 * Returns real-time listener counts. A session is considered "active" if
 * its last heartbeat was within the last 60 seconds.
 *
 * Admin-only (returns 401 otherwise) — these stats are sensitive.
 */
export async function GET() {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión como administrador.' },
        { status: 401 }
      )
    }

    // Compute "60 seconds ago" cutoff
    const cutoff = new Date(Date.now() - 60 * 1000)

    // Total active listeners
    const totalActive = await db.listenerSession.count({
      where: { lastSeenAt: { gte: cutoff } },
    })

    // Active listeners per station
    const perStation = await db.listenerSession.groupBy({
      by: ['stationId'],
      where: { lastSeenAt: { gte: cutoff }, stationId: { not: null } },
      _count: { _all: true },
    })

    // All-time unique listeners
    const totalUnique = await db.listenerSession.count()

    // Active listeners by country
    const byCountry = await db.listenerSession.groupBy({
      by: ['country'],
      where: { lastSeenAt: { gte: cutoff }, country: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { country: 'desc' } },
      take: 10,
    })

    // Resolve station names for the per-station breakdown
    const stationIds = perStation.map((s) => s.stationId!).filter(Boolean)
    const stations = stationIds.length
      ? await db.station.findMany({ where: { id: { in: stationIds } }, select: { id: true, name: true } })
      : []
    const stationMap = new Map(stations.map((s) => [s.id, s.name]))

    return NextResponse.json({
      totalActive,
      totalUnique,
      perStation: perStation.map((s) => ({
        stationId: s.stationId,
        stationName: stationMap.get(s.stationId!) || 'Unknown',
        count: s._count._all,
      })),
      byCountry: byCountry.map((c) => ({
        country: c.country,
        count: c._count._all,
      })),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to fetch listener stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
