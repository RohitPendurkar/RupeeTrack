import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'

export async function GET(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const type = searchParams.get('type')
    const categoryId = searchParams.get('categoryId')

    const where: Record<string, unknown> = { userId: user.id }

    if (month && year) {
      const m = parseInt(month)
      const y = parseInt(year)
      where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) }
    } else if (year) {
      const y = parseInt(year)
      where.date = { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) }
    }

    if (type) where.type = type
    if (categoryId) where.categoryId = categoryId

    const transactions = await db.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const transaction = await db.transaction.create({
      data: {
        amount: body.amount,
        type: body.type,
        description: body.description,
        date: new Date(body.date),
        categoryId: body.categoryId,
        userId: user.id,
        isRecurring: body.isRecurring || false,
        recurringFreq: body.recurringFreq || null,
        tags: body.tags || null,
      },
      include: { category: true },
    })
    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    // Verify ownership
    const existing = await db.transaction.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const transaction = await db.transaction.update({
      where: { id },
      data: { ...data, date: data.date ? new Date(data.date) : undefined },
      include: { category: true },
    })
    return NextResponse.json(transaction)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    // Verify ownership
    const existing = await db.transaction.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.transaction.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
