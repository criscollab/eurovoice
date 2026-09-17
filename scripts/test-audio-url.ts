/**
 * Test URL — Verifica si una URL de audio es válida para Euro Voice
 *
 * Uso:
 *   bun /home/z/my-project/scripts/test-audio-url.ts "https://example.com/song.mp3"
 *
 * Comprueba:
 *   1. La URL resuelve (HTTP HEAD/GET)
 *   2. Devuelve audio (Content-Type correcto)
 *   3. Soporta CORS (Access-Control-Allow-Origin)
 *   4. Soporta rangos (Accept-Ranges: bytes) — para seek
 *   5. Es accesible sin autenticación
 */

const url = process.argv[2]

if (!url) {
  console.error('Uso: bun test-audio-url.ts <url>')
  process.exit(1)
}

console.log(`\n🎵 Probando URL: ${url}\n${'─'.repeat(60)}\n`)

// === Test 1: URL válida ===
let parsedUrl: URL
try {
  parsedUrl = new URL(url)
  console.log('✅ URL bien formada')
  console.log(`   Protocolo: ${parsedUrl.protocol}`)
  console.log(`   Dominio: ${parsedUrl.hostname}`)
  console.log(`   Ruta: ${parsedUrl.pathname}`)
} catch (e) {
  console.error('❌ URL mal formada — revisa que incluya https://')
  process.exit(1)
}

if (parsedUrl.protocol !== 'https:') {
  console.warn('⚠️  No es HTTPS — algunos navegadores pueden bloquearla')
}

if (!parsedUrl.pathname.match(/\.(mp3|m4a|aac|ogg|wav|flac)$/i)) {
  console.warn('⚠️  La URL no termina en .mp3/.m4a/.ogg/.wav')
  console.warn('   Si es una página web (no un archivo de audio), NO funcionará.')
}

// === Test 2: HTTP HEAD request ===
console.log(`\n📡 Haciendo petición HTTP...\n`)

fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } })
  .then(async (res) => {
    console.log(`HTTP Status: ${res.status} ${res.statusText}`)

    if (res.status === 401 || res.status === 403) {
      console.error('❌ La URL requiere autenticación — NO funcionará en Euro Voice')
      console.error('   Debes usar una URL pública sin login.')
      process.exit(1)
    }

    if (res.status === 404) {
      console.error('❌ Archivo no encontrado — la URL es incorrecta o fue borrado')
      process.exit(1)
    }

    if (res.status >= 400) {
      console.error(`❌ Error HTTP ${res.status} — la URL no es accesible`)
      process.exit(1)
    }

    // === Test 3: Content-Type ===
    const contentType = res.headers.get('content-type') || ''
    console.log(`Content-Type: ${contentType || '(no especificado)'}`)

    const audioTypes = ['audio/', 'application/octet-stream', 'binary/octet-stream']
    if (!audioTypes.some((t) => contentType.toLowerCase().startsWith(t))) {
      console.error('❌ El Content-Type no es de audio — probablemente es una página HTML')
      console.error('   Esto significa que NO es una URL directa al archivo MP3.')
      console.error('   Si es Google Drive, Dropbox, YouTube, Spotify, etc., NO funcionará.')
      process.exit(1)
    }
    console.log('✅ Content-Type correcto — es un archivo de audio')

    // === Test 4: CORS ===
    const corsHeader = res.headers.get('access-control-allow-origin')
    if (corsHeader) {
      console.log(`✅ CORS habilitado: ${corsHeader}`)
    } else {
      console.warn('⚠️  CORS no detectado en respuesta del servidor')
      console.warn('   El navegador podría bloquear la reproducción desde Euro Voice.')
      console.warn('   Servicios conocidos SIN CORS: Google Drive, algunos hosting compartidos.')
      console.warn('   Servicios CON CORS: Internet Archive, Netlify, Vercel, GitHub Pages, Cloudflare R2.')
    }

    // === Test 5: Accept-Ranges (para seek) ===
    const acceptRanges = res.headers.get('accept-ranges')
    if (acceptRanges === 'bytes') {
      console.log('✅ Soporta seek (Accept-Ranges: bytes)')
    } else {
      console.warn('⚠️  No soporta seek — los oyentes no podrán adelantar la canción')
    }

    // === Test 6: Content-Length ===
    const contentLength = res.headers.get('content-length')
    if (contentLength) {
      const bytes = parseInt(contentLength, 10)
      const mb = (bytes / 1024 / 1024).toFixed(2)
      console.log(`✅ Tamaño del archivo: ${mb} MB`)
    }

    console.log(`\n${'─'.repeat(60)}`)
    console.log('✅ RESULTADO: La URL DEBERÍA funcionar en Euro Voice.\n')
    console.log('Si aún así no se reproduce, posible causa:')
    console.log('  • El navegador bloquea autoplay (debe haber interacción del usuario)')
    console.log('  • El archivo de audio está corrupto o mal codificado')
    console.log('  • Hay un firewall/proxy bloqueando el dominio')
  })
  .catch((err) => {
    console.error(`\n❌ Error de red: ${err.message}`)
    console.error('   Posibles causas:')
    console.error('   • El dominio no existe')
    console.error('   • No hay conexión a internet')
    console.error('   • El servidor rechazó la conexión')
    process.exit(1)
  })
