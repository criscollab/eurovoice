import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

const VALID_REACTIONS = new Set(['like', 'heart', 'dislike'])

/**
 * GET /api/songs/[id]/react?sessionId=...
 *
 * Returns the song's reaction counts (likes, hearts, dislikes) and the
 * caller's current reaction (if any). Public — uses sessionId for
 * identification only (no auth required).
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('sessionId') || ''

    const song = await db.song.findUnique({
      where: { id },
      select: { likes: true, hearts: true, dislikes: true },
    })
    if (!song) {
      return NextResponse.json({ error: 'Canción no encontrada' }, { status: 404 })
    }

    let userReaction: string | null = null
    if (sessionId) {
      const row = await db.songReaction.findUnique({
        where: { sessionId_songId: { sessionId, songId: id } },
        select: { reaction: true },
      })
      userReaction = row?.reaction ?? null
    }

    return NextResponse.json({
      likes: song.likes,
      hearts: song.hearts,
      dislikes: song.dislikes,
      userReaction,
    })
  } catch (error) {
    console.error('Failed to fetch reactions:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

/**
 * POST /api/songs/[id]/react
 * Body: { sessionId, reaction }
 *
 * Toggles the caller's reaction to this song:
 *   - If the caller already had the same reaction → remove it (decrement counter)
 *   - If the caller had a different reaction → replace it (decrement old, increment new)
 *   - If the caller had no reaction → create it (increment counter)
 *
 * Returns the updated counts and the caller's new reaction (or null).
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : ''
    const reaction = typeof body?.reaction === 'string' ? body.reaction : ''

    if (!sessionId) {
      return NextResponse.json({ error: 'Falta sessionId' }, { status: 400 })
    }
    if (!VALID_REACTIONS.has(reaction)) {
      return NextResponse.json(
        { error: 'Reacción inválida (debe ser like, heart o dislike)' },
        { status: 400 }
      )
    }

    const song = await db.song.findUnique({ where: { id }, select: { id: true } })
    if (!song) {
      return NextResponse.json({ error: 'Canción no encontrada' }, { status: 404 })
    }

    // Look up any existing reaction by this session
    const existing = await db.songReaction.findUnique({
      where: { sessionId_songId: { sessionId, songId: id } },
    })

    if (existing && existing.reaction === reaction) {
      // Same reaction → remove it (toggle off)
      await db.$transaction([
        db.songReaction.delete({ where: { id: existing.id } }),
        db.song.update({
          where: { id },
          data: { [reaction === 'like' ? 'likes' : reaction === 'heart' ? 'hearts' : 'dislikes']: { decrement: 1 } },
        }),
      ])
      const updated = await db.song.findUnique({
        where: { id },
        select: { likes: true, hearts: true, dislikes: true },
      })
      return NextResponse.json({
        likes: updated?.likes ?? 0,
        hearts: updated?.hearts ?? 0,
        dislikes: updated?.dislikes ?? 0,
        userReaction: null,
      })
    }

    // Different or new reaction
    if (existing) {
      // Decrement the old counter and switch the row to the new reaction
      const oldCounterField =
        existing.reaction === 'like' ? 'likes' : existing.reaction === 'heart' ? 'hearts' : 'dislikes'
      const newCounterField =
        reaction === 'like' ? 'likes' : reaction === 'heart' ? 'hearts' : 'dislikes'
      await db.$transaction([
        db.songReaction.update({
          where: { id: existing.id },
          data: { reaction },
        }),
        db.song.update({
          where: { id },
          data: {
            [oldCounterField]: { decrement: 1 },
            [newCounterField]: { increment: 1 },
          },
        }),
      ])
    } else {
      // No prior reaction → create one
      const newCounterField =
        reaction === 'like' ? 'likes' : reaction === 'heart' ? 'hearts' : 'dislikes'
      await db.$transaction([
        db.songReaction.create({
          data: { sessionId, songId: id, reaction },
        }),
        db.song.update({
          where: { id },
          data: { [newCounterField]: { increment: 1 } },
        }),
      ])
    }

    const updated = await db.song.findUnique({
      where: { id },
      select: { likes: true, hearts: true, dislikes: true },
    })
    return NextResponse.json({
      likes: updated?.likes ?? 0,
      hearts: updated?.hearts ?? 0,
      dislikes: updated?.dislikes ?? 0,
      userReaction: reaction,
    })
  } catch (error) {
    console.error('Failed to update reaction:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
