/**
 * Prueba varias URLs del mismo archivo en Internet Archive para encontrar la correcta.
 * Internet Archive mantiene el nombre original del archivo subido, pero a veces
 * genera versiones derivadas (VBR MP3, OGG, etc.).
 *
 * El usuario subió un archivo llamado "Kautkaili - Piestāv tev" con espacios y
 * el carácter especial ā. La URL necesita codificación URL:
 *   Espacio → %20
 *   ā → %C4%81
 */

const IDENTIFIER = 'Kautkaili-piestav-tev'

const possibleFilenames = [
  // Variantes del nombre original (lo más probable)
  'Kautkaili%20-%20Piest%C4%81v%20tev.mp3',
  'Kautkaili_-_Piest%C4%81v_tev.mp3',
  'Kautkaili%20-%20Piestav%20tev.mp3',
  'Kautkaili_-_Piestav_tev.mp3',
  // Variantes con el identifier (si IA normalizó el nombre)
  'Kautkaili-piestav-tev.mp3',
  'Kautkaili_piestav_tev.mp3',
  // Versiones derivadas que IA suele generar
  'Kautkaili%20-%20Piest%C4%81v%20tev_vbr.mp3',
  'Kautkaili-piestav-tev_vbr.mp3',
]

const urls = possibleFilenames.map((f) => `https://archive.org/download/${IDENTIFIER}/${f}`)

console.log(`\n🎵 Probando ${urls.length} URLs posibles...\n`)
console.log(`Identifier: ${IDENTIFIER}`)
console.log(`Nombre original del archivo: Kautkaili - Piestāv tev`)
console.log('═'.repeat(70))

let workingUrl: string | null = null

for (const url of urls) {
  process.stdout.write(`\nProbando: ${decodeURIComponent(url.replace(/^.*\//, ''))}\n`)
  process.stdout.write(`URL: ${url}\n`)

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
      signal: AbortSignal.timeout(15000),
    })

    const contentType = res.headers.get('content-type') || ''
    const contentLength = res.headers.get('content-length') || '?'

    if (res.status === 200 || res.status === 206) {
      const isAudio = contentType.startsWith('audio/') || contentType.includes('octet-stream')
      if (isAudio) {
        console.log(`✅ ¡FUNCIONA! HTTP ${res.status} · ${contentType} · ${contentLength} bytes`)
        workingUrl = url
        break
      } else {
        console.log(`⚠️  HTTP ${res.status} pero no es audio: ${contentType}`)
      }
    } else if (res.status === 404) {
      console.log(`❌ 404 — no existe este archivo`)
    } else if (res.status === 401 || res.status === 403) {
      console.log(`❌ ${res.status} — requiere autenticación`)
    } else {
      console.log(`❓ HTTP ${res.status} ${res.statusText}`)
    }
  } catch (err: any) {
    if (err?.name === 'TimeoutError') {
      console.log(`⏱️  Timeout (15s) — IA no responde para esta URL`)
    } else {
      console.log(`❌ Error: ${err?.message || 'desconocido'}`)
    }
  }
}

console.log('\n' + '═'.repeat(70))
if (workingUrl) {
  console.log(`\n✅ URL CORRECTA ENCONTRADA:\n`)
  console.log(`   ${workingUrl}\n`)
  console.log(`\nURL decodificada (legible): ${decodeURIComponent(workingUrl)}\n`)
} else {
  console.log(`\n⚠️  Ninguna URL funcionó desde este servidor.`)
  console.log(`   Posibles razones:`)
  console.log(`   • Internet Archive está bloqueando este servidor`)
  console.log(`   • El nombre del archivo es diferente a todas las variantes probadas`)
  console.log(`   • El archivo aún se está procesando en IA`)
  console.log(`\n   El usuario debe verificar manualmente en:`)
  console.log(`   https://archive.org/details/${IDENTIFIER}`)
}

export {}
