/**
 * Busca el MP3 en el sitio de Netlify probando varias ubicaciones y nombres
 */

const BASE_URL = 'https://euro-voice.netlify.app'

// Nombres de subcarpetas comunes
const SUBFOLDERS = [
  '',
  'audios',
  'audio',
  'music',
  'musica',
  'mp3',
  'songs',
  'canciones',
]

// Nombres de archivo posibles (variaciones)
const FILENAMES = [
  'Kautkaili%20-%20Piest%C4%81v%20tev.mp3',
  'kautkaili-piestav-tev.mp3',
  'Kautkaili-piestav-tev.mp3',
  'cancion-nueva.mp3',
  'cancion-1.mp3',
  'cancion-2.mp3',
  'nueva-cancion.mp3',
  'cancion.mp3',
  'audio-1.mp3',
  'audio.mp3',
  'track-1.mp3',
  'track.mp3',
  'song-1.mp3',
  'song.mp3',
]

console.log(`\n🔍 Buscando MP3 en ${BASE_URL}\n${'═'.repeat(70)}\n`)

let foundUrl: string | null = null

for (const folder of SUBFOLDERS) {
  for (const filename of FILENAMES) {
    const url = folder
      ? `${BASE_URL}/${folder}/${filename}`
      : `${BASE_URL}/${filename}`

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        signal: AbortSignal.timeout(8000),
      })

      if (res.status === 200 || res.status === 206) {
        const contentType = res.headers.get('content-type') || ''
        const isAudio = contentType.startsWith('audio/') || contentType.includes('octet-stream')
        if (isAudio) {
          console.log(`✅ ¡ENCONTRADO! ${decodeURIComponent(url)}`)
          console.log(`   HTTP: ${res.status} · ${contentType}`)
          foundUrl = url
          break
        }
      }
    } catch {
      // timeout, ignore
    }
  }
  if (foundUrl) break
}

console.log(`\n${'═'.repeat(70)}`)
if (foundUrl) {
  console.log(`\n🎉 ¡MP3 ENCONTRADO!\n`)
  console.log(`   ${foundUrl}\n`)
} else {
  console.log(`\n❌ No se encontró el MP3 automáticamente.`)
  console.log(`\nNecesito que me digas:`)
  console.log(`   1. ¿Cómo nombraste el archivo MP3 al subirlo?`)
  console.log(`   2. ¿Está en una subcarpeta? ¿Cómo se llama?`)
}

export {}
