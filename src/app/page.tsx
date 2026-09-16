'use client'

import { useEffect } from 'react'
import { useRadioStore } from '@/lib/radio-store'
import { StationCard } from '@/components/station-card'
import { StickyPlayer } from '@/components/sticky-player'
import { AdminPanel } from '@/components/admin-panel'
import { Button } from '@/components/ui/button'
import { Radio, Settings, Music2, Waves, Headphones } from 'lucide-react'

export default function Home() {
  const { stations, setStations, toggleAdmin, adminOpen } = useRadioStore()

  // Load stations on mount
  useEffect(() => {
    let cancelled = false
    fetch('/api/stations', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setStations(data.stations ?? [])
      })
      .catch((err) => {
        console.error('Failed to load stations:', err)
      })
    return () => {
      cancelled = true
    }
  }, [setStations])

  return (
    <main className="flex min-h-screen flex-col">
      {/* === Header === */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-500 opacity-90 blur-sm"
                aria-hidden="true"
              />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-500">
                <Radio className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-foreground">
                Neón <span className="text-primary neon-text">Radio</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Multi-station · 24/7
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden md:inline-flex" asChild>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="items-center gap-2"
              >
                <Waves className="h-3.5 w-3.5" />
                En vivo
              </a>
            </Button>
            <Button onClick={toggleAdmin} size="sm" variant={adminOpen ? 'default' : 'outline'}>
              <Settings className="h-3.5 w-3.5" />
              Administrar
            </Button>
          </div>
        </div>
      </header>

      {/* === Hero === */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-16">
        <div className="flex flex-col items-start gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="animate-live-pulse h-1.5 w-1.5 rounded-full bg-primary" />
            Transmisión automática 24/7
          </span>
          <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Sintoniza, escucha y{' '}
            <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
              administra
            </span>{' '}
            tu radio online
          </h2>
          <p className="max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
            Varias emisoras, cada una transmitiendo música en su propio idioma.
            Tú decides qué suena en cada una — agrega, reordena o elimina canciones
            cuando quieras, y todos los oyentes escucharán lo mismo al mismo tiempo.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Music2 className="h-3.5 w-3.5 text-primary" />
              {stations.length} emisoras
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Headphones className="h-3.5 w-3.5 text-primary" />
              {stations.reduce((sum, s) => sum + s._count.songs, 0)} canciones en total
            </span>
          </div>
        </div>
      </section>

      {/* === Stations grid === */}
      <section className="mx-auto w-full max-w-7xl flex-1 px-4 pb-40 md:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Emisoras disponibles
          </h3>
          <span className="text-xs text-muted-foreground">
            Toca una para sintonizar
          </span>
        </div>

        {stations.length === 0 ? (
          <EmptyState onOpenAdmin={toggleAdmin} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stations.map((station) => (
              <StationCard key={station.id} station={station} />
            ))}
          </div>
        )}

        {/* Educational note about how it works */}
        <div className="mt-12 rounded-xl border border-white/5 bg-card/40 p-5 text-sm text-muted-foreground">
          <h4 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
            <Waves className="h-4 w-4 text-primary" />
            ¿Cómo funciona?
          </h4>
          <p className="leading-relaxed">
            Cada emisora reproduce su lista de canciones en bucle, calculada desde
            un punto de partida fijo. Todos los oyentes que se conecten al mismo
            tiempo escucharán la misma canción, como una radio tradicional.
            Desde el panel <strong className="text-foreground">Administrar</strong>
            puedes crear emisoras nuevas, agregar canciones (URL directa a MP3/M4A/OGG),
            reordenarlas y eliminarlas — los cambios se reflejan en vivo.
          </p>
        </div>
      </section>

      {/* === Footer === */}
      <footer className="mt-auto border-t border-white/5 bg-background/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row md:px-6">
          <p>
            <span className="font-semibold text-foreground">Neón Radio</span>
            {' — '}
            Plataforma de radio online multi-emisora
          </p>
          <p>Hecho con Next.js · Prisma · Tailwind CSS</p>
        </div>
      </footer>

      {/* === Floating components === */}
      <StickyPlayer />
      <AdminPanel />
    </main>
  )
}

function EmptyState({ onOpenAdmin }: { onOpenAdmin: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/10 p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Radio className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">No hay emisoras todavía</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Crea tu primera emisora desde el panel de administración para empezar a transmitir.
        </p>
      </div>
      <Button onClick={onOpenAdmin}>
        <Settings className="h-4 w-4" />
        Crear emisora
      </Button>
    </div>
  )
}
