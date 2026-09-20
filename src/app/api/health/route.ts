import { NextResponse } from 'next/server'

/**
 * Health check endpoint — used by Railway to verify the app is responding.
 * Also useful for debugging: returns the values of key environment variables
 * (without secrets) so we can see what's actually being read by the app.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV ?? '(not set)',
      PORT: process.env.PORT ?? '(not set)',
      DATABASE_URL_set: !!process.env.DATABASE_URL,
      DATABASE_URL_preview: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.substring(0, 30) + '...'
        : '(not set)',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? '(not set)',
      NEXTAUTH_SECRET_set: !!process.env.NEXTAUTH_SECRET,
      ADMIN_USERNAME_set: !!process.env.ADMIN_USERNAME,
      ADMIN_PASSWORD_set: !!process.env.ADMIN_PASSWORD,
    },
  })
}
