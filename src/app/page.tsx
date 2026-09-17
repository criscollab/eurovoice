'use client'

import { useEffect } from 'react'
import { useRadioStore } from '@/lib/radio-store'
import { StationCard } from '@/components/station-card'
import { StickyPlayer } from '@/components/sticky-player'
import { AdminPanel } from '@/components/admin-panel'
import { UserMenu } from '@/components/user-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Radio, Music2, Headphones, Waves, Globe2 } from 'lucide-react'

export default function Home() {
  const { stations, setStations } = useRadioStore()

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

  const totalSongs = stations.reduce((sum, s) => sum + s._count.songs, 0)
  const totalLanguages = new Set(stations.map((s) => s.language)).size

  return (
    <main className="flex min-h-screen flex-col">
      {/* === Header === */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 opacity-30 blur-sm"
                aria-hidden="true"
              />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-md">
                <Radio className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-foreground">
                Euro <span className="text-primary">Voice</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Radio · Multi-emisora · 24/7
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* === Hero === */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-16">
        <div className="flex flex-col items-start gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="animate-live-pulse h-1.5 w-1.5 rounded-full bg-primary" />
            Música en vivo 24/7
          </span>
          <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Sintoniza y{' '}
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              disfruta
            </span>{' '}
            tu radio online
          </h2>
          <p className="max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
            Varias emisoras en distintos idiomas transmitiendo música en vivo,
            las 24 horas. Escucha cuando quieras, donde quieras — elige una
            emisora, salta entre canciones, repite tus favoritas y arma tu
            propia experiencia.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Music2 className="h-3.5 w-3.5 text-primary" />
              {stations.length} emisoras disponibles
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Headphones className="h-3.5 w-3.5 text-primary" />
              {totalSongs} canciones en programación
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5 text-primary" />
              {totalLanguages} {totalLanguages === 1 ? 'idioma' : 'idiomas'}
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
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stations.map((station) => (
              <StationCard key={station.id} station={station} />
            ))}
          </div>
        )}

        {/* Educational note about how it works */}
        <div className="mt-12 rounded-xl border border-border/60 bg-card/60 p-5 text-sm text-muted-foreground">
          <h4 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
            <Waves className="h-4 w-4 text-primary" />
            ¿Cómo funciona?
          </h4>
          <p className="leading-relaxed">
            Cada emisora reproduce su lista de canciones en bucle, transmitiendo
            sin interrupciones, día y noche. Todos los oyentes que se conecten al
            mismo momento escuchan la misma canción, como en una radio
            tradicional. Elige la emisora que más te guste, dale play, y listo —
            música sin parar.
          </p>
        </div>
      </section>

      {/* === Footer === */}
      <footer className="mt-auto border-t border-border/60 bg-card/40 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row md:px-6">
          <p>
            <span className="font-semibold text-foreground">Euro Voice</span>
            {' — '}
            Radio online multi-emisora 24/7
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/60 p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Radio className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">No hay emisoras disponibles</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Vuelve más tarde — pronto habrá nuevas emisoras para sintonizar.
        </p>
      </div>
    </div>
  )
}
