import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * GET /api/partners/[id]
 * Admin-only — returns a specific partner by ID.
 * (Public reads use GET /api/partners which returns only the active partner.)
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const partner = await db.partner.findUnique({ where: { id } })

    if (!partner) {
      return NextResponse.json({ error: 'Socio no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ partner })
  } catch (error) {
    console.error('Failed to fetch partner:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

/**
 * PATCH /api/partners/[id]
 * Admin-only — updates a partner.
 * If `active` is being set to true, deactivates all other partners first.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, imageUrl, linkUrl, active } = body || {}

    const existing = await db.partner.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Socio no encontrado' }, { status: 404 })
    }

    // If activating this partner, deactivate all others first
    if (active === true) {
      await db.partner.updateMany({
        where: { active: true, NOT: { id } },
        data: { active: false },
      })
    }

    const partner = await db.partner.update({
      where: { id },
      data: {
        ...(typeof name === 'string' && name.trim() ? { name: name.trim() } : {}),
        ...(typeof imageUrl === 'string' && imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
        ...(typeof linkUrl === 'string' && linkUrl.trim() ? { linkUrl: linkUrl.trim() } : {}),
        ...(typeof active === 'boolean' ? { active } : {}),
      },
    })

    return NextResponse.json({ partner })
  } catch (error) {
    console.error('Failed to update partner:', error)
    return NextResponse.json({ error: 'No se pudo actualizar el socio' }, { status: 500 })
  }
}

/**
 * DELETE /api/partners/[id]
 * Admin-only — deletes a partner.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const existing = await db.partner.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Socio no encontrado' }, { status: 404 })
    }

    await db.partner.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete partner:', error)
    return NextResponse.json({ error: 'No se pudo eliminar el socio' }, { status: 500 })
  }
}

/**
 * GET /api/partners/list
 * Returns ALL partners (admin only) — for the admin panel.
 * We handle this as a separate endpoint to avoid conflict with the public GET.
 */
export async function PUT(_req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const partners = await db.partner.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ partners })
  } catch (error) {
    console.error('Failed to list partners:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
