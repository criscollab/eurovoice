'use client'

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { UrlAudioTester } from '@/components/url-audio-tester'
import {
  UploadCloud,
  FileAudio,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/radio'

type UploadMode = 'url' | 'upload'
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface UploadResult {
  url: string
  duration: number
  fileName: string
}

interface SongUploaderProps {
  /** Called whenever the audio URL changes (either via upload or manual entry) */
  onUrlChange: (url: string) => void
  /** Called when a file is successfully uploaded with duration info */
  onDurationChange?: (durationSeconds: number) => void
  /** Current audio URL value (controlled) */
  url: string
  /** Current duration value (controlled) */
  duration: number
  /** Called when duration slider changes */
  onDurationChange2: (durationSeconds: number) => void
  /** Station ID needed for uploading */
  stationId: string
  /** Initial title (used as default for uploaded file) */
  initialTitle?: string
}

/**
 * SongUploader
 *
 * Hybrid component that lets the admin either:
 *   1. Upload an MP3 file directly (drag & drop or click)
 *   2. Paste a URL manually (for files hosted elsewhere)
 *
 * When a file is uploaded successfully, the URL field is automatically
 * filled with the relative URL (e.g., /audios/song.mp3) and the duration
 * is auto-detected via ffprobe on the server.
 */
export function SongUploader({
  onUrlChange,
  onDurationChange,
  url,
  duration,
  onDurationChange2,
  stationId,
}: SongUploaderProps) {
  const [mode, setMode] = useState<UploadMode>('upload')
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedInfo, setUploadedInfo] = useState<{ name: string; size: number; duration: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // === Handle file upload ===
  const handleFile = useCallback(
    async (file: File) => {
      // Validate file type client-side
      const ext = file.name.split('.').pop()?.toLowerCase()
      const allowedExts = ['mp3', 'm4a', 'aac', 'ogg', 'wav', 'flac']
      if (!allowedExts.includes(ext || '')) {
        setStatus('error')
        setUploadError(`Formato no soportado: .${ext}. Permitidos: ${allowedExts.map((e) => '.' + e).join(', ')}`)
        return
      }

      // Validate file size (50 MB max)
      const maxSize = 50 * 1024 * 1024
      if (file.size > maxSize) {
        setStatus('error')
        setUploadError(`Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(1)} MB. Máximo: 50 MB`)
        return
      }

      setStatus('uploading')
      setUploadProgress(0)
      setUploadError(null)

      try {
        // Build FormData
        const formData = new FormData()
        formData.append('file', file)
        // Use file name (without extension) as default title
        const baseName = file.name.replace(/\.[^/.]+$/, '')
        formData.append('title', baseName)
        formData.append('artist', 'Artista desconocido')

        // Upload with XHR to track progress
        const result = await new Promise<UploadResult>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', `/api/stations/${stationId}/songs/upload`)
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100)
              setUploadProgress(pct)
            }
          }
          xhr.onload = () => {
            try {
              const data = JSON.parse(xhr.responseText)
              if (xhr.status >= 200 && xhr.status < 300 && data.song) {
                resolve({
                  url: data.song.audioUrl,
                  duration: data.song.duration,
                  fileName: data.file?.name || file.name,
                })
              } else {
                reject(new Error(data.error || `HTTP ${xhr.status}`))
              }
            } catch {
              reject(new Error('Respuesta del servidor inválida'))
            }
          }
          xhr.onerror = () => reject(new Error('Error de red durante la subida'))
          xhr.send(formData)
        })

        // Success!
        setStatus('success')
        setUploadedInfo({
          name: result.fileName,
          size: file.size,
          duration: result.duration,
        })
        onUrlChange(result.url)
        if (onDurationChange) onDurationChange(result.duration)
        onDurationChange2(result.duration)
      } catch (err: any) {
        setStatus('error')
        setUploadError(err?.message || 'No se pudo subir el archivo')
      }
    },
    [stationId, onUrlChange, onDurationChange, onDurationChange2]
  )

  // === Drag & drop handlers ===
  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile]
  )

  // === File input change ===
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
      // Reset input so the same file can be selected again
      e.target.value = ''
    },
    [handleFile]
  )

  // === Reset state ===
  const reset = useCallback(() => {
    setStatus('idle')
    setUploadProgress(0)
    setUploadError(null)
    setUploadedInfo(null)
    onUrlChange('')
  }, [onUrlChange])

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
      <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Audio de la canción *
        {url && (
          <span className="font-normal normal-case text-foreground/70">
            (configurado ✓)
          </span>
        )}
      </Label>

      {/* Mode tabs */}
      <div className="flex gap-1 rounded-md bg-secondary p-1">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            mode === 'upload' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <UploadCloud className="h-3 w-3" />
          Subir MP3
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            mode === 'url' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <LinkIcon className="h-3 w-3" />
          URL externa
        </button>
      </div>

      {/* Upload mode */}
      {mode === 'upload' && (
        <div>
          {status === 'idle' && (
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors',
                isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              )}
            >
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Arrastra tu MP3 aquí o haz clic para seleccionar
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Formatos: MP3, M4A, OGG, WAV, FLAC · Máx 50 MB
                </p>
              </div>
            </div>
          )}

          {status === 'uploading' && (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Subiendo archivo…</p>
                <p className="text-[10px] text-muted-foreground">{uploadProgress}% completado</p>
              </div>
              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {status === 'success' && uploadedInfo && (
            <div className="space-y-3 rounded-lg border border-green-300 bg-green-50 p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-900">¡Archivo subido correctamente!</p>
                  <p className="text-[11px] text-green-800 truncate font-mono">
                    {uploadedInfo.name}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-green-800">
                    <span>📊 {(uploadedInfo.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>⏱️ {formatTime(uploadedInfo.duration)} min</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="text-green-700 hover:text-green-900"
                  aria-label="Quitar archivo"
                  title="Quitar archivo y subir otro"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="rounded bg-white/60 px-2 py-1.5 font-mono text-[10px] text-green-900 truncate">
                {url}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">Error al subir el archivo</p>
                  <p className="text-[11px] text-red-800 mt-1">{uploadError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStatus('idle')
                    setUploadError(null)
                  }}
                  className="text-red-700 hover:text-red-900"
                  aria-label="Reintentar"
                  title="Reintentar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="h-3.5 w-3.5" />
                Seleccionar otro archivo
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/mp4,audio/m4a,audio/aac,audio/ogg,audio/wav,audio/flac,.mp3,.m4a,.aac,.ogg,.wav,.flac"
            onChange={handleInputChange}
            className="hidden"
          />

          {status === 'success' && (
            <p className="text-[10px] text-muted-foreground mt-2">
              💡 El archivo se guardó en el servidor. Ya puedes guardar la canción.
            </p>
          )}
        </div>
      )}

      {/* URL mode */}
      {mode === 'url' && (
        <UrlAudioTester url={url} onUrlChange={onUrlChange} />
      )}

      {/* Always show duration slider (so user can adjust) */}
      {url && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Duración (segundos)</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatTime(duration)} min
            </span>
          </div>
          <Slider
            value={[duration]}
            min={5}
            max={600}
            step={1}
            onValueChange={(v) => onDurationChange2(v[0])}
          />
        </div>
      )}
    </div>
  )
}
