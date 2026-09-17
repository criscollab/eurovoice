'use client'

import { SessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'

/**
 * Client-side wrapper around next-auth's SessionProvider so the rest of the
 * app (server components by default) can stay server-rendered while still
 * hydrating the auth session on the client.
 */
export function SessionProviderWrapper({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
