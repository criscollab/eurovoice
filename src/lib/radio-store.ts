'use client'

import { create } from 'zustand'
import type { Station, Song } from '@prisma/client'

export type StationWithCount = Station & { _count: { songs: number } }

export interface NowPlayingInfo {
  song: Song
  index: number
  offset: number
  remaining: number
  nextSong?: Song
  serverTime: number
}

interface RadioState {
  // Stations
  stations: StationWithCount[]
  setStations: (s: StationWithCount[]) => void

  // Active station (the one currently loaded in the player)
  activeStation: StationWithCount | null
  setActiveStation: (s: StationWithCount | null) => void

  // Now-playing info for the active station
  nowPlaying: NowPlayingInfo | null
  setNowPlaying: (np: NowPlayingInfo | null) => void

  // Player state
  isPlaying: boolean
  setIsPlaying: (p: boolean) => void
  togglePlay: () => void

  volume: number // 0..1
  setVolume: (v: number) => void

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
      // Reset now-playing when switching stations; the player will refetch
      nowPlaying: null,
      isPlaying: false,
    }),

  nowPlaying: null,
  setNowPlaying: (np) => set({ nowPlaying: np }),

  isPlaying: false,
  setIsPlaying: (p) => set({ isPlaying: p }),
  togglePlay: () => set({ isPlaying: !get().isPlaying }),

  volume: 0.7,
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),

  adminOpen: false,
  setAdminOpen: (open) => set({ adminOpen: open }),
  toggleAdmin: () => set({ adminOpen: !get().adminOpen }),
}))
