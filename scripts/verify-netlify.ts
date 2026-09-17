/**
 * Verifica que el sitio de Netlify ya es público y encuentra el MP3
 *
 * Uso:
 *   bun /home/z/my-project/scripts/verify-netlify.ts
 */

const NETLIFY_BASE = 'https://dapper-marshmallow-482900.netlify.app'

// Posibles nombres del archivo MP3
const POSSIBLE_PATHS = [
  // Sin subcarpeta (archivo suelto en la raíz)
  'kautkaili-piestav-tev.mp3',
  'Kautkaili-piestav-tev.mp3',
  'Kautkaili%20-%20Piest%C4%81v%20tev.mp3',
  'Kautkaili - Piestāv tev.mp3',
  // Con subcarpeta "audios"
  'audios/kautkaili-piestav-tev.mp3',
  'audios/Kautkaili-piestav-tev.mp3',
  // Con subcarpeta "audio"
  'audio/kautkaili-piestav-tev.mp3',
  // Variantes comunes
  'kautkaili_piestav_tev.mp3',
  'Kautkaili_Piestav_tev.mp3',
]

async function checkUrl(url: string): Promise<{ ok: boolean; status: number; contentType: string; contentLength?: string; isAudio: boolean }> {
  try {
    const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, signal: AbortSignal.timeout(10000) })
    const contentType = res.headers.get('content-type') || ''
    const contentLength = res.headers.get('content-length') || undefined
    const isAudio = contentType.startsWith('audio/') || contentType.includes('octet-stream')
    return {
      ok: res.status === 200 || res.status === 206,
      status: res.status,
      contentType,
      contentLength,
      isAudio,
    }
  } catch (err: any) {
    return { ok: false, status: 0, contentType: '', isAudio: false }
  }
}

console.log(`\n🌐 Verificando sitio: ${NETLIFY_BASE}\n${'═'.repeat(70)}\n`)

// === Test 1: ¿El sitio es público? ===
console.log('Test 1: ¿El sitio es público?\n')
const homeCheck = await checkUrl(NETLIFY_BASE + '/')
if (homeCheck.status === 401) {
  console.log('❌ El sitio sigue protegido por contraseña (HTTP 401)')
  console.log('   Necesitas desactivar "Password Protection" en Netlify:')
  console.log('   Site configuration → Settings → Password protection → OFF')
  console.log('\n   Después de desactivarlo, vuelve a ejecutar este script.')
  process.exit(1)
}
if (homeCheck.status === 404) {
  console.log('⚠️  La página principal devuelve 404 (no hay index.html)')
  console.log('   Esto NO es problema — solo significa que no creaste index.html.')
  console.log('   El MP3 puede estar disponible igualmente.\n')
} else if (homeCheck.ok) {
  console.log(`✅ Sitio público (HTTP ${homeCheck.status})\n`)
} else {
  console.log(`⚠️  Estado inesperado: ${homeCheck.status}\n`)
}

// === Test 2: Buscar el MP3 ===
console.log('Test 2: Buscando el archivo MP3...\n')

let foundUrl: string | null = null
for (const path of POSSIBLE_PATHS) {
  const url = `${NETLIFY_BASE}/${path}`
  const result = await checkUrl(url)
  const decoded = decodeURIComponent(path)

  if (result.ok && result.isAudio) {
    console.log(`✅ ¡ENCONTRADO! ${decoded}`)
    console.log(`   URL: ${url}`)
    console.log(`   HTTP: ${result.status}`)
    console.log(`   Content-Type: ${result.contentType}`)
    if (result.contentLength) {
      const mb = (parseInt(result.contentLength, 10) / 1024 / 1024).toFixed(2)
      console.log(`   Tamaño: ${mb} MB`)
    }
    console.log('')
    foundUrl = url
    break
  } else if (result.ok && !result.isAudio) {
    console.log(`⚠️  Existe pero no es audio: ${decoded} (${result.contentType})`)
  } else if (result.status === 404) {
    console.log(`❌ 404: ${decoded}`)
  } else if (result.status === 401) {
    console.log(`🔒 401 (sitio protegido): ${decoded}`)
    break // no tiene sentido seguir probando
  } else {
    console.log(`❓ HTTP ${result.status}: ${decoded}`)
  }
}

console.log(`\n${'═'.repeat(70)}`)
if (foundUrl) {
  console.log(`\n🎉 ¡URL ENCONTRADA Y FUNCIONANDO!\n`)
  console.log(`   ${foundUrl}\n`)
  console.log(`Esta URL se puede usar en Euro Voice.`)
} else {
  console.log(`\n⚠️  No se encontró el MP3 en las ubicaciones probadas.`)
  console.log(`\nPosibles causas:`)
  console.log(`   • El archivo tiene un nombre diferente`)
  console.log(`   • Está en una subcarpeta con otro nombre`)
  console.log(`   • El sitio sigue protegido (401)`)
  console.log(`\nNecesito que me digas:`)
  console.log(`   • ¿Cómo nombraste el archivo MP3 exactamente al subirlo?`)
  console.log(`   • ¿Está en una subcarpeta? ¿Cómo se llama la carpeta?`)
}

export {}
