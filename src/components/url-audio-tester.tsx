'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  ExternalLink,
} from 'lucide-react'

type Status = 'idle' | 'checking' | 'ok' | 'warning' | 'error'

interface Result {
  status: Status
  contentType?: string
  cors?: string | null
  acceptRanges?: string | null
  sizeBytes?: number
  httpStatus?: number
  message: string
  details?: string[]
}

/**
 * UrlAudioTester
 *
 * A self-contained widget that lets the user paste an audio URL and verify
 * whether it will work in the radio player before adding it as a song.
 *
 * It performs a HEAD/GET request from the browser (so CORS actually matters
 * here — which is exactly what we want to test).
 */
export function UrlAudioTester({
  url,
  onUrlChange,
}: {
  url: string
  onUrlChange: (url: string) => void
}) {
  const [result, setResult] = useState<Result>({ status: 'idle', message: '' })

  const runTest = async () => {
    if (!url.trim()) {
      setResult({ status: 'error', message: 'Pega una URL primero' })
      return
    }

    setResult({ status: 'checking', message: 'Verificando…' })

    try {
      // Basic URL validation
      let parsedUrl: URL
      try {
        parsedUrl = new URL(url.trim())
      } catch {
        setResult({
          status: 'error',
          message: 'URL mal formada — debe incluir https://',
          details: ['Ejemplo correcto: https://miservidor.com/cancion.mp3'],
        })
        return
      }

      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
        setResult({
          status: 'error',
          message: 'Solo se permiten URLs http:// o https://',
        })
        return
      }

      // Check extension
      const hasAudioExt = /\.(mp3|m4a|aac|ogg|wav|flac)$/i.test(parsedUrl.pathname)
      if (!hasAudioExt) {
        // Detect well-known services that DON'T provide direct audio URLs
        const host = parsedUrl.hostname.toLowerCase()
        const knownBadServices: Record<string, string> = {
          'youtube.com': 'YouTube NO permite URLs directas a MP3. Debes descargar el audio y subirlo a un hosting.',
          'youtu.be': 'YouTube NO permite URLs directas a MP3. Debes descargar el audio y subirlo a un hosting.',
          'spotify.com': 'Spotify usa DRM y NO permite URLs directas a MP3.',
          'open.spotify.com': 'Spotify usa DRM y NO permite URLs directas a MP3.',
          'drive.google.com': 'Google Drive NO permite hotlinking. Las URLs cambian y requieren login.',
          'dropbox.com': 'Dropbox bloquea el hotlinking en el plan gratis. Usa dl.dropboxusercontent.com o sube a otro servicio.',
          'soundcloud.com': 'SoundCloud NO da URLs directas a MP3 (solo streaming embebido).',
          'apple.com': 'Apple Music usa DRM y NO permite URLs directas.',
          'music.apple.com': 'Apple Music usa DRM y NO permite URLs directas.',
          'mega.nz': 'Mega bloquea descargas automáticas.',
          'mediafire.com': 'MediaFire muestra páginas intersticiales, no da URLs directas.',
          'onedrive.live.com': 'OneDrive bloquea hotlinking.',
        }
        for (const [badHost, reason] of Object.entries(knownBadServices)) {
          if (host === badHost || host.endsWith('.' + badHost)) {
            setResult({
              status: 'error',
              message: `Esta URL es de ${badHost} — NO funcionará`,
              details: [
                reason,
                '',
                'Servicios que SÍ funcionan:',
                '• Internet Archive (archive.org)',
                '• Netlify (netlify.com)',
                '• Vercel (vercel.com)',
                '• GitHub Pages (github.io)',
                '• Cloudflare R2 (r2.dev)',
                '• Tu propio hosting con URL directa al MP3',
              ],
            })
            return
          }
        }
        // Generic warning for unknown URLs without audio extension
        setResult({
          status: 'warning',
          message: 'La URL no termina en .mp3/.m4a/.ogg/.wav',
          details: [
            'Si es Google Drive, Dropbox, YouTube, Spotify, etc., NO funcionará.',
            'Necesitas la URL directa al archivo de audio.',
          ],
        })
        // Still attempt the fetch to give more info
      }

      // Attempt fetch
      // Note: this fetch may fail due to CORS, but that does NOT mean the audio
      // won't play. The HTML5 <audio> element doesn't require CORS for basic
      // playback — it only requires CORS if you want to read the audio data
      // (e.g., for a Web Audio API visualizer). So we treat a CORS failure as
      // a "could not verify, try opening manually" rather than a hard error.
      let res: Response
      try {
        res = await fetch(url.trim(), {
          method: 'GET',
          mode: 'cors',
          headers: { Range: 'bytes=0-0' },
        })
      } catch (fetchErr: any) {
        // Network-level error — could be CORS blocking, DNS failure, or server unreachable
        setResult({
          status: 'warning',
          message: 'No se pudo verificar desde el navegador (posible CORS)',
          details: [
            `Error: ${fetchErr?.message || 'Failed to fetch'}`,
            '',
            'Esto NO significa necesariamente que el audio no funcione.',
            'El reproductor de Euro Voice usa <audio> HTML5 que no requiere CORS.',
            '',
            '👉 Prueba abrir la URL en una pestaña nueva:',
            '   • Si se reproduce el audio → funcionará en Euro Voice',
            '   • Si ves una página web o error → NO es una URL directa al MP3',
          ],
        })
        return
      }

      const contentType = res.headers.get('content-type') || ''
      const corsHeader = res.headers.get('access-control-allow-origin')
      const acceptRanges = res.headers.get('accept-ranges')
      const contentLength = res.headers.get('content-length')

      const details: string[] = []
      details.push(`HTTP: ${res.status} ${res.statusText}`)
      details.push(`Content-Type: ${contentType || '(no especificado)'}`)
      details.push(`CORS: ${corsHeader || 'no detectado'}`)
      details.push(`Seek: ${acceptRanges === 'bytes' ? 'sí' : 'no'}`)
      if (contentLength) {
        const mb = (parseInt(contentLength, 10) / 1024 / 1024).toFixed(2)
        details.push(`Tamaño: ${mb} MB`)
      }

      if (res.status === 401 || res.status === 403) {
        setResult({
          status: 'error',
          message: 'La URL requiere login — no funcionará en la radio',
          details,
        })
        return
      }

      if (res.status === 404) {
        setResult({
          status: 'error',
          message: 'Archivo no encontrado — la URL es incorrecta o fue borrado',
          details,
        })
        return
      }

      if (res.status >= 400) {
        setResult({
          status: 'error',
          message: `Error HTTP ${res.status} — la URL no es accesible`,
          details,
        })
        return
      }

      const audioTypes = ['audio/', 'application/octet-stream', 'binary/octet-stream']
      if (!audioTypes.some((t) => contentType.toLowerCase().startsWith(t))) {
        setResult({
          status: 'error',
          message: 'No es un archivo de audio — probablemente es una página HTML',
          details: [
            ...details,
            'Esto pasa con Google Drive, Dropbox, YouTube, Spotify, etc.',
            'Necesitas la URL DIRECTA al archivo .mp3',
          ],
        })
        return
      }

      if (!corsHeader) {
        setResult({
          status: 'warning',
          message: 'El audio es válido pero CORS no está habilitado',
          details: [
            ...details,
            '⚠️ El navegador podría bloquear la reproducción desde Euro Voice.',
            'Servicios CON CORS: Internet Archive, Netlify, Vercel, GitHub Pages, Cloudflare R2',
            'Servicios SIN CORS: Google Drive, Dropbox, algunos hosting compartidos',
          ],
        })
        return
      }

      setResult({
        status: 'ok',
        message: '¡La URL funciona! Puedes agregar esta canción',
        details,
      })
    } catch (err: any) {
      setResult({
        status: 'error',
        message: `Error de red: ${err?.message || 'desconocido'}`,
        details: [
          'Posibles causas:',
          '• El dominio no existe o no responde',
          '• CORS bloqueado completamente por el servidor',
          '• El archivo no existe',
        ],
      })
    }
  }

  const playTest = () => {
    // Open the URL in a new tab so the user can hear it themselves
    if (url.trim()) {
      window.open(url.trim(), '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-secondary/30 p-3">
      <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        URL del audio *
        <span className="font-normal normal-case text-foreground/70">
          (verifícala antes de guardar)
        </span>
      </Label>
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://miservidor.com/cancion.mp3"
          type="url"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={runTest}
          disabled={result.status === 'checking' || !url.trim()}
        >
          {result.status === 'checking' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            'Verificar'
          )}
        </Button>
      </div>

      {result.status === 'ok' && (
        <div className="rounded-md bg-green-50 border border-green-200 p-2 text-xs">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-900">{result.message}</p>
              {result.details && (
                <ul className="mt-1 space-y-0.5 text-green-800">
                  {result.details.map((d, i) => (
                    <li key={i} className="font-mono text-[10px]">{d}</li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={playTest}
                className="mt-2 inline-flex items-center gap-1 text-green-700 hover:text-green-900 underline"
              >
                <Play className="h-3 w-3" />
                Escuchar muestra
              </button>
            </div>
          </div>
        </div>
      )}

      {result.status === 'warning' && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-2 text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-900">{result.message}</p>
              {result.details && (
                <ul className="mt-1 space-y-0.5 text-amber-800">
                  {result.details.map((d, i) => (
                    <li key={i} className="text-[10px]">{d}</li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={playTest}
                className="mt-2 inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 underline"
              >
                <ExternalLink className="h-3 w-3" />
                Abrir URL en nueva pestaña
              </button>
            </div>
          </div>
        </div>
      )}

      {result.status === 'error' && (
        <div className="rounded-md bg-red-50 border border-red-200 p-2 text-xs">
          <div className="flex items-start gap-2">
            <XCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">{result.message}</p>
              {result.details && (
                <ul className="mt-1 space-y-0.5 text-red-800">
                  {result.details.map((d, i) => (
                    <li key={i} className="text-[10px]">{d}</li>
                  ))}
                </ul>
              )}
              {url.trim() && (
                <button
                  type="button"
                  onClick={playTest}
                  className="mt-2 inline-flex items-center gap-1 text-red-700 hover:text-red-900 underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir URL en nueva pestaña
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {result.status === 'idle' && (
        <p className="text-[10px] text-muted-foreground">
          💡 Pega la URL y haz clic en "Verificar" antes de guardar. La URL debe ser
          directa al archivo .mp3 (no a una página como Google Drive o YouTube).
        </p>
      )}
    </div>
  )
}
