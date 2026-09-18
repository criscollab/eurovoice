'use client'

import { useState, useEffect, useCallback } from 'react'
import { ThumbsUp, ThumbsDown, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

type Reaction = 'like' | 'heart' | 'dislike'

interface ReactionState {
  likes: number
  hearts: number
  dislikes: number
  userReaction: Reaction | null
}

const REACTION_META: Record<
  Reaction,
  { icon: typeof ThumbsUp; color: string; label: string; counterKey: keyof Omit<ReactionState, 'userReaction'> }
> = {
  like: { icon: ThumbsUp, color: '#3b82f6', label: 'Me gusta', counterKey: 'likes' },
  heart: { icon: Heart, color: '#ec4899', label: 'Me encanta', counterKey: 'hearts' },
  dislike: { icon: ThumbsDown, color: '#ef4444', label: 'No me gusta', counterKey: 'dislikes' },
}

/**
 * Format a count for display:
 *   - < 1000: as-is (e.g. "999")
 *   - >= 1000: "1.5K", "12K", "1.2M"
 */
function formatCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000) {
    const v = n / 1000
    return `${v.toFixed(v < 10 ? 1 : 0).replace(/\.0$/, '')}K`
  }
  const v = n / 1_000_000
  return `${v.toFixed(v < 10 ? 1 : 0).replace(/\.0$/, '')}M`
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = window.localStorage.getItem('eurovoice_session_id') || ''
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2)}`
    window.localStorage.setItem('eurovoice_session_id', id)
  }
  return id
}

/**
 * ReactionButtons
 *
 * Three buttons (like / heart / dislike) that appear in the player. Each shows
 * the reaction count next to the icon. Clicking a reaction:
 *   - If it's already the user's reaction → removes it (toggle off)
 *   - If it's a different reaction → replaces the previous one
 *
 * Uses optimistic updates: the UI updates immediately, then reverts if the
 * server request fails.
 */
export function ReactionButtons({
  songId,
  accent = '#3b82f6',
}: {
  songId: string
  accent?: string
}) {
  const [state, setState] = useState<ReactionState>({
    likes: 0,
    hearts: 0,
    dislikes: 0,
    userReaction: null,
  })
  const [loaded, setLoaded] = useState(false)

  // === Fetch initial counts + current user's reaction ===
  useEffect(() => {
    let cancelled = false
    const sessionId = getSessionId()
    Promise.resolve().then(() => setLoaded(false))
    fetch(`/api/songs/${songId}/react?sessionId=${encodeURIComponent(sessionId)}`, {
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        Promise.resolve().then(() =>
          setState({
            likes: data.likes ?? 0,
            hearts: data.hearts ?? 0,
            dislikes: data.dislikes ?? 0,
            userReaction: data.userReaction ?? null,
          })
        )
      })
      .catch(() => {
        // ignore — keep zero state
      })
      .finally(() => {
        if (!cancelled) Promise.resolve().then(() => setLoaded(true))
      })
    return () => {
      cancelled = true
    }
  }, [songId])

  // === Click handler: toggle or replace reaction ===
  const handleClick = useCallback(
    async (reaction: Reaction) => {
      const sessionId = getSessionId()
      const prev = state

      // Optimistic update
      Promise.resolve().then(() => {
        setState((curr) => {
          const next = { ...curr }
          // If user already had a reaction, decrement that counter
          if (curr.userReaction && curr.userReaction !== reaction) {
            const k = REACTION_META[curr.userReaction].counterKey
            next[k] = Math.max(0, curr[k] - 1)
          }
          // Toggle: clicking the same reaction removes it
          if (curr.userReaction === reaction) {
            const k = REACTION_META[reaction].counterKey
            next[k] = Math.max(0, curr[k] - 1)
            next.userReaction = null
          } else {
            const k = REACTION_META[reaction].counterKey
            next[k] = curr[k] + 1
            next.userReaction = reaction
          }
          return next
        })
      })

      try {
        const res = await fetch(`/api/songs/${songId}/react`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, reaction }),
        })
        if (!res.ok) throw new Error('react failed')
        const data = await res.json()
        Promise.resolve().then(() =>
          setState({
            likes: data.likes ?? 0,
            hearts: data.hearts ?? 0,
            dislikes: data.dislikes ?? 0,
            userReaction: data.userReaction ?? null,
          })
        )
      } catch {
        // Revert on failure
        Promise.resolve().then(() => setState(prev))
      }
    },
    [songId, state]
  )

  if (!loaded) {
    // Render placeholder buttons while loading (keeps layout stable)
    return (
      <div className="flex items-center gap-1" aria-busy="true">
        {(Object.keys(REACTION_META) as Reaction[]).map((r) => {
          const meta = REACTION_META[r]
          const Icon = meta.icon
          return (
            <span
              key={r}
              className="inline-flex h-8 items-center gap-1 rounded-full px-2 text-muted-foreground/40"
            >
              <Icon className="h-4 w-4" />
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {(Object.keys(REACTION_META) as Reaction[]).map((reaction) => {
        const meta = REACTION_META[reaction]
        const Icon = meta.icon
        const isActive = state.userReaction === reaction
        const count = state[meta.counterKey]
        const color = meta.color

        return (
          <button
            key={reaction}
            type="button"
            onClick={() => handleClick(reaction)}
            aria-pressed={isActive}
            aria-label={`${meta.label}${count > 0 ? ` (${formatCount(count)})` : ''}`}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-all',
              'hover:bg-secondary',
              isActive
                ? 'border-transparent'
                : 'border-transparent text-muted-foreground'
            )}
            style={
              isActive
                ? {
                    color,
                    background: `color-mix(in oklch, ${color} 14%, transparent)`,
                  }
                : undefined
            }
          >
            <Icon
              className={cn('h-4 w-4', reaction === 'heart' && isActive && 'fill-current')}
            />
            {count > 0 && (
              <span className="tabular-nums" style={isActive ? { color } : undefined}>
                {formatCount(count)}
              </span>
            )}
          </button>
        )
      })}
      {/* Accent dot to hint at the station color (subtle) */}
      <span
        className="ml-1 hidden h-1.5 w-1.5 rounded-full md:inline-block"
        style={{ background: accent }}
        aria-hidden="true"
      />
    </div>
  )
}
