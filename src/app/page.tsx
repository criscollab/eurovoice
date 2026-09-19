'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRadioStore } from '@/lib/radio-store'
import { StationCard } from '@/components/station-card'
import { StickyPlayer } from '@/components/sticky-player'
import { AdminPanel } from '@/components/admin-panel'
import { UserMenu } from '@/components/user-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { AboutDialog } from '@/components/about-dialog'
import { SearchBar } from '@/components/search-bar'
import { SupportDialog } from '@/components/support-dialog'
import { StillListeningPrompt } from '@/components/still-listening-prompt'
import { LanguageSelector } from '@/components/language-selector'
import { Button } from '@/components/ui/button'
import { Radio, Music2, Headphones, Waves, Globe2, Info, Heart, SearchX } from 'lucide-react'

export default function Home() {
  const { stations, setStations } = useRadioStore()
  const [aboutOpen, setAboutOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [matchingStationIds, setMatchingStationIds] = useState<string[] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleSearchResults = useCallback(
    (stationIds: string[] | null, query: string) => {
      setMatchingStationIds(stationIds)
      setSearchQuery(query)
    },
    []
  )

  // Filter stations based on search results.
  // matchingStationIds === null → no active search → show all
  // matchingStationIds === []   → search active with no matches → show empty state
  const filteredStations =
    matchingStationIds === null
      ? stations
      : stations.filter((s) => matchingStationIds.includes(s.id))

  const totalSongs = stations.reduce((sum, s) => sum + s._count.songs, 0)
  const totalLanguages = new Set(stations.map((s) => s.language)).size

  return (
    <main className="flex min-h-screen flex-col">
      {/* === Header === */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2 md:gap-4 md:px-6 md:py-3">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Logo */}
            <div className="relative flex h-8 w-8 items-center justify-center md:h-10 md:w-10">
              <div
                className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 opacity-30 blur-sm md:rounded-xl"
                aria-hidden="true"
              />
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-md md:h-10 md:w-10 md:rounded-xl">
                <Radio className="h-4 w-4 text-white md:h-5 md:w-5" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-foreground md:text-lg">
                Euro <span className="text-primary">Voice</span>
              </h1>
              <p className="hidden md:block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Radio · Multi-emisora · 24/7
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Support button — icon only on mobile, full label on sm+ */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSupportOpen(true)}
              className="gap-1.5 rounded-full text-pink-500 hover:bg-pink-500/10 hover:text-pink-500"
              aria-label="Apoya Euro Voice"
            >
              <Heart className="h-4 w-4 fill-current" />
              <span className="hidden sm:inline">Apoya</span>
            </Button>
            <LanguageSelector />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* === Hero === */}
      <section className="mx-auto w-full max-w-7xl px-3 py-6 md:px-6 md:py-16">
        <div className="flex flex-col items-start gap-3 md:gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="animate-live-pulse h-1.5 w-1.5 rounded-full bg-primary" />
            Música en vivo 24/7
          </span>
          <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight md:text-6xl">
            Sintoniza y{' '}
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              disfruta
            </span>{' '}
            tu radio online
          </h2>
          <p className="max-w-2xl text-balance text-sm text-muted-foreground md:text-lg">
            Varias emisoras en distintos idiomas transmitiendo música en vivo,
            las 24 horas. Escucha cuando quieras, donde quieras.
          </p>
          <div className="flex flex-wrap items-center gap-3 md:gap-4 pt-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Music2 className="h-3.5 w-3.5 text-primary" />
              {stations.length} emisoras
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Headphones className="h-3.5 w-3.5 text-primary" />
              {totalSongs} canciones
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5 text-primary" />
              {totalLanguages} {totalLanguages === 1 ? 'idioma' : 'idiomas'}
            </span>
          </div>
        </div>
      </section>

      {/* === Search bar === */}
      <section className="mx-auto w-full max-w-3xl px-3 pb-2 md:px-6 md:pb-4">
        <SearchBar onResultsChange={handleSearchResults} />
      </section>

      {/* === Stations grid === */}
      <section className="mx-auto w-full max-w-7xl flex-1 px-3 pb-40 md:px-6">
        <div className="mb-3 flex items-center justify-between md:mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-sm">
            {searchQuery
              ? `Resultados para "${searchQuery}"`
              : 'Emisoras disponibles'}
          </h3>
          <span className="text-[11px] text-muted-foreground md:text-xs">
            {searchQuery
              ? `${filteredStations.length} ${filteredStations.length === 1 ? 'emisora' : 'emisoras'} con coincidencias`
              : 'Toca una para sintonizar'
            }
          </span>
        </div>

        {searchQuery && filteredStations.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/60 p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <SearchX className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">No se encontraron emisoras</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                No hay canciones que coincidan con &quot;{searchQuery}&quot;. Prueba con otro término.
              </p>
            </div>
          </div>
        ) : stations.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {filteredStations.map((station) => (
              <StationCard key={station.id} station={station} />
            ))}
          </div>
        )}

        {/* Educational note about how it works (hidden on mobile) */}
        <div className="mt-12 hidden rounded-xl border border-border/60 bg-card/60 p-5 text-sm text-muted-foreground md:block">
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
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-3 py-3 text-xs text-muted-foreground md:flex-row md:gap-3 md:px-6 md:py-5">
          <div className="flex items-center gap-2">
            <p>
              <span className="font-semibold text-foreground">Euro Voice</span>
              {' — '}
              Radio 24/7
            </p>
          </div>
          <button
            onClick={() => setAboutOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Abrir página Acerca de"
          >
            <Info className="h-3.5 w-3.5" />
            Acerca de
          </button>
        </div>
      </footer>

      {/* === Floating components === */}
      <StickyPlayer />
      <AdminPanel />
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
      <StillListeningPrompt onSupportClick={() => setSupportOpen(true)} />
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
