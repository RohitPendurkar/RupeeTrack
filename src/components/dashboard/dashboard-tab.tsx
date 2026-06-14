"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { formatINR, formatINRShort, percentage } from "@/lib/helpers"
import { motion } from "framer-motion"
import { ArrowUpRight, ArrowDownRight, PiggyBank, TrendingUp, CheckCircle2, Clock } from "lucide-react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SummaryCard } from "./summary-card"
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts"
import type { DashboardData } from "@/types/dashboard"

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
}

export function DashboardTab() {
  const { selectedMonth, selectedYear } = useAppStore()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const loadData = async () => {
      try {
        setError(null)
        const res = await fetch(`/api/dashboard?month=${selectedMonth}&year=${selectedYear}`, {
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        if (!controller.signal.aborted) {
          if (res.ok) {
            const data = await res.json()
            setDashboard(data)
            setError(null)
          } else {
            const errBody = await res.json().catch(() => ({}))
            setError(errBody.error || `Request failed (${res.status})`)
          }
        }
      } catch (err) {
        clearTimeout(timeoutId)
        if (!controller.signal.aborted) {
          const message = err instanceof DOMException && err.name === "AbortError"
            ? "Request timed out. Please try again."
            : "Network error. Please check your connection."
          setError(message)
        }
      }
    }

    loadData()
    return () => { clearTimeout(timeoutId); controller.abort() }
  }, [selectedMonth, selectedYear, retryCount])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <p className="text-destructive font-medium mb-1">Failed to load dashboard</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={() => setRetryCount(c => c + 1)}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold animate-pulse">₹</div>
      </div>
    )
  }

  const d = dashboard

  return (
    <motion.div key="dashboard" {...fadeUp} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Monthly Income"
          value={formatINR(d.totalIncome)}
          icon={<ArrowUpRight className="h-5 w-5" />}
          color="emerald"
          subtitle={`${d.incomeCount} transactions`}
        />
        <SummaryCard
          title="Monthly Expenses"
          value={formatINR(d.totalExpense)}
          icon={<ArrowDownRight className="h-5 w-5" />}
          color="rose"
          subtitle={`${d.expenseCount} transactions`}
        />
        <SummaryCard
          title="Savings"
          value={formatINR(d.savings)}
          icon={<PiggyBank className="h-5 w-5" />}
          color={d.savings >= 0 ? "teal" : "red"}
          subtitle={`${d.savingsRate}% savings rate`}
        />
        <SummaryCard
          title="Investments"
          value={formatINRShort(d.investments.totalCurrentValue)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="violet"
          subtitle={`${d.investments.returnsPercentage}% returns`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Spending by Category</CardTitle>
            <CardDescription>Where your money goes this month</CardDescription>
          </CardHeader>
          <CardContent>
            {d.spendingByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={d.spendingByCategory}
                    cx="50%" cy="45%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="total" nameKey="categoryName"
                  >
                    {d.spendingByCategory.map((entry, index) => (
                      <Cell key={index} fill={entry.categoryColor} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatINR(value)} />
                  <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No expenses this month</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily Spending Trend</CardTitle>
            <CardDescription>Last 30 days expense flow</CardDescription>
          </CardHeader>
          <CardContent>
            {d.dailySpending.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={d.dailySpending}>
                  <defs>
                    <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tickFormatter={(v: string) => new Date(v).getDate().toString()} className="text-xs" />
                  <YAxis tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`} className="text-xs" />
                  <Tooltip formatter={(value: number) => formatINR(value)} labelFormatter={(label: string) => new Date(label).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" fill="url(#colorSpending)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">No spending data</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Budget Overview</CardTitle>
                <CardDescription>
                  {formatINR(d.budget.totalSpent)} of {formatINR(d.budget.totalBudget)} used
                </CardDescription>
              </div>
              <Badge variant={d.budget.totalSpent > d.budget.totalBudget ? "destructive" : "secondary"}>
                {percentage(d.budget.totalSpent, d.budget.totalBudget)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={Math.min(percentage(d.budget.totalSpent, d.budget.totalBudget), 100)} className="h-2 mb-4" />
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {d.budget.items.map((item) => {
                const pct = percentage(item.spent, item.amount)
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.category.name}</span>
                      <span className="text-muted-foreground">
                        {formatINR(item.spent)} / {formatINR(item.amount)}
                      </span>
                    </div>
                    <Progress value={Math.min(pct, 100)} className="h-1.5" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upcoming Bills</CardTitle>
            <CardDescription>Payments due soon</CardDescription>
          </CardHeader>
          <CardContent>
            {d.upcomingBills.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {d.upcomingBills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{bill.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(bill.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">{formatINR(bill.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-sm">All bills paid!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
          <CardDescription>Latest activity this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {d.recentTransactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: txn.category.color }}
                  >
                    {txn.category.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{txn.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {txn.category.name} · {new Date(txn.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${txn.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                  {txn.type === "income" ? "+" : "-"}{formatINR(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
