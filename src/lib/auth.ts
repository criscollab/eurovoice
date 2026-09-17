import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getServerSession } from 'next-auth'

/**
 * NextAuth configuration.
 *
 * Uses a single Credentials provider — the admin user is defined by the
 * ADMIN_USERNAME and ADMIN_PASSWORD environment variables. No user database is
 * needed because there is exactly one administrator (the station owner).
 *
 * Visitors never log in — they only consume the public pages and the
 * read-only API routes (GET). All mutation routes (POST/PATCH/DELETE) require
 * an authenticated admin session.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Admin',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const adminUser = process.env.ADMIN_USERNAME
        const adminPass = process.env.ADMIN_PASSWORD

        if (!adminUser || !adminPass) {
          console.error('ADMIN_USERNAME / ADMIN_PASSWORD not set in env')
          return null
        }

        if (
          credentials.username === adminUser &&
          credentials.password === adminPass
        ) {
          return {
            id: '1',
            name: 'Administrador',
            email: 'admin@eurovoice.radio',
            role: 'admin',
          } as any
        }

        return null
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  pages: {
    // We use a custom login dialog instead of a dedicated sign-in page
    signIn: '/',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? 'listener'
        token.username = (user as any).name ?? 'admin'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = token.role
        ;(session.user as any).name = token.username
      }
      return session
    },
  },
}

/**
 * Helper for server-side routes: returns the session if the caller is an
 * authenticated admin, otherwise null.
 */
export async function getAdminSession() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') return null
  return session
}
