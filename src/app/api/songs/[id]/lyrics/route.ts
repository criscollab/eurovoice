import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

interface LrclibResponse {
  id?: number
  name?: string
  trackName?: string
  artistName?: string
  albumName?: string
  duration?: number
  instrumental?: boolean
  plainLyrics?: string | null
  syncedLyrics?: string | null
}

/**
 * GET /api/songs/[id]/lyrics
 *
 * Fetches lyrics for a song. Tries in this order:
 *   1. If the song has lyrics stored in the database (manually edited), return those.
 *   2. Otherwise, query the LRCLIB public API (free, no API key required).
 *   3. If found via LRCLIB, cache the result in the database for future requests.
 *
 * Returns:
 *   - 200 with { lyricsLrc, lyricsPlain, source: 'database' | 'lrclib' | 'none' }
 *   - 404 if song doesn't exist
 *   - 500 on server error
 *
 * Public endpoint — listeners need to be able to fetch lyrics without auth.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    // === 1. Look up the song in the database ===
    const song = await db.song.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        artist: true,
        duration: true,
        lyricsPlain: true,
        lyricsLrc: true,
      },
    })

    if (!song) {
      return NextResponse.json(
        { error: 'Canción no encontrada' },
        { status: 404 }
      )
    }

    // === 2. If we already have lyrics in the database, return them ===
    if (song.lyricsLrc || song.lyricsPlain) {
      return NextResponse.json({
        lyricsLrc: song.lyricsLrc,
        lyricsPlain: song.lyricsPlain,
        source: 'database',
        title: song.title,
        artist: song.artist,
      })
    }

    // === 3. Query LRCLIB API (free, no API key) ===
    // Docs: https://lrclib.net/docs
    // We use the /api/get endpoint with artist_name + track_name.
    // We also pass duration (in seconds) to improve matching accuracy.
    //
    // Some songs have their title stored as "Artist - Title" (especially
    // when uploaded from YouTube). In that case, split them and use the
    // extracted values for a better match.
    let searchArtist = song.artist
    let searchTitle = song.title
    if (song.title.includes(' - ')) {
      const [extractedArtist, ...rest] = song.title.split(' - ')
      if (extractedArtist && rest.length > 0) {
        searchArtist = extractedArtist.trim()
        searchTitle = rest.join(' - ').trim()
      }
    }
    // Clean up common YouTube suffixes like "(Official Video)", "(Lyrics)", etc.
    searchTitle = searchTitle
      .replace(/\(official\s*(music\s*)?video\)/gi, '')
      .replace(/\(official\s*audio\)/gi, '')
      .replace(/\(lyrics?\)/gi, '')
      .replace(/\(audio\)/gi, '')
      .replace(/\(hd\)/gi, '')
      .replace(/\(4k\)/gi, '')
      .replace(/official\s*(music\s*)?video/gi, '')
      .replace(/\s+/g, ' ')
      .trim()

    const lrclibUrl = new URL('https://lrclib.net/api/get')
    lrclibUrl.searchParams.set('artist_name', searchArtist)
    lrclibUrl.searchParams.set('track_name', searchTitle)
    if (song.duration > 0) {
      lrclibUrl.searchParams.set('duration', String(song.duration))
    }

    const lrclibRes = await fetch(lrclibUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EuroVoice/1.0 (radio online)',
      },
      // 10 second timeout via AbortSignal
      signal: AbortSignal.timeout(10000),
    })

    if (lrclibRes.status === 404) {
      // LRCLIB doesn't have this track
      return NextResponse.json({
        lyricsLrc: null,
        lyricsPlain: null,
        source: 'none',
        title: song.title,
        artist: song.artist,
        message: 'No se encontraron letras para esta canción',
      })
    }

    if (!lrclibRes.ok) {
      console.error('LRCLIB error:', lrclibRes.status, lrclibRes.statusText)
      return NextResponse.json({
        lyricsLrc: null,
        lyricsPlain: null,
        source: 'none',
        title: song.title,
        artist: song.artist,
        message: 'El servicio de letras no está disponible ahora',
      })
    }

    const data: LrclibResponse = await lrclibRes.json()

    // LRCLIB returns a 200 with body but null fields if not found
    if (!data || (!data.syncedLyrics && !data.plainLyrics)) {
      return NextResponse.json({
        lyricsLrc: null,
        lyricsPlain: null,
        source: 'none',
        title: song.title,
        artist: song.artist,
        message: 'No se encontraron letras para esta canción',
      })
    }

    const lyricsLrc = data.syncedLyrics || null
    const lyricsPlain = data.plainLyrics || null

    // === 4. Cache the result in the database for future requests ===
    // This avoids hitting LRCLIB on every play.
    try {
      await db.song.update({
        where: { id: song.id },
        data: {
          lyricsLrc,
          lyricsPlain,
        },
      })
    } catch (cacheErr) {
      // Don't fail the request if caching fails
      console.warn('Failed to cache lyrics:', cacheErr)
    }

    return NextResponse.json({
      lyricsLrc,
      lyricsPlain,
      source: 'lrclib',
      title: song.title,
      artist: song.artist,
      instrumental: data.instrumental === true,
    })
  } catch (error) {
    console.error('Failed to fetch lyrics:', error)
    return NextResponse.json(
      { error: 'No se pudieron cargar las letras' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/songs/[id]/lyrics
 *
 * Manually update the lyrics of a song. Admin-only.
 * Used by the admin panel to edit/correct lyrics that were auto-fetched
 * or to add lyrics to songs that don't have them.
 *
 * Body: { lyricsLrc?: string, lyricsPlain?: string }
 *
 * Setting a field to null clears it. Setting to a string stores it.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { getAdminSession } = await import('@/lib/auth')
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión como administrador.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { lyricsLrc, lyricsPlain } = body || {}

    const existing = await db.song.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Canción no encontrada' },
        { status: 404 }
      )
    }

    // Build the update payload — only update fields that are present in the body
    // (allows clearing by passing null)
    const data: { lyricsLrc?: string | null; lyricsPlain?: string | null } = {}
    if ('lyricsLrc' in body) {
      data.lyricsLrc = typeof lyricsLrc === 'string' && lyricsLrc.trim() ? lyricsLrc : null
    }
    if ('lyricsPlain' in body) {
      data.lyricsPlain = typeof lyricsPlain === 'string' && lyricsPlain.trim() ? lyricsPlain : null
    }

    const song = await db.song.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        artist: true,
        lyricsLrc: true,
        lyricsPlain: true,
      },
    })

    return NextResponse.json({ song })
  } catch (error) {
    console.error('Failed to update lyrics:', error)
    return NextResponse.json(
      { error: 'No se pudieron guardar las letras' },
      { status: 500 }
    )
  }
}
