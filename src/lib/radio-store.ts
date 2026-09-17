'use client'

import { create } from 'zustand'
import type { Station, Song } from '@prisma/client'
import type { RepeatMode } from '@/lib/radio'

export type StationWithCount = Station & { _count: { songs: number } }

/**
 * Personal-mode radio state.
 *
 * Each listener has their own queue (array of songs) and a current index.
 * No server-side "now playing" timeline — the user controls playback.
 */
interface RadioState {
  // Stations list
  stations: StationWithCount[]
  setStations: (s: StationWithCount[]) => void

  // Active station (loaded in the player)
  activeStation: StationWithCount | null
  setActiveStation: (s: StationWithCount | null) => void

  // Queue (the songs of the active station, sorted by `order`)
  queue: Song[]
  setQueue: (songs: Song[]) => void

  // Index of the currently playing song in the queue
  currentIndex: number
  setCurrentIndex: (i: number) => void

  // Convenience getter for the current song
  // (not stored, computed in components)

  // Player state
  isPlaying: boolean
  setIsPlaying: (p: boolean) => void
  togglePlay: () => void

  // Volume (0..1)
  volume: number
  setVolume: (v: number) => void

  // Repeat mode
  repeatMode: RepeatMode
  setRepeatMode: (m: RepeatMode) => void
  cycleRepeatMode: () => void

  // Whether to show the playlist panel (expanded player)
  playlistOpen: boolean
  setPlaylistOpen: (open: boolean) => void
  togglePlaylist: () => void

  // Admin panel open state
  adminOpen: boolean
  setAdminOpen: (open: boolean) => void
  toggleAdmin: () => void
}

export const useRadioStore = create<RadioState>((set, get) => ({
  stations: [],
  setStations: (s) => set({ stations: s }),

  activeStation: null,
  setActiveStation: (s) =>
    set({
      activeStation: s,
      queue: [],
      currentIndex: -1,
      isPlaying: false,
    }),

  queue: [],
  setQueue: (songs) => set({ queue: songs }),

  currentIndex: -1,
  setCurrentIndex: (i) => set({ currentIndex: i }),

  isPlaying: false,
  setIsPlaying: (p) => set({ isPlaying: p }),
  togglePlay: () => set({ isPlaying: !get().isPlaying }),

  volume: 0.7,
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),

  repeatMode: 'all', // default: loop the queue forever
  setRepeatMode: (m) => set({ repeatMode: m }),
  cycleRepeatMode: () => {
    const order: RepeatMode[] = ['off', 'all', 'one']
    const current = order.indexOf(get().repeatMode)
    const next = order[(current + 1) % order.length]
    set({ repeatMode: next })
  },

  playlistOpen: false,
  setPlaylistOpen: (open) => set({ playlistOpen: open }),
  togglePlaylist: () => set({ playlistOpen: !get().playlistOpen }),

  adminOpen: false,
  setAdminOpen: (open) => set({ adminOpen: open }),
  toggleAdmin: () => set({ adminOpen: !get().adminOpen }),
}))
