import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/listeners/heartbeat
 *
 * Called by the client every 30 seconds while a song is playing.
 * Creates or updates a ListenerSession row. The `lastSeenAt` field is
 * used to determine if a session is still "active" (seen in the last 60s).
 *
 * Body: { sessionId: string, stationId?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, stationId } = body || {}

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    // Detect country from Cloudflare / standard headers if available
    const country =
      req.headers.get('cf-ipcountry') ||
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('x-country-code') ||
      null

    const userAgent = req.headers.get('user-agent')?.slice(0, 255) || null

    // Upsert the session — create if new, update lastSeenAt if exists
    const session = await db.listenerSession.upsert({
      where: { sessionId },
      update: {
        lastSeenAt: new Date(),
        stationId: stationId || null,
        country,
        userAgent,
      },
      create: {
        sessionId,
        stationId: stationId || null,
        country,
        userAgent,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      },
    })

    return NextResponse.json({ ok: true, sessionId: session.sessionId })
  } catch (error) {
    console.error('Heartbeat failed:', error)
    return NextResponse.json({ error: 'Failed to update listener' }, { status: 500 })
  }
}
