'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Heart,
  Coffee,
  Headphones,
  Globe,
  Gem,
  ExternalLink,
  Server,
  Code2,
  Music2,
  Megaphone,
  CheckCircle2,
} from 'lucide-react'

interface SupportSettings {
  koFiUrl: string
  goalEur: number
  raisedEur: number
  monthName: string
}

const TIERS = [
  { amount: 1, icon: Coffee, label: 'Café', description: 'Un pequeño gesto, un gran agradecimiento.' },
  { amount: 3, icon: Music2, label: 'Canción', description: 'Apóyame como si fuera una canción de pago.' },
  { amount: 5, icon: Headphones, label: 'Playlist', description: 'Una playlist entera, sin anuncios.' },
  { amount: 10, icon: Gem, label: 'Mecenas', description: 'Conviértete en mecenas mensual de Euro Voice.' },
]

const HELP_ITEMS = [
  { icon: Server, title: 'Servidores y streaming', text: 'Pago mensual del hosting y ancho de banda para que la música suene sin cortes.' },
  { icon: Code2, title: 'Desarrollo', text: 'Tiempo dedicado a mejorar la plataforma, corregir bugs y añadir nuevas funciones.' },
  { icon: Music2, title: 'Catálogo musical', text: 'Compra de canciones y licencias para ampliar las emisoras disponibles.' },
  { icon: Megaphone, title: 'Difusión', text: 'Promoción para que más gente descubra Euro Voice y comparta la música.' },
]

/**
 * SupportDialog
 *
 * Donation dialog with Ko-fi integration. Shows:
 *   - An emotional message thanking the listener
 *   - Monthly goal progress bar
 *   - 4 donation tiers (€1, €3, €5, €10) + custom
 *   - "What your contribution helps" section
 *   - "Free for all" message
 *
 * When the user clicks a tier, the dialog switches to a thank-you screen with
 * a Ko-fi link. We do NOT auto-open Ko-fi — the user clicks the link manually.
 */
export function SupportDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [settings, setSettings] = useState<SupportSettings | null>(null)
  const [showThanks, setShowThanks] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number>(0)

  // === Fetch settings every time the dialog opens ===
  useEffect(() => {
    if (!open) {
      Promise.resolve().then(() => {
        setShowThanks(false)
        setSelectedAmount(0)
      })
      return
    }
    let cancelled = false
    fetch('/api/support/settings', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        Promise.resolve().then(() => setSettings(data))
      })
      .catch(() => {
        // ignore
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const handleTierClick = (amount: number) => {
    Promise.resolve().then(() => {
      setSelectedAmount(amount)
      setShowThanks(true)
    })
  }

  const koFiUrl = settings?.koFiUrl || '#'
  const progressPct = settings
    ? Math.min(100, Math.round((settings.raisedEur / Math.max(1, settings.goalEur)) * 100))
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-5 w-5 fill-pink-500 text-pink-500" />
            Apoya Euro Voice
          </DialogTitle>
          <DialogDescription>
            Tu contribución mantiene la música sonando para todos.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          {!showThanks ? (
            <div className="space-y-6 px-6 py-6">
              {/* Emotional message */}
              <p className="text-sm leading-relaxed text-foreground/90">
                Hola. Si estás leyendo esto, es porque disfrutas de Euro Voice. Esta
                radio existe gracias a personas como tú que aman la música. Si te
                gusta lo que hacemos y quieres ayudarnos a seguir, cualquier
                aportación es bienvenida — y si no puedes, no pasa nada: la radio
                seguirá siendo <strong>gratis para todos</strong>, siempre.
              </p>

              {/* Monthly goal progress bar */}
              {settings && (
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">
                      Meta de {settings.monthName}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {settings.raisedEur.toFixed(0)}€ / {settings.goalEur.toFixed(0)}€
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {progressPct}% alcanzado — ¡gracias a todos!
                  </p>
                </div>
              )}

              {/* Donation tiers */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  Elige tu aportación
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TIERS.map((tier) => {
                    const Icon = tier.icon
                    return (
                      <button
                        key={tier.amount}
                        type="button"
                        onClick={() => handleTierClick(tier.amount)}
                        className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card p-3 text-center transition-all hover:-translate-y-0.5 hover:border-pink-500/40 hover:shadow-md"
                      >
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full"
                          style={{
                            color: '#ec4899',
                            background: 'color-mix(in oklch, #ec4899 14%, transparent)',
                          }}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {tier.amount}€
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {tier.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Custom amount → opens Ko-fi directly */}
                <a
                  href={koFiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Gem className="h-3.5 w-3.5" />
                  Cantidad personalizada en Ko-fi
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* What your contribution helps */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  ¿En qué se usa tu aportación?
                </h3>
                <ul className="space-y-2.5">
                  {HELP_ITEMS.map((item) => {
                    const Icon = item.icon
                    return (
                      <li key={item.title} className="flex gap-3">
                        <span
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            color: '#ec4899',
                            background: 'color-mix(in oklch, #ec4899 12%, transparent)',
                          }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.text}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Free for all message */}
              <div className="flex items-start gap-3 rounded-xl border border-pink-500/20 bg-pink-500/5 p-4">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" />
                <p className="text-xs text-foreground/90">
                  Euro Voice es y seguirá siendo <strong>gratis para todos</strong>.
                  Tu apoyo es totalmente voluntario. Si no puedes aportar, no pasa
                  nada — disfruta de la música, compártela con quien quieras, y eso
                  ya nos hace felices.
                </p>
              </div>
            </div>
          ) : (
            // === Thank-you screen ===
            <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-9 w-9 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  ¡Gracias de corazón!
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Has elegido aportar <strong>{selectedAmount}€</strong>. Tu
                  generosidad ayuda a mantener Euro Voice vivo y disponible para
                  todos. Para completar la donación, haz clic en el botón de abajo:
                </p>
              </div>

              <a
                href={koFiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition-transform hover:scale-[1.02]"
              >
                <Heart className="h-4 w-4 fill-current" />
                Apoyar ahora en Ko-fi
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-xs text-muted-foreground"
              >
                Continuar escuchando
              </Button>

              <p className="text-[10px] text-muted-foreground">
                No se realizará ningún cargo hasta que abras Ko-fi y confirmes.
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
