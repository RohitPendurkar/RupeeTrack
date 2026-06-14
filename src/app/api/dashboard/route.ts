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

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 1)

    // Monthly income & expense totals
    const incomeAgg = await db.transaction.aggregate({
      where: { type: 'income', userId: user.id, date: { gte: startDate, lt: endDate } },
      _sum: { amount: true },
      _count: true,
    })

    const expenseAgg = await db.transaction.aggregate({
      where: { type: 'expense', userId: user.id, date: { gte: startDate, lt: endDate } },
      _sum: { amount: true },
      _count: true,
    })

    const totalIncome = incomeAgg._sum.amount || 0
    const totalExpense = expenseAgg._sum.amount || 0
    const savings = totalIncome - totalExpense
    const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0

    // Category-wise spending
    const categorySpending = await db.transaction.findMany({
      where: { type: 'expense', userId: user.id, date: { gte: startDate, lt: endDate } },
      include: { category: true },
    })

    const spendingByCategory = categorySpending.reduce((acc, txn) => {
      const key = txn.categoryId
      if (!acc[key]) {
        acc[key] = {
          categoryId: txn.categoryId,
          categoryName: txn.category.name,
          categoryIcon: txn.category.icon,
          categoryColor: txn.category.color,
          total: 0,
          count: 0,
        }
      }
      acc[key].total += txn.amount
      acc[key].count += 1
      return acc
    }, {} as Record<string, { categoryId: string; categoryName: string; categoryIcon: string; categoryColor: string; total: number; count: number }>)

    // Recent transactions
    const recentTransactions = await db.transaction.findMany({
      where: { userId: user.id, date: { gte: startDate, lt: endDate } },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: 10,
    })

    // Upcoming bills
    const upcomingBills = await db.billReminder.findMany({
      where: { userId: user.id, isPaid: false, dueDate: { gte: new Date() } },
      orderBy: { dueDate: 'asc' },
      take: 5,
    })

    // Investment summary
    const investments = await db.investment.findMany({ where: { userId: user.id } })
    const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0)
    const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
    const totalReturns = totalCurrentValue - totalInvested

    // Budget overview
    const budgets = await db.budget.findMany({
      where: { month, year, userId: user.id },
      include: { category: true },
    })

    const budgetOverview = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await db.transaction.aggregate({
          where: { categoryId: budget.categoryId, type: 'expense', userId: user.id, date: { gte: startDate, lt: endDate } },
          _sum: { amount: true },
        })
        return { ...budget, spent: spent._sum.amount || 0 }
      })
    )

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
    const totalSpentOnBudget = budgetOverview.reduce((sum, b) => sum + b.spent, 0)

    // Savings goals
    const goals = await db.savingsGoal.findMany({
      where: { userId: user.id },
      include: { contributions: { orderBy: { date: 'desc' }, take: 3 } },
    })

    // Daily spending for chart
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const dailySpending = await db.transaction.findMany({
      where: { type: 'expense', userId: user.id, date: { gte: thirtyDaysAgo } },
      select: { date: true, amount: true },
      orderBy: { date: 'asc' },
    })

    const dailyMap = new Map<string, number>()
    dailySpending.forEach((txn) => {
      const dateKey = txn.date.toISOString().split('T')[0]
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + txn.amount)
    })
    const dailySpendingChart = Array.from(dailyMap.entries()).map(([date, amount]) => ({ date, amount }))

    const sortedCategories = Object.values(spendingByCategory).sort((a, b) => b.total - a.total)
    const topCategories = sortedCategories.slice(0, 8)
    const othersTotal = sortedCategories.slice(8).reduce((sum, c) => sum + c.total, 0)
    const othersCount = sortedCategories.slice(8).reduce((sum, c) => sum + c.count, 0)
    const finalSpendingByCategory = [
      ...topCategories,
      ...(othersTotal > 0 ? [{
        categoryId: 'others',
        categoryName: 'Others',
        categoryIcon: 'MoreHorizontal',
        categoryColor: '#6b7280',
        total: othersTotal,
        count: othersCount,
      }] : []),
    ]

    return NextResponse.json({
      month, year, totalIncome, totalExpense, savings, savingsRate,
      incomeCount: incomeAgg._count, expenseCount: expenseAgg._count,
      spendingByCategory: finalSpendingByCategory,
      recentTransactions, upcomingBills,
      investments: {
        totalInvested, totalCurrentValue, totalReturns,
        returnsPercentage: totalInvested > 0 ? Math.round((totalReturns / totalInvested) * 100 * 100) / 100 : 0,
        breakdown: investments,
      },
      budget: { totalBudget, totalSpent: totalSpentOnBudget, items: budgetOverview },
      goals, dailySpending: dailySpendingChart,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
