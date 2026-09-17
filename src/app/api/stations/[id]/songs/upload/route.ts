import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'audios')
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB limit
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
  'audio/ogg',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
]
const ALLOWED_EXTENSIONS = ['.mp3', '.m4a', '.aac', '.ogg', '.wav', '.flac']

interface Params {
  params: Promise<{ id: string }>
}

/**
 * Sanitizes a filename to be URL-safe:
 * - Convert to lowercase
 * - Replace spaces with hyphens
 * - Remove accents and special chars
 * - Keep only alphanumeric, hyphens, underscores, dots
 */
function sanitizeFilename(filename: string): string {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-') // replace special chars with hyphen
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
}

/**
 * Generates a unique filename by appending a counter if the file already exists.
 */
async function getUniqueFilename(dir: string, baseName: string, ext: string): string {
  let filename = `${baseName}${ext}`
  let counter = 1
  while (existsSync(path.join(dir, filename))) {
    filename = `${baseName}-${counter}${ext}`
    counter++
  }
  return filename
}

/**
 * Uses ffprobe to get the duration of an audio file in seconds.
 * Falls back to 180 seconds (3 minutes) if ffprobe is not available or fails.
 */
async function getAudioDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-i', filePath,
      '-show_entries', 'format=duration',
      '-v', 'quiet',
      '-of', 'csv=p=0',
    ])
    const duration = parseFloat(stdout.trim())
    if (!isNaN(duration) && duration > 0) {
      return Math.round(duration)
    }
  } catch (err) {
    console.warn('ffprobe not available, using default duration:', err)
  }
  return 180 // default: 3 minutes
}

/**
 * POST /api/stations/[id]/songs/upload
 *
 * Uploads an MP3 (or other audio) file and creates a new song in the database.
 * Receives multipart/form-data with:
 *   - file: the audio file (File/Blob)
 *   - title: song title (string, optional — defaults to filename)
 *   - artist: song artist (string, optional)
 *
 * Admin-only — requires authenticated session.
 *
 * The file is saved to public/audios/{sanitized-filename}.mp3 so it's
 * served automatically by Next.js at /audios/{filename}.mp3
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    // === Auth check ===
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión como administrador.' },
        { status: 401 }
      )
    }

    const { id } = await params

    // === Verify station exists ===
    const station = await db.station.findUnique({ where: { id } })
    if (!station) {
      return NextResponse.json(
        { error: 'Emisora no encontrada' },
        { status: 404 }
      )
    }

    // === Parse multipart form ===
    const formData = await req.formData()
    const file = formData.get('file')
    const title = formData.get('title') as string | null
    const artist = formData.get('artist') as string | null

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // === Validate file size ===
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo es demasiado grande. Máximo ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'El archivo está vacío' },
        { status: 400 }
      )
    }

    // === Validate file type ===
    const fileName = file.name || 'audio.mp3'
    const ext = path.extname(fileName).toLowerCase()

    const isValidMime = ALLOWED_MIME_TYPES.includes(file.type)
    const isValidExt = ALLOWED_EXTENSIONS.includes(ext)

    if (!isValidMime && !isValidExt) {
      return NextResponse.json(
        {
          error: `Tipo de archivo no soportado. Formatos permitidos: ${ALLOWED_EXTENSIONS.join(', ')}`,
          detectedType: file.type,
          detectedExt: ext,
        },
        { status: 400 }
      )
    }

    // === Ensure upload directory exists ===
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // === Sanitize filename and make unique ===
    const baseName = sanitizeFilename(path.basename(fileName, ext)) || `audio-${Date.now()}`
    const finalExt = ext || '.mp3' // default to .mp3 if no extension
    const finalFilename = await getUniqueFilename(UPLOAD_DIR, baseName, finalExt)
    const filePath = path.join(UPLOAD_DIR, finalFilename)

    // === Write the file to disk ===
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await writeFile(filePath, buffer)

    // === Get audio duration using ffprobe ===
    const duration = await getAudioDuration(filePath)

    // === Compute the public URL (relative so it works in any deployment) ===
    const audioUrl = `/audios/${finalFilename}`

    // === Determine order (append at end) ===
    const maxOrderAgg = await db.song.aggregate({
      where: { stationId: id },
      _max: { order: true },
    })
    const nextOrder = (maxOrderAgg._max.order ?? -1) + 1

    // === Create the song in the database ===
    const song = await db.song.create({
      data: {
        title: (title?.trim() || baseName).slice(0, 200),
        artist: (artist?.trim() || 'Artista desconocido').slice(0, 200),
        audioUrl,
        duration,
        order: nextOrder,
        stationId: id,
      },
    })

    return NextResponse.json(
      {
        song,
        file: {
          name: finalFilename,
          size: file.size,
          type: file.type || `audio/${finalExt.slice(1)}`,
          duration,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json(
      { error: 'No se pudo subir el archivo. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
