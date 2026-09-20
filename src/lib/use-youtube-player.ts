'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * useYouTubePlayer
 *
 * Hook to control the YouTube IFrame Player API.
 *
 * Features:
 *   - Lazy-loads the YouTube IFrame API script
 *   - Creates a player instance bound to a container div
 *   - Provides play/pause/seek/volume control
 *   - Tracks player state (ready, playing, current time, duration)
 *   - Calls onEnded callback when video finishes
 *
 * Usage:
 *   const { containerRef, play, pause, seek, setVolume, isReady } = useYouTubePlayer({
 *     videoId: 'abc123',
 *     onEnded: () => console.log('video ended'),
 *     onTimeUpdate: (time) => setProgress(time),
 *   })
 */

declare global {
  interface Window {
    YT?: any
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiLoadingPromise: Promise<void> | null = null

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.YT && window.YT.Player) return Promise.resolve()
  if (apiLoadingPromise) return apiLoadingPromise

  apiLoadingPromise = new Promise<void>((resolve) => {
    const existing = document.querySelector('script[src*="youtube.com/iframe_api"]')
    if (!existing) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
    }
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
  })
  return apiLoadingPromise
}

interface UseYouTubePlayerOptions {
  videoId: string | null
  autoplay?: boolean
  volume?: number // 0..1
  onEnded?: () => void
  onReady?: () => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
}

export function useYouTubePlayer({
  videoId,
  autoplay = false,
  volume = 0.7,
  onEnded,
  onReady,
  onTimeUpdate,
}: UseYouTubePlayerOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)

  // Keep callbacks in refs so we don't recreate the player when they change
  const onEndedRef = useRef(onEnded)
  const onReadyRef = useRef(onReady)
  const onTimeUpdateRef = useRef(onTimeUpdate)
  useEffect(() => {
    onEndedRef.current = onEnded
    onReadyRef.current = onReady
    onTimeUpdateRef.current = onTimeUpdate
  }, [onEnded, onReady, onTimeUpdate])

  // Initialize player once API is loaded
  useEffect(() => {
    let cancelled = false
    loadYouTubeAPI().then(() => {
      if (cancelled || !containerRef.current || !window.YT?.Player) return
      // Already initialized
      if (playerRef.current) return

      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoId || undefined,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            if (cancelled) return
            setIsReady(true)
            try {
              playerRef.current.setVolume(volume * 100)
            } catch {}
            onReadyRef.current?.()
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.ENDED = 0
            if (event.data === 0) {
              onEndedRef.current?.()
            }
          },
        },
      })
    })
    return () => {
      cancelled = true
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch {}
        playerRef.current = null
        setIsReady(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load new video when videoId changes
  useEffect(() => {
    if (!isReady || !playerRef.current || !videoId) return
    try {
      playerRef.current.loadVideoById(videoId)
      if (autoplay) {
        playerRef.current.playVideo()
      }
    } catch (e) {
      console.warn('Failed to load video:', e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, isReady])

  // Track time updates with an interval (YT API doesn't have a timeupdate event)
  useEffect(() => {
    if (!isReady || !playerRef.current || !onTimeUpdateRef.current) return
    const interval = setInterval(() => {
      if (!playerRef.current) return
      try {
        const current = playerRef.current.getCurrentTime() || 0
        const dur = playerRef.current.getDuration() || 0
        onTimeUpdateRef.current?.(current, dur)
      } catch {}
    }, 500)
    return () => clearInterval(interval)
  }, [isReady])

  const play = useCallback(() => {
    if (!isReady || !playerRef.current) return
    try {
      playerRef.current.playVideo()
    } catch {}
  }, [isReady])

  const pause = useCallback(() => {
    if (!isReady || !playerRef.current) return
    try {
      playerRef.current.pauseVideo()
    } catch {}
  }, [isReady])

  const seekTo = useCallback((seconds: number) => {
    if (!isReady || !playerRef.current) return
    try {
      playerRef.current.seekTo(seconds, true)
    } catch {}
  }, [isReady])

  const setVolume = useCallback((vol: number) => {
    if (!isReady || !playerRef.current) return
    try {
      playerRef.current.setVolume(Math.max(0, Math.min(100, vol * 100)))
    } catch {}
  }, [isReady])

  const getCurrentTime = useCallback(() => {
    if (!isReady || !playerRef.current) return 0
    try {
      return playerRef.current.getCurrentTime() || 0
    } catch {
      return 0
    }
  }, [isReady])

  const getDuration = useCallback(() => {
    if (!isReady || !playerRef.current) return 0
    try {
      return playerRef.current.getDuration() || 0
    } catch {
      return 0
    }
  }, [isReady])

  return {
    containerRef,
    isReady,
    play,
    pause,
    seekTo,
    setVolume,
    getCurrentTime,
    getDuration,
  }
}
