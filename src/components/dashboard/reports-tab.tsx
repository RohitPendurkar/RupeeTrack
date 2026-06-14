"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { formatINR, percentage } from "@/lib/helpers"
import { motion } from "framer-motion"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import { HealthIndicator } from "./health-indicator"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell,
} from "recharts"
import type { DashboardData } from "@/types/dashboard"

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
}

export function ReportsTab() {
  const { selectedMonth, selectedYear } = useAppStore()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadData = async () => {
      try {
        const res = await fetch(`/api/dashboard?month=${selectedMonth}&year=${selectedYear}`, {
          signal: controller.signal,
        })
        if (res.ok) {
          const data = await res.json()
          if (!controller.signal.aborted) setDashboard(data)
        }
      } catch (err) {
        if (!controller.signal.aborted) console.error("Dashboard fetch error:", err)
      }
    }

    loadData()
    return () => controller.abort()
  }, [selectedMonth, selectedYear])

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold animate-pulse">₹</div>
      </div>
    )
  }

  const d = dashboard

  const monthlyData = [
    { month: "Jan", income: 75000, expense: 52000 },
    { month: "Feb", income: 75000, expense: 48000 },
    { month: "Mar", income: 78000, expense: 61000 },
    { month: "Apr", income: 75000, expense: 55000 },
    { month: "May", income: 80000, expense: 67000 },
    { month: "Jun", income: 75000, expense: d.totalExpense },
  ]

  return (
    <motion.div key="reports" {...fadeUp} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
        <p className="text-muted-foreground text-sm">Visual insights into your finances</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Income vs Expenses (6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(value: number) => formatINR(value)} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Spending Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {d.spendingByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={d.spendingByCategory.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="categoryName" width={100} />
                <Tooltip formatter={(value: number) => formatINR(value)} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} name="Amount">
                  {d.spendingByCategory.slice(0, 8).map((entry, i) => (
                    <Cell key={i} fill={entry.categoryColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial Health Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <HealthIndicator label="Savings Rate" value={d.savingsRate} target={30} unit="%" color="emerald" />
            <HealthIndicator label="Budget Utilization" value={d.budget.totalBudget > 0 ? percentage(d.budget.totalSpent, d.budget.totalBudget) : 0} target={90} unit="%" color="amber" />
            <HealthIndicator label="Investment Rate" value={d.totalIncome > 0 ? Math.round((d.investments.totalInvested / (d.totalIncome * 12)) * 100) : 0} target={20} unit="%" color="violet" />
            <HealthIndicator label="Debt-to-Income" value={0} target={30} unit="%" color="rose" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
