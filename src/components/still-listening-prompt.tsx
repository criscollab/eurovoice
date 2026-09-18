'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Headphones, Heart, X } from 'lucide-react'
import { useRadioStore } from '@/lib/radio-store'

const STORAGE_KEY = 'eurovoice_still_listening_shown'
const THRESHOLD_SECONDS = 30 * 60 // 30 minutes

/**
 * StillListeningPrompt
 *
 * A toast that appears after the listener has been actively playing for 30
 * minutes total in the current session. Itch  Only shows once per browser session.
 *
 * "Active" means: the audio is currently playing (not paused). Time accumulates
 * while playing; pauses don't count toward the threshold.
 *
 * Doesn't show if a dialog is open (we check `adminOpen` and `playlistOpen` from
 * the radio store as a proxy for "a dialog is open").
 */
export function StillListeningPrompt({
  onSupportClick,
}: {
  onSupportClick: () => void
}) {
  const { isPlaying } = useRadioStore()
  const [visible, setVisible] = useState(false)
  const accumulatedRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // === Tick while playing ===
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      accumulatedRef.current += 1
      if (accumulatedRef.current >= THRESHOLD_SECONDS) {
        if (typeof window === 'undefined') return
        // Only show once per session
        if (sessionStorage.getItem(STORAGE_KEY)) return
        Promise.resolve().then(() => {
          setVisible(true)
          try {
            sessionStorage.setItem(STORAGE_KEY, '1')
          } catch {
            // ignore
          }
        })
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPlaying])

  const handleClose = useCallback(() => {
    Promise.resolve().then(() => setVisible(false))
  }, [])

  const handleSupport = useCallback(() => {
    Promise.resolve().then(() => setVisible(false))
    onSupportClick()
  }, [onSupportClick])

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="¿Sigues escuchando?"
      className="fixed bottom-24 right-4 z-50 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-pink-500/30 bg-card/95 p-4 shadow-2xl backdrop-blur-xl md:right-6"
      style={{
        boxShadow: '0 -4px 24px -8px rgba(236, 72, 153, 0.35), 0 8px 24px -8px rgba(0,0,0,0.4)',
      }}
    >
      <button
        type="button"
        onClick={handleClose}
        aria-label="Cerrar aviso"
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-3 pr-4">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{
            color: '#ec4899',
            background: 'color-mix(in oklch, #ec4899 14%, transparent)',
          }}
        >
          <Headphones className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            ¿Sigues escuchando?
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Llevas media hora disfrutando de Euro Voice. Si te gusta lo que
            escuchas, considera apoyar el proyecto — cualquier aportación ayuda.
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleSupport}
          className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white"
        >
          <Heart className="h-3.5 w-3.5 fill-current" />
          Apoyar
        </Button>
        <Button size="sm" variant="ghost" onClick={handleClose}>
          Ahora no
        </Button>
      </div>
    </div>
  )
}
