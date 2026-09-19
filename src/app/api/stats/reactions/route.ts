import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/stats/reactions
 *
 * Public. Returns the top songs by each reaction type (like / heart / dislike).
 * Useful for "most liked" sections or admin dashboards.
 *
 * Query: ?limit=10 (max 50, default 10)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 50)

    const [topLiked, topHearted, topDisliked] = await Promise.all([
      db.song.findMany({
        where: { likes: { gt: 0 } },
        orderBy: { likes: 'desc' },
        take: limit,
        include: { station: { select: { name: true, color: true } } },
      }),
      db.song.findMany({
        where: { hearts: { gt: 0 } },
        orderBy: { hearts: 'desc' },
        take: limit,
        include: { station: { select: { name: true, color: true } } },
      }),
      db.song.findMany({
        where: { dislikes: { gt: 0 } },
        orderBy: { dislikes: 'desc' },
        take: limit,
        include: { station: { select: { name: true, color: true } } },
      }),
    ])

    const map = (list: typeof topLiked, key: 'likes' | 'hearts' | 'dislikes') =>
      list.map((s) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        coverUrl: s.coverUrl,
        count: s[key],
        stationName: s.station.name,
        stationColor: s.station.color,
      }))

    return NextResponse.json({
      topLiked: map(topLiked, 'likes'),
      topHearted: map(topHearted, 'hearts'),
      topDisliked: map(topDisliked, 'dislikes'),
    })
  } catch (error) {
    console.error('Failed to fetch reaction stats:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
