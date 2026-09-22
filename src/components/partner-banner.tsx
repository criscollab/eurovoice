'use client'

import { useEffect, useState } from 'react'

interface Partner {
  id: string
  name: string
  imageUrl: string
  linkUrl: string
  active: boolean
}

/**
 * PartnerBanner
 *
 * Displays a single advertising partner's banner at the top of the page,
 * above the header. The banner is a clickable image that opens the partner's
 * site in a new tab.
 *
 * Only shows when there's an active partner (fetched from /api/partners).
 * Hidden on mobile screens (banner doesn't fit well on small screens).
 */
export function PartnerBanner() {
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/partners', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setPartner(data?.partner ?? null)
      })
      .catch((err) => {
        console.error('Failed to load partner banner:', err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Don't render anything while loading or if no active partner
  if (loading || !partner) return null

  return (
    <div className="hidden w-full bg-gradient-to-r from-slate-50 to-slate-100 border-b border-border/40 md:block">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2">
        <a
          href={partner.linkUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block max-w-[728px] flex-1 transition-opacity hover:opacity-90"
          title={`Visita: ${partner.name}`}
          aria-label={`Anuncio de ${partner.name} — abrir en nueva pestaña`}
        >
          <img
            src={partner.imageUrl}
            alt={`Anuncio de ${partner.name}`}
            className="mx-auto h-[60px] w-auto max-w-full rounded-md object-contain"
            loading="lazy"
          />
        </a>
      </div>
    </div>
  )
}
