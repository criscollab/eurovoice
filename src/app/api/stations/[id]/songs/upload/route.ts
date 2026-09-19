import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'
import { downloadYouTubeCover } from '@/lib/download-cover'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'audios')
const MAX_FILE_SIZE = 50 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['.mp3', '.m4a', '.aac', '.ogg', '.wav', '.flac']

interface Params { params: Promise<{ id: string }> }

function sanitizeFilename(filename: string): string {
  return filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9.\-_]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
}

async function getUniqueFilename(dir: string, baseName: string, ext: string): Promise<string> {
  let filename = `${baseName}${ext}`
  let counter = 1
  while (existsSync(path.join(dir, filename))) { filename = `${baseName}-${counter}${ext}`; counter++ }
  return filename
}

async function getAudioDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync('ffprobe', ['-i', filePath, '-show_entries', 'format=duration', '-v', 'quiet', '-of', 'csv=p=0'])
    const duration = parseFloat(stdout.trim())
    if (!isNaN(duration) && duration > 0) return Math.round(duration)
  } catch {}
  return 180
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { id } = await params
    const station = await db.station.findUnique({ where: { id } })
    if (!station) return NextResponse.json({ error: 'Emisora no encontrada' }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get('file')
    const title = formData.get('title') as string | null
    const artist = formData.get('artist') as string | null
    const youtubeUrl = formData.get('youtubeUrl') as string | null

    if (!file || !(file instanceof File)) return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: `Máximo ${MAX_FILE_SIZE / 1024 / 1024} MB` }, { status: 400 })
    if (file.size === 0) return NextResponse.json({ error: 'Archivo vacío' }, { status: 400 })

    const fileName = file.name || 'audio.mp3'
    const ext = path.extname(fileName).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 })

    if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true })
    const baseName = sanitizeFilename(path.basename(fileName, ext)) || `audio-${Date.now()}`
    const finalFilename = await getUniqueFilename(UPLOAD_DIR, baseName, ext || '.mp3')
    const filePath = path.join(UPLOAD_DIR, finalFilename)
    const arrayBuffer = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(arrayBuffer))

    const duration = await getAudioDuration(filePath)
    const audioUrl = `/audios/${finalFilename}`

    let autoCoverUrl: string | null = null
    if (typeof youtubeUrl === 'string' && youtubeUrl.trim()) {
      autoCoverUrl = await downloadYouTubeCover(youtubeUrl.trim())
    }

    const maxOrderAgg = await db.song.aggregate({ where: { stationId: id }, _max: { order: true } })
    const nextOrder = (maxOrderAgg._max.order ?? -1) + 1

    const song = await db.song.create({
      data: {
        title: (title?.trim() || baseName).slice(0, 200),
        artist: (artist?.trim() || 'Artista desconocido').slice(0, 200),
        audioUrl, duration, coverUrl: autoCoverUrl,
        youtubeUrl: typeof youtubeUrl === 'string' && youtubeUrl.trim() ? youtubeUrl.trim() : null,
        order: nextOrder, stationId: id,
      },
    })
    return NextResponse.json({ song, file: { name: finalFilename, size: file.size, duration } }, { status: 201 })
  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json({ error: 'No se pudo subir el archivo' }, { status: 500 })
  }
}
