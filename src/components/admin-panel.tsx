'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Station, Song } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { useRadioStore, type StationWithCount } from '@/lib/radio-store'
import {
  Plus,
  Trash2,
  Pencil,
  Music,
  GripVertical,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react'
import { formatTime } from '@/lib/radio'
import { cn } from '@/lib/utils'
import { SongUploader } from '@/components/song-uploader'
import { AdminStats } from '@/components/admin-stats'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { BarChart3 } from 'lucide-react'

type StationWithSongs = Station & { songs: Song[] }

/**
 * AdminPanel
 * Slide-out panel for managing stations (CRUD) and songs (CRUD + reorder).
 * Updates the global store after mutations so the player reflects changes.
 */
export function AdminPanel() {
  const { adminOpen, setAdminOpen, stations, setStations } = useRadioStore()
  const { toast } = useToast()

  const [editingStation, setEditingStation] = useState<StationWithSongs | null>(null)
  const [loadingStation, setLoadingStation] = useState<StationWithSongs | null>(null)
  const [loadedStations, setLoadedStations] = useState<StationWithSongs[]>([])

  const reloadLoadedStations = useCallback(async () => {
    const res = await fetch('/api/stations', { cache: 'no-store' })
    const data = await res.json()
    const list: StationWithCount[] = data.stations ?? []
    setStations(list)
    const withSongs = await Promise.all(
      list.map((s) =>
        fetch(`/api/stations/${s.id}`, { cache: 'no-store' })
          .then((r) => r.json())
          .then((d) => d?.station as StationWithSongs)
          .catch(() => null)
      )
    )
    const valid = withSongs.filter(Boolean) as StationWithSongs[]
    // Preserve the order from the stations list
    const ordered = list
      .map((s) => valid.find((v) => v.id === s.id))
      .filter(Boolean) as StationWithSongs[]
    setLoadedStations(ordered)
  }, [setStations])

  // === Load stations (with songs) when the admin opens ===
  useEffect(() => {
    if (!adminOpen) return
    let cancelled = false
    Promise.resolve().then(() => {
      if (cancelled) return
      reloadLoadedStations().catch(() => {})
    })
    return () => {
      cancelled = true
    }
  }, [adminOpen, reloadLoadedStations])

  const refreshStations = async () => {
    // Reload both the store (lightweight list) and the loadedStations (with songs)
    await reloadLoadedStations()
  }

  // === Station mutations ===
  const handleCreateStation = async (data: {
    name: string
    description?: string
    language?: string
    color?: string
  }) => {
    try {
      const res = await fetch('/api/stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('create failed')
      await refreshStations()
      toast({ title: 'Emisora creada', description: `"${data.name}" está lista.` })
    } catch {
      toast({ title: 'Error', description: 'No se pudo crear la emisora.', variant: 'destructive' })
    }
  }

  const handleUpdateStation = async (id: string, data: Partial<Station>) => {
    try {
      const res = await fetch(`/api/stations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('update failed')
      const d = await res.json()
      setLoadedStations((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...d.station, songs: s.songs } : s))
      )
      await refreshStations()
      toast({ title: 'Emisora actualizada' })
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar la emisora.', variant: 'destructive' })
    }
  }

  const handleDeleteStation = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la emisora "${name}" y todas sus canciones?`)) return
    try {
      const res = await fetch(`/api/stations/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      setLoadedStations((prev) => prev.filter((s) => s.id !== id))
      await refreshStations()
      toast({ title: 'Emisora eliminada' })
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar la emisora.', variant: 'destructive' })
    }
  }

  // === Song mutations ===
  const handleAddSong = async (
    stationId: string,
    data: { title: string; artist?: string; audioUrl: string; duration?: number; coverUrl?: string }
  ) => {
    try {
      const res = await fetch(`/api/stations/${stationId}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('add song failed')
      const d = await res.json()
      setLoadedStations((prev) =>
        prev.map((s) =>
          s.id === stationId ? { ...s, songs: [...s.songs, d.song] } : s
        )
      )
      await refreshStations()
      toast({ title: 'Canción agregada', description: d.song.title })
    } catch {
      toast({ title: 'Error', description: 'No se pudo agregar la canción.', variant: 'destructive' })
    }
  }

  const handleUpdateSong = async (songId: string, stationId: string, data: Partial<Song>) => {
    try {
      const res = await fetch(`/api/songs/${songId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('update song failed')
      const d = await res.json()
      setLoadedStations((prev) =>
        prev.map((s) =>
          s.id === stationId
            ? { ...s, songs: s.songs.map((song) => (song.id === songId ? d.song : song)) }
            : s
        )
      )
      toast({ title: 'Canción actualizada' })
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar la canción.', variant: 'destructive' })
    }
  }

  const handleDeleteSong = async (songId: string, stationId: string) => {
    if (!confirm('¿Eliminar esta canción?')) return
    try {
      const res = await fetch(`/api/songs/${songId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete song failed')
      setLoadedStations((prev) =>
        prev.map((s) =>
          s.id === stationId ? { ...s, songs: s.songs.filter((song) => song.id !== songId) } : s
        )
      )
      await refreshStations()
      toast({ title: 'Canción eliminada' })
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar la canción.', variant: 'destructive' })
    }
  }

  const handleMoveSong = async (stationId: string, index: number, direction: -1 | 1) => {
    const station = loadedStations.find((s) => s.id === stationId)
    if (!station) return
    const songs = [...station.songs].sort((a, b) => a.order - b.order)
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= songs.length) return
    // Swap
    ;[songs[index], songs[newIndex]] = [songs[newIndex], songs[index]]
    // Reassign orders
    songs.forEach((s, i) => (s.order = i))
    // Optimistic update
    setLoadedStations((prev) =>
      prev.map((s) => (s.id === stationId ? { ...s, songs } : s))
    )
    // Persist
    try {
      await fetch(`/api/stations/${stationId}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedSongIds: songs.map((s) => s.id) }),
      })
      toast({ title: 'Orden actualizado' })
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar el orden.', variant: 'destructive' })
    }
  }

  // === Station reordering (move station up/down) ===
  const handleMoveStation = async (index: number, direction: -1 | 1) => {
    const stations = [...loadedStations].sort((a, b) => a.order - b.order)
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= stations.length) return
    // Swap
    ;[stations[index], stations[newIndex]] = [stations[newIndex], stations[index]]
    // Reassign orders
    stations.forEach((s, i) => (s.order = i))
    // Optimistic update
    setLoadedStations([...stations])
    try {
      await fetch('/api/stations/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedStationIds: stations.map((s) => s.id) }),
      })
      await refreshStations()
      toast({ title: 'Orden de emisoras actualizado' })
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar el orden.', variant: 'destructive' })
    }
  }

  return (
    <Sheet open={adminOpen} onOpenChange={setAdminOpen}>
      <SheetContent
        side="right"
        className="w-full overflow-hidden border-l-border/60 bg-background p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-border/60 px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Music className="h-5 w-5 text-primary" />
            Panel de administración
          </SheetTitle>
          <SheetDescription>
            Gestiona emisoras y canciones. Los cambios se aplican en vivo.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="p-6">
            <Tabs defaultValue="stations">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="stations" className="flex items-center gap-2">
                  <Music className="h-3.5 w-3.5" />
                  Emisoras ({loadedStations.length})
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Estadísticas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stations" className="space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Gestiona tus emisoras
                  </h3>
                  <CreateStationDialog onCreate={handleCreateStation} />
                </div>

                {loadedStations.length > 1 && (
                  <p className="text-[11px] text-muted-foreground bg-secondary/40 rounded-md px-3 py-1.5">
                    💡 Usa los botones <strong>▲</strong> y <strong>▼</strong> junto a cada emisora para cambiar el orden en que aparecen en la página principal.
                  </p>
                )}

                {loadedStations.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                    Cargando emisoras…
                  </p>
                ) : (
                  <div className="space-y-4">
                    {[...loadedStations]
                      .sort((a, b) => a.order - b.order)
                      .map((station, sortedIndex) => (
                      <StationAdminCard
                        key={station.id}
                        station={station}
                        stationIndex={sortedIndex}
                        totalStations={loadedStations.length}
                        onMoveStation={(dir) => handleMoveStation(sortedIndex, dir)}
                        onEdit={() => setEditingStation(station)}
                        onDelete={() => handleDeleteStation(station.id, station.name)}
                        onAddSong={(data) => handleAddSong(station.id, data)}
                        onMoveSong={(index, dir) => handleMoveSong(station.id, index, dir)}
                        onDeleteSong={(songId) => handleDeleteSong(songId, station.id)}
                        onUpdateSong={(songId, data) => handleUpdateSong(songId, station.id, data)}
                        onUpdateStation={(data) => handleUpdateStation(station.id, data)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="stats" className="mt-0">
                <AdminStats />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

/**
 * StationAdminCard
 * Card for managing a single station: edit metadata, list songs, add song.
 */
function StationAdminCard({
  station,
  stationIndex,
  totalStations,
  onMoveStation,
  onEdit,
  onDelete,
  onAddSong,
  onMoveSong,
  onDeleteSong,
  onUpdateSong,
  onUpdateStation,
}: {
  station: StationWithSongs
  stationIndex: number
  totalStations: number
  onMoveStation: (dir: -1 | 1) => void
  onEdit: () => void
  onDelete: () => void
  onAddSong: (data: { title: string; artist?: string; audioUrl: string; duration?: number; coverUrl?: string }) => void
  onMoveSong: (index: number, dir: -1 | 1) => void
  onDeleteSong: (songId: string) => void
  onUpdateSong: (songId: string, data: Partial<Song>) => void
  onUpdateStation: (data: Partial<Station>) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [showAddSong, setShowAddSong] = useState(false)
  const [editingSongId, setEditingSongId] = useState<string | null>(null)
  const [editingStationOpen, setEditingStationOpen] = useState(false)

  const accent = station.color
  const songs = [...station.songs].sort((a, b) => a.order - b.order)

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: `color-mix(in oklch, ${accent} 25%, transparent)` }}
    >
      {/* Station header */}
      <div
        className="flex items-center gap-3 p-4"
        style={{
          background: `linear-gradient(135deg, color-mix(in oklch, ${accent} 18%, transparent) 0%, transparent 100%)`,
        }}
      >
        {/* Position badge + reorder controls */}
        <div className="flex shrink-0 flex-col items-center gap-0.5">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold tabular-nums text-white"
            style={{ background: accent }}
            title={`Posición ${stationIndex + 1}`}
          >
            {stationIndex + 1}
          </span>
          <div className="flex flex-col">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => onMoveStation(-1)}
              disabled={stationIndex === 0}
              aria-label="Subir emisora"
              title="Mover arriba"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => onMoveStation(1)}
              disabled={stationIndex === totalStations - 1}
              aria-label="Bajar emisora"
              title="Mover abajo"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div
          className="h-10 w-10 shrink-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${accent}, color-mix(in oklch, ${accent} 40%, black))`,
            boxShadow: `0 0 16px -2px ${accent}`,
          }}
        />
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-bold text-foreground">{station.name}</h4>
          <p className="text-xs text-muted-foreground">
            {station.language} · {songs.length} {songs.length === 1 ? 'canción' : 'canciones'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setEditingStationOpen(true)}
            aria-label="Editar emisora"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:text-destructive"
            onClick={onDelete}
            aria-label="Eliminar emisora"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? 'Contrair' : 'Expandir'}
          >
            <X
              className={cn('h-3.5 w-3.5 transition-transform', expanded ? 'rotate-45' : '')}
            />
          </Button>
        </div>
      </div>

      {/* Songs list */}
      {expanded && (
        <div className="border-t border-border/60 p-3">
          {songs.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No hay canciones. Agrega la primera.
            </p>
          ) : (
            <ul className="space-y-1">
              {songs.map((song, index) => (
                <li
                  key={song.id}
                  className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary"
                >
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
                  <span className="w-6 text-center text-[10px] tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {song.title}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {song.artist} · {formatTime(song.duration)}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onMoveSong(index, -1)}
                      disabled={index === 0}
                      aria-label="Subir"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onMoveSong(index, 1)}
                      disabled={index === songs.length - 1}
                      aria-label="Bajar"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setEditingSongId(song.id)}
                      aria-label="Editar"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <a
                      href={song.audioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-secondary"
                      aria-label="Abrir audio"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:text-destructive"
                      onClick={() => onDeleteSong(song.id)}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full border-dashed"
            onClick={() => setShowAddSong(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar canción
          </Button>
        </div>
      )}

      {showAddSong && (
        <AddSongDialog
          open={showAddSong}
          onOpenChange={setShowAddSong}
          onSubmit={(data) => {
            onAddSong(data)
            setShowAddSong(false)
          }}
          accent={accent}
          stationId={station.id}
        />
      )}

      {editingSongId && (
        <EditSongDialog
          key={editingSongId}
          song={songs.find((s) => s.id === editingSongId)!}
          open={!!editingSongId}
          onOpenChange={(o) => !o && setEditingSongId(null)}
          onSubmit={(data) => {
            onUpdateSong(editingSongId!, data)
            setEditingSongId(null)
          }}
          accent={accent}
          stationId={station.id}
        />
      )}

      <EditStationDialog
        key={station.id}
        station={station}
        open={editingStationOpen}
        onOpenChange={setEditingStationOpen}
        onSubmit={(data) => {
          onUpdateStation(data)
          setEditingStationOpen(false)
        }}
      />
    </div>
  )
}

/**
 * CreateStationDialog
 */
function CreateStationDialog({ onCreate }: { onCreate: (data: { name: string; description?: string; language?: string; color?: string }) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState('Español')
  const [color, setColor] = useState('#ec4899')

  const handleSubmit = () => {
    if (!name.trim()) return
    onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      language: language.trim() || 'Español',
      color,
    })
    setName('')
    setDescription('')
    setLanguage('Español')
    setColor('#ec4899')
    setOpen(false)
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        Nueva emisora
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva emisora</DialogTitle>
            <DialogDescription>
              Crea una nueva emisora. Luego podrás agregarle canciones.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="st-name">Nombre *</Label>
              <Input
                id="st-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Radio Pop Español"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="st-desc">Descripción</Label>
              <Textarea
                id="st-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="¿Qué transmite esta emisora?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="st-lang">Idioma</Label>
              <Input
                id="st-lang"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="Español, English, Français…"
              />
            </div>
            <div className="space-y-2">
              <Label>Color de acento</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded-md border border-border bg-transparent"
                />
                <span className="text-sm tabular-nums text-muted-foreground">{color}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!name.trim()}>
              Crear emisora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * EditStationDialog
 */
function EditStationDialog({
  station,
  open,
  onOpenChange,
  onSubmit,
}: {
  station: Station
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Partial<Station>) => void
}) {
  const [name, setName] = useState(station.name)
  const [description, setDescription] = useState(station.description ?? '')
  const [language, setLanguage] = useState(station.language)
  const [color, setColor] = useState(station.color)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar emisora</DialogTitle>
          <DialogDescription>
            Modifica los datos de "{station.name}".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Idioma</Label>
            <Input value={language} onChange={(e) => setLanguage(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Color de acento</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-md border border-border bg-transparent"
              />
              <span className="text-sm tabular-nums text-muted-foreground">{color}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSubmit({ name, description, language, color })}>
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * AddSongDialog
 */
function AddSongDialog({
  open,
  onOpenChange,
  onSubmit,
  accent,
  stationId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { title: string; artist?: string; audioUrl: string; duration?: number; coverUrl?: string }) => void
  accent: string
  stationId: string
}) {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [duration, setDuration] = useState(180)
  const [coverUrl, setCoverUrl] = useState('')

  const handleSubmit = () => {
    if (!title.trim() || !audioUrl.trim()) return
    onSubmit({
      title: title.trim(),
      artist: artist.trim() || undefined,
      audioUrl: audioUrl.trim(),
      duration,
      coverUrl: coverUrl.trim() || undefined,
    })
    setTitle('')
    setArtist('')
    setAudioUrl('')
    setDuration(180)
    setCoverUrl('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar canción</DialogTitle>
          <DialogDescription>
            Sube un archivo MP3 o pega una URL externa. La canción se añadirá al final de la cola.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre de la canción"
            />
          </div>
          <div className="space-y-2">
            <Label>Artista</Label>
            <Input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Nombre del artista"
            />
          </div>
          <SongUploader
            url={audioUrl}
            duration={duration}
            onUrlChange={setAudioUrl}
            onDurationChange2={setDuration}
            stationId={stationId}
          />
          <div className="space-y-2">
            <Label>URL de la portada (opcional)</Label>
            <Input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://…/portada.jpg"
              type="url"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !audioUrl.trim()}
            style={{ background: accent, color: '#ffffff' }}
          >
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * EditSongDialog
 */
function EditSongDialog({
  song,
  open,
  onOpenChange,
  onSubmit,
  accent,
  stationId,
}: {
  song: Song
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Partial<Song>) => void
  accent: string
  stationId: string
}) {
  const [title, setTitle] = useState(song.title)
  const [artist, setArtist] = useState(song.artist)
  const [audioUrl, setAudioUrl] = useState(song.audioUrl)
  const [duration, setDuration] = useState(song.duration)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar canción</DialogTitle>
          <DialogDescription>Modifica los datos de "{song.title}". Puedes reemplazar el audio subiendo uno nuevo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Artista</Label>
            <Input value={artist} onChange={(e) => setArtist(e.target.value)} />
          </div>
          <SongUploader
            url={audioUrl}
            duration={duration}
            onUrlChange={setAudioUrl}
            onDurationChange2={setDuration}
            stationId={stationId}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={() => onSubmit({ title, artist, audioUrl, duration })}
            style={{ background: accent, color: '#ffffff' }}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
