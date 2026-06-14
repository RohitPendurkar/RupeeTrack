import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// ─── Types ──────────────────────────────────────────────────────────────────

interface HealthCategory {
  id: string
  label: string
  description: string
  score: number
  maxScore: number
  icon: string
  color: string
  status: "excellent" | "good" | "fair" | "poor"
  tip: string
}

interface FinancialHealthResult {
  overallScore: number
  grade: string
  gradeColor: string
  gradeDescription: string
  categories: HealthCategory[]
  topRecommendations: string[]
  quickWins: string[]
  monthlyComparison: {
    incomeVsExpense: { income: number; expense: number; ratio: number }
    savingsTarget: { current: number; target: number; percentage: number }
    investmentTarget: { current: number; target: number; percentage: number }
  }
}

// ─── Scoring Logic ──────────────────────────────────────────────────────────

function getStatus(score: number, max: number): "excellent" | "good" | "fair" | "poor" {
  const pct = (score / max) * 100
  if (pct >= 80) return "excellent"
  if (pct >= 60) return "good"
  if (pct >= 40) return "fair"
  return "poor"
}

function getGrade(score: number): { grade: string; color: string; description: string } {
  if (score >= 85) return { grade: "A+", color: "#10b981", description: "Outstanding! You're a financial superstar." }
  if (score >= 75) return { grade: "A", color: "#10b981", description: "Excellent financial health. Keep it up!" }
  if (score >= 65) return { grade: "B+", color: "#22c55e", description: "Good management. Minor improvements possible." }
  if (score >= 55) return { grade: "B", color: "#84cc16", description: "Decent shape. Some areas need attention." }
  if (score >= 45) return { grade: "C+", color: "#eab308", description: "Fair. Focus on the weak areas below." }
  if (score >= 35) return { grade: "C", color: "#f97316", description: "Needs work. Follow the recommendations." }
  if (score >= 25) return { grade: "D", color: "#ef4444", description: "Concerning. Take immediate action." }
  return { grade: "F", color: "#dc2626", description: "Critical. Seek financial planning help." }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const url = new URL(req.url)
    const month = parseInt(url.searchParams.get("month") || String(new Date().getMonth() + 1))
    const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()))

    // ─── Fetch Data ──────────────────────────────────────────────────────

    const [transactions, budgets, goals, investments, bills] = await Promise.all([
      db.transaction.findMany({
        where: { userId: user.id, date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } },
        include: { category: true },
      }),
      db.budget.findMany({
        where: { userId: user.id, month, year },
        include: { category: true },
      }),
      db.savingsGoal.findMany({ where: { userId: user.id } }),
      db.investment.findMany({ where: { userId: user.id } }),
      db.billReminder.findMany({ where: { userId: user.id } }),
    ])

    // Previous month data for trend comparison
    let prevMonth = month - 1
    let prevYear = year
    if (prevMonth < 1) { prevMonth = 12; prevYear-- }

    const prevTransactions = await db.transaction.findMany({
      where: { userId: user.id, date: { gte: new Date(prevYear, prevMonth - 1, 1), lt: new Date(prevYear, prevMonth, 1) } },
      include: { category: true },
    })

    // ─── Calculate Metrics ───────────────────────────────────────────────

    const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
    const savings = totalIncome - totalExpense
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0

    const prevIncome = prevTransactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const prevExpense = prevTransactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)

    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
    const totalBudgetSpent = budgets.reduce((s, b) => {
      const catSpent = transactions
        .filter(t => t.type === "expense" && t.categoryId === b.categoryId)
        .reduce((sum, t) => sum + t.amount, 0)
      return s + Math.min(catSpent, b.amount * 1.5) // Cap to avoid extreme skew
    }, 0)
    const budgetUtilization = totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : 0

    const totalGoalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)
    const totalGoalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0)

    const totalInvested = investments.reduce((s, i) => s + i.investedAmount, 0)
    const totalCurrentValue = investments.reduce((s, i) => s + i.currentValue, 0)
    const investmentTypes = new Set(investments.map(i => i.type))

    const totalBills = bills.length
    const paidBills = bills.filter(b => b.isPaid).length
    const overdueBills = bills.filter(b => !b.isPaid && new Date(b.dueDate) < new Date()).length
    const billPayRate = totalBills > 0 ? (paidBills / totalBills) * 100 : 100 // 100% if no bills

    // ─── Score Categories ────────────────────────────────────────────────

    // 1. Savings Rate (0-25 points)
    // Target: 20% savings rate (ideal for Indian middle class)
    let savingsScore = 0
    if (savingsRate >= 30) savingsScore = 25
    else if (savingsRate >= 20) savingsScore = 22
    else if (savingsRate >= 15) savingsScore = 18
    else if (savingsRate >= 10) savingsScore = 14
    else if (savingsRate >= 5) savingsScore = 10
    else if (savingsRate >= 0) savingsScore = 5
    else savingsScore = 0 // Negative savings = 0

    const savingsTip = savingsRate >= 20
      ? "Great savings rate! Consider increasing your SIP contributions."
      : savingsRate >= 10
        ? "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings."
        : "Cut non-essential subscriptions and dining out to boost savings."

    // 2. Budget Discipline (0-20 points)
    // How well expenses track to budget
    let budgetScore = 0
    if (budgets.length === 0) {
      budgetScore = 5 // No budgets set - small default score
    } else if (budgetUtilization <= 90) {
      budgetScore = 20
    } else if (budgetUtilization <= 100) {
      budgetScore = 17
    } else if (budgetUtilization <= 110) {
      budgetScore = 12
    } else if (budgetUtilization <= 130) {
      budgetScore = 7
    } else {
      budgetScore = 3
    }

    const budgetTip = budgets.length === 0
      ? "Set budgets for your top expense categories to start tracking."
      : budgetUtilization <= 100
        ? "You're within budget! Review allocations monthly."
        : "Review your overspent categories and adjust budgets or cut spending."

    // 3. Emergency Fund Adequacy (0-20 points)
    // Target: 6 months of expenses in savings goals
    const monthlyExpenses = totalExpense || 1
    const emergencyMonths = totalGoalCurrent / monthlyExpenses
    let emergencyScore = 0
    if (goals.length === 0) {
      emergencyScore = 3
    } else if (emergencyMonths >= 6) {
      emergencyScore = 20
    } else if (emergencyMonths >= 4) {
      emergencyScore = 16
    } else if (emergencyMonths >= 3) {
      emergencyScore = 13
    } else if (emergencyMonths >= 2) {
      emergencyScore = 9
    } else if (emergencyMonths >= 1) {
      emergencyScore = 5
    } else {
      emergencyScore = 2
    }

    const emergencyTip = emergencyMonths >= 6
      ? "Emergency fund looks solid! Focus on growing investments now."
      : emergencyMonths >= 3
        ? `You have ~${Math.round(emergencyMonths)} months covered. Aim for 6 months.`
        : "Build an emergency fund covering 6 months of expenses as top priority."

    // 4. Investment Diversification (0-15 points)
    // More types = better diversification
    const typeCount = investmentTypes.size
    let diversificationScore = 0
    if (investments.length === 0) {
      diversificationScore = 0
    } else if (typeCount >= 5) {
      diversificationScore = 15
    } else if (typeCount >= 4) {
      diversificationScore = 13
    } else if (typeCount >= 3) {
      diversificationScore = 10
    } else if (typeCount >= 2) {
      diversificationScore = 7
    } else {
      diversificationScore = 4
    }

    const diversificationTip = investments.length === 0
      ? "Start investing! Even a small SIP in an index fund makes a difference."
      : typeCount >= 4
        ? "Great diversification! Rebalance periodically."
        : "Diversify across asset classes: equity (MF/SIP), debt (FD/PPF), and gold."

    // 5. Bill Management (0-10 points)
    let billScore = 0
    if (totalBills === 0) {
      billScore = 8 // No bills = decent by default
    } else if (billPayRate >= 95 && overdueBills === 0) {
      billScore = 10
    } else if (billPayRate >= 80 && overdueBills === 0) {
      billScore = 8
    } else if (overdueBills === 0) {
      billScore = 6
    } else if (overdueBills <= 1) {
      billScore = 4
    } else {
      billScore = 2
    }

    const billTip = overdueBills > 0
      ? `You have ${overdueBills} overdue bill${overdueBills > 1 ? "s" : ""}. Pay immediately to avoid penalties.`
      : totalBills === 0
        ? "Add your recurring bills to track due dates and avoid late fees."
        : "All bills on time! Set up auto-pay for convenience."

    // 6. Expense Trend (0-10 points)
    // Is spending decreasing or increasing compared to last month?
    let trendScore = 5 // Neutral if no previous data
    const expenseChange = prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : 0

    if (prevExpense > 0) {
      if (expenseChange <= -10) trendScore = 10
      else if (expenseChange <= -5) trendScore = 8
      else if (expenseChange <= 0) trendScore = 7
      else if (expenseChange <= 5) trendScore = 6
      else if (expenseChange <= 10) trendScore = 4
      else if (expenseChange <= 20) trendScore = 2
      else trendScore = 1
    }

    const trendTip = prevExpense === 0
      ? "Keep tracking expenses to see your monthly trends."
      : expenseChange <= 0
        ? "Expenses are down from last month. Great discipline!"
        : expenseChange <= 10
          ? "Spending is slightly up. Review recent purchases."
          : "Spending jumped significantly. Check for unnecessary expenses."

    // ─── Compile Results ─────────────────────────────────────────────────

    const categories: HealthCategory[] = [
      {
        id: "savings",
        label: "Savings Rate",
        description: "How much of your income you save each month",
        score: savingsScore,
        maxScore: 25,
        icon: "PiggyBank",
        color: "#10b981",
        status: getStatus(savingsScore, 25),
        tip: savingsTip,
      },
      {
        id: "budget",
        label: "Budget Discipline",
        description: "How well you stick to your monthly budgets",
        score: budgetScore,
        maxScore: 20,
        icon: "Wallet",
        color: "#8b5cf6",
        status: getStatus(budgetScore, 20),
        tip: budgetTip,
      },
      {
        id: "emergency",
        label: "Emergency Fund",
        description: "Months of expenses covered by your savings",
        score: emergencyScore,
        maxScore: 20,
        icon: "Shield",
        color: "#f97316",
        status: getStatus(emergencyScore, 20),
        tip: emergencyTip,
      },
      {
        id: "diversification",
        label: "Investment Diversification",
        description: "Spread of investments across asset classes",
        score: diversificationScore,
        maxScore: 15,
        icon: "TrendingUp",
        color: "#0ea5e9",
        status: getStatus(diversificationScore, 15),
        tip: diversificationTip,
      },
      {
        id: "bills",
        label: "Bill Management",
        description: "Timely payment of bills and dues",
        score: billScore,
        maxScore: 10,
        icon: "Bell",
        color: "#eab308",
        status: getStatus(billScore, 10),
        tip: billTip,
      },
      {
        id: "trend",
        label: "Expense Trend",
        description: "Month-over-month spending direction",
        score: trendScore,
        maxScore: 10,
        icon: "BarChart3",
        color: "#ec4899",
        status: getStatus(trendScore, 10),
        tip: trendTip,
      },
    ]

    const overallScore = categories.reduce((s, c) => s + c.score, 0)
    const gradeInfo = getGrade(overallScore)

    // ─── Recommendations ─────────────────────────────────────────────────

    const topRecommendations: string[] = []
    const quickWins: string[] = []

    // Sort categories by score (worst first)
    const sortedCats = [...categories].sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore))

    for (const cat of sortedCats) {
      if (cat.score / cat.maxScore < 0.8) {
        topRecommendations.push(cat.tip)
      }
    }

    // Quick wins - simple actionable items
    if (budgets.length === 0) quickWins.push("Set a budget for your top 3 expense categories")
    if (goals.length === 0) quickWins.push("Create an emergency fund savings goal")
    if (investments.length === 0) quickWins.push("Start a SIP with as little as ₹500/month")
    if (totalBills === 0) quickWins.push("Add your recurring bills (rent, EMIs, subscriptions)")
    if (savingsRate < 20) quickWins.push("Cancel one unused subscription this week")
    if (quickWins.length === 0) quickWins.push("Review and rebalance your investment portfolio")

    // ─── Monthly Comparison ──────────────────────────────────────────────

    const monthlySalary = user.monthlySalary || totalIncome
    const savingsTarget20 = monthlySalary * 0.2
    const investmentTarget30 = monthlySalary * 0.3 // 30% of income towards investments is ideal

    const result: FinancialHealthResult = {
      overallScore,
      grade: gradeInfo.grade,
      gradeColor: gradeInfo.color,
      gradeDescription: gradeInfo.description,
      categories,
      topRecommendations: topRecommendations.slice(0, 4),
      quickWins: quickWins.slice(0, 3),
      monthlyComparison: {
        incomeVsExpense: {
          income: totalIncome,
          expense: totalExpense,
          ratio: totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0,
        },
        savingsTarget: {
          current: Math.max(0, savings),
          target: savingsTarget20,
          percentage: savingsTarget20 > 0 ? Math.round((Math.max(0, savings) / savingsTarget20) * 100) : 0,
        },
        investmentTarget: {
          current: totalCurrentValue,
          target: investmentTarget30,
          percentage: investmentTarget30 > 0 ? Math.round((totalCurrentValue / investmentTarget30) * 100) : 0,
        },
      },
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Financial health error:", error)
    return NextResponse.json({ error: "Failed to calculate financial health" }, { status: 500 })
  }
}
