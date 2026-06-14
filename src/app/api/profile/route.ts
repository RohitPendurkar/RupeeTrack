import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'

export async function GET() {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const profile = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, monthlySalary: true, taxRegime: true, currency: true, createdAt: true, updatedAt: true },
    })
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    return NextResponse.json(profile)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        name: body.name,
        monthlySalary: body.monthlySalary,
        taxRegime: body.taxRegime,
      },
      select: { id: true, name: true, email: true, monthlySalary: true, taxRegime: true, currency: true, createdAt: true, updatedAt: true },
    })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
