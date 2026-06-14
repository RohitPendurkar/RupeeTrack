import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'

export async function GET() {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const investments = await db.investment.findMany({
      where: { userId: user.id },
      orderBy: { startDate: 'desc' },
    })
    return NextResponse.json(investments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch investments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const investment = await db.investment.create({
      data: {
        name: body.name,
        type: body.type,
        investedAmount: body.investedAmount,
        currentValue: body.currentValue,
        startDate: new Date(body.startDate),
        maturityDate: body.maturityDate ? new Date(body.maturityDate) : null,
        returnRate: body.returnRate || null,
        notes: body.notes || null,
        userId: user.id,
      },
    })
    return NextResponse.json(investment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create investment' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const existing = await db.investment.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const investment = await db.investment.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        maturityDate: data.maturityDate ? new Date(data.maturityDate) : undefined,
      },
    })
    return NextResponse.json(investment)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update investment' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const existing = await db.investment.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.investment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete investment' }, { status: 500 })
  }
}
