import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

/**
 * GET /api/partners
 * Public — returns only the active partner (for banner display).
 * If no partner is active, returns { partner: null }.
 */
export async function GET() {
  try {
    const partner = await db.partner.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' }, // most recent active partner wins
    })
    return NextResponse.json({ partner })
  } catch (error) {
    console.error('Failed to fetch partner:', error)
    return NextResponse.json({ partner: null })
  }
}

/**
 * POST /api/partners
 * Admin-only — creates a new partner.
 * If `active` is true, deactivates all other partners first (only one active at a time).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión como administrador.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, imageUrl, linkUrl, active } = body || {}

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'El nombre del socio es obligatorio' },
        { status: 400 }
      )
    }
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return NextResponse.json(
        { error: 'La URL de la imagen es obligatoria' },
        { status: 400 }
      )
    }
    if (!linkUrl || typeof linkUrl !== 'string' || !linkUrl.trim()) {
      return NextResponse.json(
        { error: 'La URL de destino es obligatoria' },
        { status: 400 }
      )
    }

    // If activating this partner, deactivate all others first
    if (active) {
      await db.partner.updateMany({
        where: { active: true },
        data: { active: false },
      })
    }

    const partner = await db.partner.create({
      data: {
        name: name.trim(),
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl.trim(),
        active: active !== false, // default true unless explicitly false
      },
    })

    return NextResponse.json({ partner }, { status: 201 })
  } catch (error) {
    console.error('Failed to create partner:', error)
    return NextResponse.json(
      { error: 'No se pudo crear el socio' },
      { status: 500 }
    )
  }
}
