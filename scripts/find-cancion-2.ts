/**
 * Busca cancion-2.mp3 en todas las subcarpetas posibles
 */

const BASE_URL = 'https://euro-voice.netlify.app'
const FILENAME = 'cancion-2.mp3'

// Subcarpetas comunes que el usuario podría haber usado
const SUBFOLDERS = [
  // Sin subcarpeta
  '',
  // Nombres genéricos
  'audios',
  'audio',
  'music',
  'musica',
  'mp3',
  'songs',
  'canciones',
  'cancion',
  'canciones-mp3',
  'media',
  'files',
  // Nombres relacionados con la emisora
  'letonia',
  'latvia',
  'latvian',
  'musica-letonia',
  'euro-voice',
  'eurovoice',
  // Nombres genéricos de carpetas que el usuario pudo haber creado
  'audio-files',
  'mp3-files',
  'mis-audios',
  'mis-canciones',
  'nueva-cancion',
  'nueva',
  'new',
  'upload',
  'uploads',
  'public',
  'static',
  // Posibles variantes
  'Audios',
  'Audio',
  'Music',
  'Musica',
  'MP3',
  'Songs',
  'Canciones',
]

console.log(`\n🔍 Buscando ${FILENAME} en ${BASE_URL}\n${'═'.repeat(70)}\n`)

let foundUrl: string | null = null

for (const folder of SUBFOLDERS) {
  const url = folder
    ? `${BASE_URL}/${folder}/${FILENAME}`
    : `${BASE_URL}/${FILENAME}`

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
      signal: AbortSignal.timeout(5000),
    })

    if (res.status === 200 || res.status === 206) {
      const contentType = res.headers.get('content-type') || ''
      const isAudio = contentType.startsWith('audio/') || contentType.includes('octet-stream')
      if (isAudio) {
        console.log(`✅ ¡ENCONTRADO! ${decodeURIComponent(url)}`)
        console.log(`   HTTP: ${res.status} · ${contentType}`)
        const contentLength = res.headers.get('content-length') || ''
        if (contentLength) {
          const mb = (parseInt(contentLength, 10) / 1024 / 1024).toFixed(2)
          console.log(`   Tamaño: ${mb} MB`)
        }
        foundUrl = url
        break
      }
    } else if (res.status !== 404) {
      console.log(`❓ HTTP ${res.status}: ${folder || '(raíz)'}`)
    }
  } catch {
    // timeout
  }
}

console.log(`\n${'═'.repeat(70)}`)
if (foundUrl) {
  console.log(`\n🎉 ¡MP3 ENCONTRADO!\n`)
  console.log(`   ${foundUrl}\n`)
} else {
  console.log(`\n❌ No se encontró en las carpetas probadas.`)
  console.log(`\nNecesito que me digas: ¿cómo se llamaba la carpeta`)
  console.log(`   en la que estaba cancion-2.mp3?`)
}

export {}
