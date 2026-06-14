"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { formatINR } from "@/lib/helpers"
import { motion } from "framer-motion"
import {
  Heart, PiggyBank, Wallet, Shield, TrendingUp, Bell, BarChart3,
  CheckCircle2, Target, Zap, Loader2,
} from "lucide-react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
}

const statusColors: Record<string, string> = {
  excellent: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
  good: "text-green-600 bg-green-100 dark:bg-green-900/30",
  fair: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  poor: "text-rose-600 bg-rose-100 dark:bg-rose-900/30",
}

const statusLabels: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Needs Work",
}

const iconMap: Record<string, React.ReactNode> = {
  PiggyBank: <PiggyBank className="h-5 w-5" />,
  Wallet: <Wallet className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  Bell: <Bell className="h-5 w-5" />,
  BarChart3: <BarChart3 className="h-5 w-5" />,
}

export function FinancialHealthTab() {
  const { selectedMonth, selectedYear } = useAppStore()
  const [healthData, setHealthData] = useState<{
    overallScore: number
    grade: string
    gradeColor: string
    gradeDescription: string
    categories: {
      id: string; label: string; description: string; score: number; maxScore: number
      icon: string; color: string; status: string; tip: string
    }[]
    topRecommendations: string[]
    quickWins: string[]
    monthlyComparison: {
      incomeVsExpense: { income: number; expense: number; ratio: number }
      savingsTarget: { current: number; target: number; percentage: number }
      investmentTarget: { current: number; target: number; percentage: number }
    }
  } | null>(null)
  const [healthLoading, setHealthLoading] = useState(false)

  const reloadHealth = async () => {
    setHealthLoading(true)
    try {
      const res = await fetch(`/api/financial-health?month=${selectedMonth}&year=${selectedYear}`)
      if (res.ok) {
        const data = await res.json()
        setHealthData(data)
      } else {
        toast.error("Failed to load financial health data")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setHealthLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    const loadData = async () => {
      setHealthLoading(true)
      try {
        const res = await fetch(`/api/financial-health?month=${selectedMonth}&year=${selectedYear}`, {
          signal: controller.signal,
        })
        if (res.ok) {
          const data = await res.json()
          if (!controller.signal.aborted) setHealthData(data)
        } else {
          if (!controller.signal.aborted) toast.error("Failed to load financial health data")
        }
      } catch {
        if (!controller.signal.aborted) toast.error("Something went wrong")
      } finally {
        if (!controller.signal.aborted) setHealthLoading(false)
      }
    }

    loadData()
    return () => controller.abort()
  }, [selectedMonth, selectedYear])

  return (
    <motion.div key="health" {...fadeUp} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Financial Health</h2>
        <p className="text-muted-foreground text-sm">Your personalized financial wellness score</p>
      </div>

      {healthLoading && !healthData && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {healthData && (
        <>
          <Card className="border-2 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent" />
            <CardContent className="pt-8 pb-8 relative">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative flex-shrink-0">
                  <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
                    <circle cx="90" cy="90" r="75" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="12" />
                    <circle
                      cx="90" cy="90" r="75" fill="none"
                      stroke={healthData.gradeColor}
                      strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={`${(healthData.overallScore / 100) * 471} 471`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold" style={{ color: healthData.gradeColor }}>
                      {healthData.overallScore}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">out of 100</span>
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                    <span className="text-5xl font-black" style={{ color: healthData.gradeColor }}>
                      {healthData.grade}
                    </span>
                    <Badge
                      className="text-sm px-3 py-1"
                      style={{
                        backgroundColor: healthData.gradeColor + "20",
                        color: healthData.gradeColor,
                        borderColor: healthData.gradeColor + "40",
                      }}
                    >
                      {healthData.overallScore >= 75 ? "Healthy" : healthData.overallScore >= 50 ? "Moderate" : "Needs Attention"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                    {healthData.gradeDescription}
                  </p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={reloadHealth} disabled={healthLoading}>
                    {healthLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Refresh Score
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthData.categories.map((cat) => (
              <Card key={cat.id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: cat.color }} />
                <CardContent className="pt-5 pl-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + "20", color: cat.color }}>
                        {iconMap[cat.icon] || <Heart className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{cat.label}</p>
                        <p className="text-xs text-muted-foreground">{cat.description}</p>
                      </div>
                    </div>
                    <Badge className={statusColors[cat.status] || statusColors.fair}>
                      {statusLabels[cat.status] || cat.status}
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{cat.score} / {cat.maxScore} pts</span>
                      <span className="text-muted-foreground">{Math.round((cat.score / cat.maxScore) * 100)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${(cat.score / cat.maxScore) * 100}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-2.5 group-hover:bg-muted/80 transition-colors">
                    <span className="font-medium text-foreground">Tip:</span> {cat.tip}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Monthly Snapshot</CardTitle>
                <CardDescription>How this month compares to ideal targets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">Income vs Expenses</span>
                    <span className="text-muted-foreground">{healthData.monthlyComparison.incomeVsExpense.ratio}% spent</span>
                  </div>
                  <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-muted">
                    <div className="bg-emerald-500 rounded-l-full transition-all" style={{ width: `${Math.max(5, 100 - healthData.monthlyComparison.incomeVsExpense.ratio)}%` }} />
                    <div className="bg-rose-400 rounded-r-full transition-all" style={{ width: `${Math.min(95, healthData.monthlyComparison.incomeVsExpense.ratio)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Income: {formatINR(healthData.monthlyComparison.incomeVsExpense.income)}</span>
                    <span>Expense: {formatINR(healthData.monthlyComparison.incomeVsExpense.expense)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">Savings Target (20% of income)</span>
                    <span className="text-muted-foreground">{healthData.monthlyComparison.savingsTarget.percentage}% achieved</span>
                  </div>
                  <Progress value={Math.min(healthData.monthlyComparison.savingsTarget.percentage, 100)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Saved: {formatINR(healthData.monthlyComparison.savingsTarget.current)}</span>
                    <span>Target: {formatINR(healthData.monthlyComparison.savingsTarget.target)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">Investment Target (30% of income)</span>
                    <span className="text-muted-foreground">{healthData.monthlyComparison.investmentTarget.percentage}% achieved</span>
                  </div>
                  <Progress value={Math.min(healthData.monthlyComparison.investmentTarget.percentage, 100)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Current: {formatINR(healthData.monthlyComparison.investmentTarget.current)}</span>
                    <span>Target: {formatINR(healthData.monthlyComparison.investmentTarget.target)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-500" />
                    Top Recommendations
                  </CardTitle>
                  <CardDescription>Focus areas that will improve your score the most</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {healthData.topRecommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                        <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-sm leading-relaxed">{rec}</p>
                      </div>
                    ))}
                    {healthData.topRecommendations.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                        <p className="text-sm font-medium">All areas are healthy!</p>
                        <p className="text-xs">Keep up the great work.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Quick Wins
                  </CardTitle>
                  <CardDescription>Simple actions you can take today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {healthData.quickWins.map((win, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                        <p className="text-sm">{win}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {!healthData && !healthLoading && (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Calculate your financial health score</p>
            <p className="text-sm">Based on your spending, savings, and investments</p>
            <Button onClick={reloadHealth} className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
              <Heart className="h-4 w-4 mr-2" /> Check Financial Health
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
