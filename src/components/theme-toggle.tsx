'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

/**
 * ThemeToggle
 *
 * Button that toggles between light and dark themes. Uses next-themes to
 * persist the user's preference in localStorage. Renders an icon-only
 * button (sun in light mode, moon in dark mode).
 *
 * The button is disabled until mounted to avoid hydration mismatches
 * (next-themes only knows the theme after the client hydrates).
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // next-themes needs to be mounted before it knows the actual theme.
  // We defer the state update to avoid the eslint warning about
  // setState-in-effect.
  useEffect(() => {
    Promise.resolve().then(() => setMounted(true))
  }, [])

  if (!mounted) {
    // Placeholder with the same dimensions to avoid layout shift
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0"
        disabled
        aria-label="Cambiar tema"
      >
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const isDark = (resolvedTheme || theme) === 'dark'

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="h-9 w-9 p-0"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  )
}
