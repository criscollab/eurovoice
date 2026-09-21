'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Trash2,
  Pencil,
  ExternalLink,
  Eye,
  EyeOff,
  Megaphone,
  Loader2,
} from 'lucide-react'

interface Partner {
  id: string
  name: string
  imageUrl: string
  linkUrl: string
  active: boolean
  createdAt: string
  updatedAt: string
}

/**
 * PartnerManager
 *
 * Admin-only component for managing advertising partners.
 *
 * Features:
 *   - List all partners (active and inactive)
 *   - Add a new partner (name, image URL, link URL)
 *   - Edit an existing partner
 *   - Delete a partner
 *   - Toggle active/inactive (only one partner can be active at a time;
 *     activating one automatically deactivates the others)
 *
 * The active partner's banner is shown at the top of the public site.
 */
export function PartnerManager() {
  const { toast } = useToast()
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)

  // === Load all partners ===
  const loadPartners = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/partners', { method: 'PUT', cache: 'no-store' })
      if (!res.ok) throw new Error('failed to load partners')
      const data = await res.json()
      setPartners(data?.partners ?? [])
    } catch (err) {
      console.error('Failed to load partners:', err)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los socios.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadPartners()
  }, [loadPartners])

  // === Add new partner ===
  const handleAdd = async (data: {
    name: string
    imageUrl: string
    linkUrl: string
    active: boolean
  }) => {
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'failed to add partner')
      }
      toast({ title: 'Socio agregado', description: data.name })
      setAddOpen(false)
      await loadPartners()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'No se pudo agregar el socio.',
        variant: 'destructive',
      })
    }
  }

  // === Update partner ===
  const handleUpdate = async (id: string, data: Partial<Partner>) => {
    try {
      const res = await fetch(`/api/partners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'failed to update partner')
      }
      toast({ title: 'Socio actualizado' })
      setEditingPartner(null)
      await loadPartners()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'No se pudo actualizar el socio.',
        variant: 'destructive',
      })
    }
  }

  // === Delete partner ===
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Seguro que quieres eliminar a "${name}"?`)) return
    try {
      const res = await fetch(`/api/partners/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('failed to delete partner')
      toast({ title: 'Socio eliminado', description: name })
      await loadPartners()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el socio.',
        variant: 'destructive',
      })
    }
  }

  // === Toggle active (deactivates others automatically) ===
  const handleToggleActive = async (partner: Partner) => {
    await handleUpdate(partner.id, { active: !partner.active })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Gestiona tu socio publicitario
          </h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            El socio activo aparecerá como banner arriba de la página. Solo puede
            haber un socio activo a la vez.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando socios…
        </div>
      ) : partners.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">
            No tienes socios todavía
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Agrega un socio con su imagen y URL de destino para que aparezca el
            banner en la página.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="rounded-lg border border-border/60 bg-card p-3"
            >
              <div className="flex items-start gap-3">
                {/* Preview image */}
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-secondary">
                  {partner.imageUrl ? (
                    <img
                      src={partner.imageUrl}
                      alt={partner.name}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Megaphone className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {partner.name}
                    </p>
                    {partner.active && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-600">
                        <span className="animate-live-pulse h-1 w-1 rounded-full bg-green-500" />
                        Activo
                      </span>
                    )}
                  </div>
                  <a
                    href={partner.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {partner.linkUrl}
                  </a>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    Imagen: {partner.imageUrl}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant={partner.active ? 'outline' : 'default'}
                  onClick={() => handleToggleActive(partner)}
                  className="gap-1.5"
                >
                  {partner.active ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      Activar
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingPartner(partner)}
                  className="gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(partner.id, partner.name)}
                  className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <AddPartnerDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAdd}
      />

      {/* Edit dialog */}
      {editingPartner && (
        <EditPartnerDialog
          partner={editingPartner}
          open={!!editingPartner}
          onOpenChange={(o) => !o && setEditingPartner(null)}
          onSubmit={(data) => handleUpdate(editingPartner.id, data)}
        />
      )}
    </div>
  )
}

/**
 * AddPartnerDialog
 */
function AddPartnerDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; imageUrl: string; linkUrl: string; active: boolean }) => void
}) {
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [active, setActive] = useState(true)

  const handleSubmit = () => {
    if (!name.trim() || !imageUrl.trim() || !linkUrl.trim()) return
    onSubmit({
      name: name.trim(),
      imageUrl: imageUrl.trim(),
      linkUrl: linkUrl.trim(),
      active,
    })
    setName('')
    setImageUrl('')
    setLinkUrl('')
    setActive(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar socio</DialogTitle>
          <DialogDescription>
            Agrega los datos de tu socio publicitario. La imagen se mostrará como
            banner arriba de la página y al hacer click, abrirá el sitio del socio.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nombre del socio *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: SonidoLibre"
            />
            <p className="text-[11px] text-muted-foreground">
              Solo para identificación interna. No se muestra en la página pública.
            </p>
          </div>
          <div className="space-y-2">
            <Label>URL de la imagen *</Label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…/banner.png"
              type="url"
            />
            <p className="text-[11px] text-muted-foreground">
              Pega aquí la URL de la imagen que te dio tu socio (debe estar
              alojada en algún sitio como Imgur, Cloudinary, o el propio sitio
              del socio). Tamaño recomendado: 728x90px.
            </p>
          </div>
          <div className="space-y-2">
            <Label>URL de destino *</Label>
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://sonidolibre.com"
              type="url"
            />
            <p className="text-[11px] text-muted-foreground">
              Cuando alguien haga click en el banner, se abrirá esta URL en una
              nueva pestaña.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="active" className="cursor-pointer text-sm">
              Activar inmediatamente (desactivará otros socios)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !imageUrl.trim() || !linkUrl.trim()}
          >
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * EditPartnerDialog
 */
function EditPartnerDialog({
  partner,
  open,
  onOpenChange,
  onSubmit,
}: {
  partner: Partner
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Partial<Partner>) => void
}) {
  const [name, setName] = useState(partner.name)
  const [imageUrl, setImageUrl] = useState(partner.imageUrl)
  const [linkUrl, setLinkUrl] = useState(partner.linkUrl)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar socio</DialogTitle>
          <DialogDescription>
            Modifica los datos de "{partner.name}".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>URL de la imagen</Label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              type="url"
            />
          </div>
          <div className="space-y-2">
            <Label>URL de destino</Label>
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              type="url"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => onSubmit({ name, imageUrl, linkUrl })}
            disabled={!name.trim() || !imageUrl.trim() || !linkUrl.trim()}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
