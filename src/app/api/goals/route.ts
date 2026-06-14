import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'

export async function GET() {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const goals = await db.savingsGoal.findMany({
      where: { userId: user.id },
      include: { contributions: { orderBy: { date: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(goals)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()

    if (body.action === 'contribute') {
      // Verify goal belongs to user
      const goal = await db.savingsGoal.findFirst({ where: { id: body.goalId, userId: user.id } })
      if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

      const contribution = await db.savingsContribution.create({
        data: {
          goalId: body.goalId,
          amount: body.amount,
          date: new Date(body.date || new Date()),
          note: body.note || null,
        },
      })
      await db.savingsGoal.update({
        where: { id: body.goalId },
        data: { currentAmount: { increment: body.amount } },
      })
      return NextResponse.json(contribution, { status: 201 })
    }

    const goal = await db.savingsGoal.create({
      data: {
        name: body.name,
        targetAmount: body.targetAmount,
        currentAmount: body.currentAmount || 0,
        deadline: body.deadline ? new Date(body.deadline) : null,
        icon: body.icon || '🎯',
        color: body.color || '#10b981',
        userId: user.id,
      },
    })
    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const existing = await db.savingsGoal.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const goal = await db.savingsGoal.update({
      where: { id },
      data: { ...data, deadline: data.deadline ? new Date(data.deadline) : undefined },
    })
    return NextResponse.json(goal)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const existing = await db.savingsGoal.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.savingsGoal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
