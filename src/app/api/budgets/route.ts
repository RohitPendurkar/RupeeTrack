import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'

export async function GET(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    const budgets = await db.budget.findMany({
      where: { month, year, userId: user.id },
      include: { category: true },
      orderBy: { category: { name: 'asc' } },
    })

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 1)

    const budgetWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await db.transaction.aggregate({
          where: {
            categoryId: budget.categoryId,
            type: 'expense',
            userId: user.id,
            date: { gte: startDate, lt: endDate },
          },
          _sum: { amount: true },
        })
        return { ...budget, spent: spent._sum.amount || 0 }
      })
    )

    return NextResponse.json(budgetWithSpent)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const budget = await db.budget.upsert({
      where: {
        categoryId_month_year: {
          categoryId: body.categoryId,
          month: body.month,
          year: body.year,
        },
      },
      update: { amount: body.amount },
      create: {
        categoryId: body.categoryId,
        amount: body.amount,
        month: body.month,
        year: body.year,
        userId: user.id,
      },
    })
    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create/update budget' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const existing = await db.budget.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.budget.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 })
  }
}
