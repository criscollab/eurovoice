import { NextResponse } from 'next/server'

/**
 * GET /api/support/settings
 *
 * Public — returns the Ko-fi donation URL, monthly goal amount, current
 * raised amount, and the current month name (in Spanish) for display in the
 * Support dialog.
 */
export async function GET() {
  const koFiUrl = process.env.KO_FI_URL || ''
  const goalEur = Number(process.env.SUPPORT_GOAL_EUR) || 0
  const raisedEur = Number(process.env.SUPPORT_RAISED_EUR) || 0

  const monthName = new Date().toLocaleDateString('es-ES', { month: 'long' })

  return NextResponse.json({
    koFiUrl,
    goalEur,
    raisedEur,
    monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
  })
}
