'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LoginDialog } from '@/components/login-dialog'
import { useRadioStore } from '@/lib/radio-store'
import { Settings, LogIn, LogOut, ShieldCheck } from 'lucide-react'

/**
 * UserMenu
 * Header button that adapts to the auth state:
 * - Not logged in → "Iniciar sesión" button → opens LoginDialog
 * - Logged in as admin → "Administrar" button + "Cerrar sesión" button
 *
 * When the user opens the admin panel, the LoginDialog is closed first if open.
 */
export function UserMenu() {
  const { data: session, status } = useSession()
  const [loginOpen, setLoginOpen] = useState(false)
  const { toggleAdmin, adminOpen } = useRadioStore()

  const isAdmin = status === 'authenticated' && (session?.user as any)?.role === 'admin'

  if (status === 'loading') {
    return (
      <Button size="sm" variant="ghost" disabled>
        <span className="h-3 w-3 animate-pulse rounded-full bg-muted" />
      </Button>
    )
  }

  if (!isAdmin) {
    return (
      <>
        <Button onClick={() => setLoginOpen(true)} size="sm" variant="default">
          <LogIn className="h-3.5 w-3.5" />
          Iniciar sesión
        </Button>
        <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      </>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Button onClick={toggleAdmin} size="sm" variant={adminOpen ? 'default' : 'outline'}>
        <Settings className="h-3.5 w-3.5" />
        Administrar
      </Button>
      <Button
        onClick={() => signOut({ redirect: false })}
        size="sm"
        variant="ghost"
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
      >
        <LogOut className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
