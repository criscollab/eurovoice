import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/seed
 * Seeds the database with 3 demo stations (Español, English, Français)
 * using SoundHelix royalty-free instrumental tracks.
 *
 * Safe to call multiple times — if a station with the same name already
 * exists, it will be skipped.
 */
export async function POST() {
  try {
    const existingCount = await db.station.count()
    if (existingCount > 0) {
      return NextResponse.json({
        ok: true,
        message: 'La base de datos ya tiene emisoras. No se requiere seeding.',
        skipped: true,
      })
    }

    // Helper: SoundHelix royalty-free instrumental tracks (great for demos)
    const sh = (n: number) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`

    const stationsData = [
      {
        name: 'Neón Latino',
        description: 'Ritmos en español 24/7 — pop, urbano y alternativo en castellano.',
        language: 'Español',
        color: '#ec4899', // pink
        songs: [
          { title: 'Amanecer Eléctrico', artist: 'DJ SoundHelix', audioUrl: sh(1), duration: 372 },
          { title: 'Noche Caliente', artist: 'DJ SoundHelix', audioUrl: sh(2), duration: 425 },
          { title: 'Fuego Latino', artist: 'DJ SoundHelix', audioUrl: sh(3), duration: 290 },
          { title: 'Ritmo del Sur', artist: 'DJ SoundHelix', audioUrl: sh(4), duration: 331 },
          { title: 'Madrugada', artist: 'DJ SoundHelix', audioUrl: sh(5), duration: 309 },
        ],
      },
      {
        name: 'Neon Beats EN',
        description: 'English-language electronic beats broadcasting 24/7.',
        language: 'English',
        color: '#8b5cf6', // purple
        songs: [
          { title: 'Electric Pulse', artist: 'SoundHelix', audioUrl: sh(6), duration: 372 },
          { title: 'Midnight Drive', artist: 'SoundHelix', audioUrl: sh(7), duration: 301 },
          { title: 'Neon Skyline', artist: 'SoundHelix', audioUrl: sh(8), duration: 290 },
          { title: 'After Hours', artist: 'SoundHelix', audioUrl: sh(9), duration: 365 },
          { title: 'Crystal Waves', artist: 'SoundHelix', audioUrl: sh(10), duration: 331 },
        ],
      },
      {
        name: 'Radio Français',
        description: 'Musique en français, diffusion automatique 24h/24.',
        language: 'Français',
        color: '#06b6d4', // cyan
        songs: [
          { title: 'Lumière Néon', artist: 'SoundHelix', audioUrl: sh(11), duration: 348 },
          { title: 'Nuit Parisienne', artist: 'SoundHelix', audioUrl: sh(12), duration: 281 },
          { title: 'Étoile Filante', artist: 'SoundHelix', audioUrl: sh(13), duration: 365 },
          { title: 'Aube Électrique', artist: 'SoundHelix', audioUrl: sh(14), duration: 312 },
          { title: 'Vagues Cristallines', artist: 'SoundHelix', audioUrl: sh(15), duration: 331 },
        ],
      },
    ]

    for (const data of stationsData) {
      const station = await db.station.create({
        data: {
          name: data.name,
          description: data.description,
          language: data.language,
          color: data.color,
        },
      })

      for (let i = 0; i < data.songs.length; i++) {
        const s = data.songs[i]
        await db.song.create({
          data: {
            title: s.title,
            artist: s.artist,
            audioUrl: s.audioUrl,
            duration: s.duration,
            order: i,
            stationId: station.id,
          },
        })
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Se crearon 3 emisoras de demo (Español, English, Français) con 5 canciones cada una.',
    })
  } catch (error) {
    console.error('Seed failed:', error)
    return NextResponse.json(
      { error: 'No se pudo inicializar la base de datos' },
      { status: 500 }
    )
  }
}
