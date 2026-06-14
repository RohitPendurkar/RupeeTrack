"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { useAppStore, type TabId } from "@/lib/store"
import { formatINR, formatINRShort, getMonthName, percentage } from "@/lib/helpers"
import { ThemeToggle } from "@/components/theme-provider"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Target, TrendingUp,
  Heart, Bell, BarChart3, Menu, X, Plus, IndianRupee,
  ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight,
  Trash2, Edit3, CheckCircle2, AlertCircle, Clock, PiggyBank,
  Landmark, Briefcase, Shield, Percent, CreditCard, MoreHorizontal,
  LogOut, User, Mail, Lock, Eye, EyeOff, Loader2, Zap
} from "lucide-react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Sheet, SheetContent, SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category {
  id: string
  name: string
  type: string
  icon: string
  color: string
  isDefault: boolean
}

interface Transaction {
  id: string
  amount: number
  type: string
  description: string
  date: string
  categoryId: string
  isRecurring: boolean
  recurringFreq: string | null
  tags: string | null
  category: Category
}

interface BudgetItem {
  id: string
  categoryId: string
  amount: number
  month: number
  year: number
  category: Category
  spent: number
}

interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string | null
  icon: string
  color: string
  contributions: { id: string; amount: number; date: string; note: string | null }[]
}

interface Investment {
  id: string
  name: string
  type: string
  investedAmount: number
  currentValue: number
  startDate: string
  maturityDate: string | null
  returnRate: number | null
  notes: string | null
}

interface BillReminder {
  id: string
  name: string
  amount: number
  dueDate: string
  category: string
  isPaid: boolean
  isRecurring: boolean
  recurringFreq: string | null
}

interface DashboardData {
  month: number
  year: number
  totalIncome: number
  totalExpense: number
  savings: number
  savingsRate: number
  incomeCount: number
  expenseCount: number
  spendingByCategory: {
    categoryId: string; categoryName: string; categoryIcon: string
    categoryColor: string; total: number; count: number
  }[]
  recentTransactions: Transaction[]
  upcomingBills: BillReminder[]
  investments: {
    totalInvested: number; totalCurrentValue: number
    totalReturns: number; returnsPercentage: number
    breakdown: Investment[]
  }
  budget: { totalBudget: number; totalSpent: number; items: BudgetItem[] }
  goals: SavingsGoal[]
  dailySpending: { date: string; amount: number }[]
}

// ─── Nav Items ───────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: "transactions", label: "Transactions", icon: <ArrowLeftRight className="h-5 w-5" /> },
  { id: "budgets", label: "Budgets", icon: <Wallet className="h-5 w-5" /> },
  { id: "goals", label: "Savings Goals", icon: <Target className="h-5 w-5" /> },
  { id: "investments", label: "Investments", icon: <TrendingUp className="h-5 w-5" /> },
  { id: "health", label: "Financial Health", icon: <Heart className="h-5 w-5" /> },
  { id: "bills", label: "Bill Reminders", icon: <Bell className="h-5 w-5" /> },
  { id: "reports", label: "Reports", icon: <BarChart3 className="h-5 w-5" /> },
]

const INVESTMENT_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pf: { label: "Provident Fund", icon: <Landmark className="h-4 w-4" />, color: "#0ea5e9" },
  ppf: { label: "Public PF", icon: <Shield className="h-4 w-4" />, color: "#8b5cf6" },
  mutual_fund: { label: "Mutual Fund", icon: <TrendingUp className="h-4 w-4" />, color: "#f97316" },
  fd: { label: "Fixed Deposit", icon: <Landmark className="h-4 w-4" />, color: "#22c55e" },
  sip: { label: "SIP", icon: <Percent className="h-4 w-4" />, color: "#ec4899" },
  stocks: { label: "Stocks", icon: <BarChart3 className="h-4 w-4" />, color: "#ef4444" },
  nps: { label: "NPS", icon: <Briefcase className="h-4 w-4" />, color: "#14b8a6" },
  other: { label: "Other", icon: <MoreHorizontal className="h-4 w-4" />, color: "#6b7280" },
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const { data: session, status } = useSession()
  const { activeTab, setActiveTab, selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useAppStore()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<BudgetItem[]>([])
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [bills, setBills] = useState<BillReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Auth states
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authLoading, setAuthLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "", monthlySalary: "" })
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard?month=${selectedMonth}&year=${selectedYear}`)
      if (res.ok) {
        const data = await res.json()
        setDashboard(data)
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err)
    }
  }, [selectedMonth, selectedYear])

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories")
      if (res.ok) setCategories(await res.json())
    } catch (err) {
      console.error("Categories fetch error:", err)
    }
  }, [])

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch(`/api/transactions?month=${selectedMonth}&year=${selectedYear}`)
      if (res.ok) setTransactions(await res.json())
    } catch (err) {
      console.error("Transactions fetch error:", err)
    }
  }, [selectedMonth, selectedYear])

  // Fetch budgets
  const fetchBudgets = useCallback(async () => {
    try {
      const res = await fetch(`/api/budgets?month=${selectedMonth}&year=${selectedYear}`)
      if (res.ok) setBudgets(await res.json())
    } catch (err) {
      console.error("Budgets fetch error:", err)
    }
  }, [selectedMonth, selectedYear])

  // Fetch goals
  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch("/api/goals")
      if (res.ok) setGoals(await res.json())
    } catch (err) {
      console.error("Goals fetch error:", err)
    }
  }, [])

  // Fetch investments
  const fetchInvestments = useCallback(async () => {
    try {
      const res = await fetch("/api/investments")
      if (res.ok) setInvestments(await res.json())
    } catch (err) {
      console.error("Investments fetch error:", err)
    }
  }, [])

  // Fetch bills
  const fetchBills = useCallback(async () => {
    try {
      const res = await fetch("/api/bills")
      if (res.ok) setBills(await res.json())
    } catch (err) {
      console.error("Bills fetch error:", err)
    }
  }, [])

  // Initial data load - only when authenticated
  useEffect(() => {
    if (status !== "authenticated") return
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchDashboard(), fetchCategories(), fetchTransactions(), fetchBudgets(), fetchGoals(), fetchInvestments(), fetchBills()])
      setLoading(false)
    }
    loadAll()
  }, [fetchDashboard, fetchCategories, fetchTransactions, fetchBudgets, fetchGoals, fetchInvestments, fetchBills, status])

  // Navigate month
  const navigateMonth = (dir: -1 | 1) => {
    let m = selectedMonth + dir
    let y = selectedYear
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setSelectedMonth(m)
    setSelectedYear(y)
  }

  // Handle tab change
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
  }

  // Auth handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginForm.email || !loginForm.password) {
      toast.error("Please fill in all fields")
      return
    }
    setAuthLoading(true)
    try {
      const result = await signIn("credentials", {
        email: loginForm.email,
        password: loginForm.password,
        redirect: false,
      })
      if (result?.error) {
        toast.error(result.error)
      } else if (result?.ok) {
        toast.success("Welcome back!")
        setShowAuthDialog(false)
      }
    } catch {
      toast.error("Login failed. Please try again.")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      toast.error("Please fill in all required fields")
      return
    }
    if (registerForm.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    setAuthLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          password: registerForm.password,
          monthlySalary: registerForm.monthlySalary ? parseFloat(registerForm.monthlySalary) : 0,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Account created! Please sign in.")
        setAuthMode("login")
        setLoginForm({ email: registerForm.email, password: "" })
        setRegisterForm({ name: "", email: "", password: "", monthlySalary: "" })
      } else {
        toast.error(data.error || "Registration failed")
      }
    } catch {
      toast.error("Registration failed. Please try again.")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    setDashboard(null)
    setCategories([])
    setTransactions([])
    setBudgets([])
    setGoals([])
    setInvestments([])
    setBills([])
    toast.success("Logged out successfully")
  }

  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  }

  // ─── Sidebar ─────────────────────────────────────────────────────────────

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            ₹
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              RupeeTrack
            </h1>
            <p className="text-xs text-muted-foreground">Smart Expense Tracker</p>
          </div>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">
            {getMonthName(selectedMonth)} {selectedYear}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === item.id
                ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-500/20"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3">
        {session?.user && (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/50">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {session.user.name?.charAt(0) || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )

  // ─── Dashboard Tab ───────────────────────────────────────────────────────

  const DashboardTab = () => {
    if (!dashboard) return null
    const d = dashboard

    return (
      <motion.div key="dashboard" {...fadeUp} className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Monthly Income"
            value={formatINR(d.totalIncome)}
            icon={<ArrowUpRight className="h-5 w-5" />}
            trend="up"
            color="emerald"
            subtitle={`${d.incomeCount} transactions`}
          />
          <SummaryCard
            title="Monthly Expenses"
            value={formatINR(d.totalExpense)}
            icon={<ArrowDownRight className="h-5 w-5" />}
            trend="down"
            color="rose"
            subtitle={`${d.expenseCount} transactions`}
          />
          <SummaryCard
            title="Savings"
            value={formatINR(d.savings)}
            icon={<PiggyBank className="h-5 w-5" />}
            trend={d.savings >= 0 ? "up" : "down"}
            color={d.savings >= 0 ? "teal" : "red"}
            subtitle={`${d.savingsRate}% savings rate`}
          />
          <SummaryCard
            title="Investments"
            value={formatINRShort(d.investments.totalCurrentValue)}
            icon={<TrendingUp className="h-5 w-5" />}
            trend={d.investments.totalReturns >= 0 ? "up" : "down"}
            color="violet"
            subtitle={`${d.investments.returnsPercentage}% returns`}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spending by Category */}
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
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="total"
                      nameKey="categoryName"
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

          {/* Daily Spending Trend */}
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
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v: string) => new Date(v).getDate().toString()}
                      className="text-xs"
                    />
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

        {/* Budget + Bills Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget Overview */}
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

          {/* Upcoming Bills + Recent Transactions */}
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
                  <p className="text-sm">All bills paid! 🎉</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
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

  // ─── Transactions Tab ────────────────────────────────────────────────────

  const TransactionsTab = () => {
    const [showDialog, setShowDialog] = useState(false)
    const [newTxn, setNewTxn] = useState({ amount: "", type: "expense", description: "", date: new Date().toISOString().split("T")[0], categoryId: "" })
    const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all")

    const filteredTxns = transactions.filter(t => filterType === "all" || t.type === filterType)
    const expenseCategories = categories.filter(c => c.type === "expense")
    const incomeCategories = categories.filter(c => c.type === "income")

    const handleAddTransaction = async () => {
      if (!newTxn.amount || !newTxn.description || !newTxn.categoryId) {
        toast.error("Please fill all required fields")
        return
      }
      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...newTxn, amount: parseFloat(newTxn.amount) }),
        })
        if (res.ok) {
          toast.success("Transaction added!")
          setShowDialog(false)
          setNewTxn({ amount: "", type: "expense", description: "", date: new Date().toISOString().split("T")[0], categoryId: "" })
          fetchTransactions()
          fetchDashboard()
        }
      } catch {
        toast.error("Failed to add transaction")
      }
    }

    const handleDelete = async (id: string) => {
      try {
        const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" })
        if (res.ok) {
          toast.success("Transaction deleted")
          fetchTransactions()
          fetchDashboard()
        }
      } catch {
        toast.error("Failed to delete")
      }
    }

    return (
      <motion.div key="transactions" {...fadeUp} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Transactions</h2>
            <p className="text-muted-foreground text-sm">Track every rupee in and out</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" /> Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>Record a new income or expense</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={newTxn.type === "expense" ? "destructive" : "outline"}
                    className="flex-1"
                    onClick={() => { setNewTxn({ ...newTxn, type: "expense", categoryId: "" }) }}
                  >
                    Expense
                  </Button>
                  <Button
                    type="button"
                    variant={newTxn.type === "income" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => { setNewTxn({ ...newTxn, type: "income", categoryId: "" }) }}
                  >
                    Income
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" placeholder="0" value={newTxn.amount} onChange={e => setNewTxn({ ...newTxn, amount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input placeholder="e.g. Grocery from D-Mart" value={newTxn.description} onChange={e => setNewTxn({ ...newTxn, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newTxn.categoryId} onValueChange={v => setNewTxn({ ...newTxn, categoryId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {(newTxn.type === "expense" ? expenseCategories : incomeCategories).map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={newTxn.date} onChange={e => setNewTxn({ ...newTxn, date: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTransaction} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Add Transaction
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(["all", "income", "expense"] as const).map(t => (
            <Button key={t} variant={filterType === t ? "default" : "outline"} size="sm" onClick={() => setFilterType(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
          <Badge variant="secondary" className="ml-auto self-center">{filteredTxns.length} transactions</Badge>
        </div>

        {/* Transaction List */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {filteredTxns.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: txn.category.color }}
                    >
                      {txn.category.name.substring(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{txn.description}</p>
                      <p className="text-xs text-muted-foreground">{txn.category.name} · {new Date(txn.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-semibold ${txn.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                      {txn.type === "income" ? "+" : "-"}{formatINR(txn.amount)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(txn.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredTxns.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <IndianRupee className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No transactions found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ─── Budgets Tab ─────────────────────────────────────────────────────────

  const BudgetsTab = () => {
    const [showDialog, setShowDialog] = useState(false)
    const [newBudget, setNewBudget] = useState({ categoryId: "", amount: "" })
    const expenseCategories = categories.filter(c => c.type === "expense")
    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
    const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)

    const handleAddBudget = async () => {
      if (!newBudget.categoryId || !newBudget.amount) {
        toast.error("Please fill all fields")
        return
      }
      try {
        const res = await fetch("/api/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId: newBudget.categoryId, amount: parseFloat(newBudget.amount), month: selectedMonth, year: selectedYear }),
        })
        if (res.ok) {
          toast.success("Budget set!")
          setShowDialog(false)
          setNewBudget({ categoryId: "", amount: "" })
          fetchBudgets()
          fetchDashboard()
        }
      } catch {
        toast.error("Failed to set budget")
      }
    }

    const handleDeleteBudget = async (id: string) => {
      try {
        await fetch(`/api/budgets?id=${id}`, { method: "DELETE" })
        toast.success("Budget removed")
        fetchBudgets()
        fetchDashboard()
      } catch {
        toast.error("Failed to remove budget")
      }
    }

    return (
      <motion.div key="budgets" {...fadeUp} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Budgets</h2>
            <p className="text-muted-foreground text-sm">Plan and control your monthly spending</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" /> Set Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Budget</DialogTitle>
                <DialogDescription>Allocate budget for a category this month</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newBudget.categoryId} onValueChange={v => setNewBudget({ ...newBudget, categoryId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Budget Amount (₹)</Label>
                  <Input type="number" placeholder="0" value={newBudget.amount} onChange={e => setNewBudget({ ...newBudget, amount: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddBudget} className="bg-emerald-600 hover:bg-emerald-700 text-white">Set Budget</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Overall Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Budget</span>
              <span className="text-sm text-muted-foreground">
                {formatINR(totalSpent)} / {formatINR(totalBudget)}
              </span>
            </div>
            <Progress value={totalBudget > 0 ? Math.min(percentage(totalSpent, totalBudget), 100) : 0} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{percentage(totalSpent, totalBudget)}% used</span>
              <span>{formatINR(Math.max(0, totalBudget - totalSpent))} remaining</span>
            </div>
          </CardContent>
        </Card>

        {/* Budget Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const pct = percentage(budget.spent, budget.amount)
            const isOver = budget.spent > budget.amount
            return (
              <Card key={budget.id} className="relative overflow-hidden">
                {isOver && <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-bl-lg font-medium">Over!</div>}
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: budget.category.color }}>
                      {budget.category.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{budget.category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatINR(budget.spent)} of {formatINR(budget.amount)}
                      </p>
                    </div>
                  </div>
                  <Progress value={Math.min(pct, 100)} className="h-2 mb-2" />
                  <div className="flex justify-between text-xs">
                    <span className={isOver ? "text-destructive" : "text-muted-foreground"}>{pct}% used</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteBudget(budget.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </motion.div>
    )
  }

  // ─── Goals Tab ───────────────────────────────────────────────────────────

  const GoalsTab = () => {
    const [showDialog, setShowDialog] = useState(false)
    const [showContribute, setShowContribute] = useState(false)
    const [selectedGoal, setSelectedGoal] = useState<string>("")
    const [contributeAmount, setContributeAmount] = useState("")
    const [newGoal, setNewGoal] = useState({ name: "", targetAmount: "", deadline: "", icon: "🎯", color: "#10b981" })

    const goalIcons = ["🎯", "🏖️", "💻", "🪔", "🚗", "🏠", "💍", "🎓", "✈️", "📱", "🛡️", "💰"]

    const handleAddGoal = async () => {
      if (!newGoal.name || !newGoal.targetAmount) {
        toast.error("Please fill required fields")
        return
      }
      try {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...newGoal, targetAmount: parseFloat(newGoal.targetAmount) }),
        })
        if (res.ok) {
          toast.success("Goal created!")
          setShowDialog(false)
          setNewGoal({ name: "", targetAmount: "", deadline: "", icon: "🎯", color: "#10b981" })
          fetchGoals()
          fetchDashboard()
        }
      } catch {
        toast.error("Failed to create goal")
      }
    }

    const handleContribute = async () => {
      if (!contributeAmount || !selectedGoal) return
      try {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "contribute", goalId: selectedGoal, amount: parseFloat(contributeAmount) }),
        })
        if (res.ok) {
          toast.success("Contribution added!")
          setShowContribute(false)
          setContributeAmount("")
          fetchGoals()
          fetchDashboard()
        }
      } catch {
        toast.error("Failed to contribute")
      }
    }

    return (
      <motion.div key="goals" {...fadeUp} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Savings Goals</h2>
            <p className="text-muted-foreground text-sm">Track progress towards your dreams</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" /> New Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Savings Goal</DialogTitle>
                <DialogDescription>Set a target and start saving</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Goal Name</Label>
                  <Input placeholder="e.g. Goa Vacation" value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Target Amount (₹)</Label>
                  <Input type="number" placeholder="0" value={newGoal.targetAmount} onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Deadline (optional)</Label>
                  <Input type="date" value={newGoal.deadline} onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="flex flex-wrap gap-2">
                    {goalIcons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={`h-10 w-10 rounded-lg text-lg flex items-center justify-center border-2 transition-colors ${newGoal.icon === icon ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-border"}`}
                        onClick={() => setNewGoal({ ...newGoal, icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddGoal} className="bg-emerald-600 hover:bg-emerald-700 text-white">Create Goal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const pct = percentage(goal.currentAmount, goal.targetAmount)
            const isComplete = goal.currentAmount >= goal.targetAmount
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
            const daysLeft = goal.deadline ? Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null

            return (
              <Card key={goal.id} className="relative overflow-hidden">
                {isComplete && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-bl-lg font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Complete!
                  </div>
                )}
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{goal.icon}</span>
                    <div>
                      <p className="font-semibold">{goal.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {daysLeft !== null ? `${daysLeft} days left` : "No deadline"}
                      </p>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{formatINR(goal.currentAmount)}</span>
                      <span className="text-muted-foreground">{formatINR(goal.targetAmount)}</span>
                    </div>
                    <Progress value={Math.min(pct, 100)} className="h-2.5" />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>{pct}% saved</span>
                      <span>{formatINR(remaining)} to go</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => { setSelectedGoal(goal.id); setShowContribute(true) }}
                    disabled={isComplete}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Funds
                  </Button>
                </CardContent>
              </Card>
            )
          })}
          {goals.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No savings goals yet. Create one to start tracking!</p>
            </div>
          )}
        </div>

        {/* Contribute Dialog */}
        <Dialog open={showContribute} onOpenChange={setShowContribute}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Funds</DialogTitle>
              <DialogDescription>Contribute to your savings goal</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input type="number" placeholder="0" value={contributeAmount} onChange={e => setContributeAmount(e.target.value)} />
              </div>
              <div className="flex gap-2">
                {[1000, 5000, 10000].map(amt => (
                  <Button key={amt} variant="outline" size="sm" onClick={() => setContributeAmount(String(amt))}>
                    ₹{amt.toLocaleString("en-IN")}
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleContribute} className="bg-emerald-600 hover:bg-emerald-700 text-white">Add Funds</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    )
  }

  // ─── Investments Tab ─────────────────────────────────────────────────────

  const InvestmentsTab = () => {
    const [showDialog, setShowDialog] = useState(false)
    const [newInv, setNewInv] = useState({
      name: "", type: "mutual_fund", investedAmount: "", currentValue: "",
      startDate: new Date().toISOString().split("T")[0], maturityDate: "", returnRate: "", notes: "",
    })

    const totalInvested = investments.reduce((s, i) => s + i.investedAmount, 0)
    const totalCurrent = investments.reduce((s, i) => s + i.currentValue, 0)
    const totalReturns = totalCurrent - totalInvested
    const returnsPct = totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(1) : "0"

    const handleAddInvestment = async () => {
      if (!newInv.name || !newInv.investedAmount || !newInv.currentValue) {
        toast.error("Please fill required fields")
        return
      }
      try {
        const res = await fetch("/api/investments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...newInv,
            investedAmount: parseFloat(newInv.investedAmount),
            currentValue: parseFloat(newInv.currentValue),
            returnRate: newInv.returnRate ? parseFloat(newInv.returnRate) : null,
            maturityDate: newInv.maturityDate || null,
            notes: newInv.notes || null,
          }),
        })
        if (res.ok) {
          toast.success("Investment added!")
          setShowDialog(false)
          fetchInvestments()
          fetchDashboard()
        }
      } catch {
        toast.error("Failed to add investment")
      }
    }

    const handleDeleteInvestment = async (id: string) => {
      try {
        await fetch(`/api/investments?id=${id}`, { method: "DELETE" })
        toast.success("Investment removed")
        fetchInvestments()
        fetchDashboard()
      } catch {
        toast.error("Failed to remove")
      }
    }

    // Group investments by type
    const investmentsByType = investments.reduce((acc, inv) => {
      if (!acc[inv.type]) acc[inv.type] = []
      acc[inv.type].push(inv)
      return acc
    }, {} as Record<string, Investment[]>)

    return (
      <motion.div key="investments" {...fadeUp} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Investments</h2>
            <p className="text-muted-foreground text-sm">Track your wealth building journey</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" /> Add Investment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Investment</DialogTitle>
                <DialogDescription>Track a new investment</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Investment Name</Label>
                  <Input placeholder="e.g. HDFC Mid Cap Fund" value={newInv.name} onChange={e => setNewInv({ ...newInv, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newInv.type} onValueChange={v => setNewInv({ ...newInv, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(INVESTMENT_TYPE_LABELS).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Invested Amount (₹)</Label>
                    <Input type="number" placeholder="0" value={newInv.investedAmount} onChange={e => setNewInv({ ...newInv, investedAmount: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Value (₹)</Label>
                    <Input type="number" placeholder="0" value={newInv.currentValue} onChange={e => setNewInv({ ...newInv, currentValue: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={newInv.startDate} onChange={e => setNewInv({ ...newInv, startDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Return Rate (%)</Label>
                    <Input type="number" placeholder="e.g. 12.5" value={newInv.returnRate} onChange={e => setNewInv({ ...newInv, returnRate: e.target.value })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddInvestment} className="bg-emerald-600 hover:bg-emerald-700 text-white">Add Investment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Total Invested</p>
              <p className="text-2xl font-bold">{formatINR(totalInvested)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Current Value</p>
              <p className="text-2xl font-bold">{formatINR(totalCurrent)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Total Returns</p>
              <p className={`text-2xl font-bold ${totalReturns >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {totalReturns >= 0 ? "+" : ""}{formatINR(totalReturns)}
                <span className="text-sm ml-1">({returnsPct}%)</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Allocation Chart + List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              {investments.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={Object.entries(investmentsByType).map(([type, invs]) => ({
                      name: INVESTMENT_TYPE_LABELS[type]?.label || type,
                      value: invs.reduce((s, i) => s + i.currentValue, 0),
                      fill: INVESTMENT_TYPE_LABELS[type]?.color || "#6b7280",
                    }))} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name">
                      {Object.entries(investmentsByType).map(([type]) => (
                        <Cell key={type} fill={INVESTMENT_TYPE_LABELS[type]?.color || "#6b7280"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatINR(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No investments</div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {investments.map((inv) => {
                  const returns = inv.currentValue - inv.investedAmount
                  const returnsPct = inv.investedAmount > 0 ? ((returns / inv.investedAmount) * 100).toFixed(1) : "0"
                  const typeInfo = INVESTMENT_TYPE_LABELS[inv.type] || INVESTMENT_TYPE_LABELS.other
                  return (
                    <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: typeInfo.color + "20", color: typeInfo.color }}>
                          {typeInfo.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{inv.name}</p>
                          <p className="text-xs text-muted-foreground">{typeInfo.label} · {inv.returnRate ? `${inv.returnRate}%` : "N/A"}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="text-sm font-semibold">{formatINR(inv.currentValue)}</p>
                          <p className={`text-xs ${returns >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {returns >= 0 ? "+" : ""}{returnsPct}%
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteInvestment(inv.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    )
  }

  // ─── Financial Health Tab ──────────────────────────────────────────────────

  const FinancialHealthTab = () => {
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

    const fetchHealth = async () => {
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
      if (status === "authenticated") fetchHealth()
    }, [selectedMonth, selectedYear, status])

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
            {/* Overall Score Card */}
            <Card className="border-2 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent" />
              <CardContent className="pt-8 pb-8 relative">
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  {/* Score Gauge */}
                  <div className="relative flex-shrink-0">
                    <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
                      <circle cx="90" cy="90" r="75" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="12" />
                      <circle
                        cx="90" cy="90" r="75" fill="none"
                        stroke={healthData.gradeColor}
                        strokeWidth="12"
                        strokeLinecap="round"
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

                  {/* Grade Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                      <span
                        className="text-5xl font-black"
                        style={{ color: healthData.gradeColor }}
                      >
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={fetchHealth}
                      disabled={healthLoading}
                    >
                      {healthLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Refresh Score
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Scores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {healthData.categories.map((cat) => (
                <Card key={cat.id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div
                    className="absolute top-0 left-0 w-1 h-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <CardContent className="pt-5 pl-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-9 w-9 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: cat.color + "20", color: cat.color }}
                        >
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

                    {/* Score Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{cat.score} / {cat.maxScore} pts</span>
                        <span className="text-muted-foreground">{Math.round((cat.score / cat.maxScore) * 100)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${(cat.score / cat.maxScore) * 100}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>

                    {/* Tip */}
                    <div className="text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-2.5 group-hover:bg-muted/80 transition-colors">
                      <span className="font-medium text-foreground">Tip:</span> {cat.tip}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Monthly Snapshot + Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Snapshot */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Monthly Snapshot</CardTitle>
                  <CardDescription>How this month compares to ideal targets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Income vs Expense */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">Income vs Expenses</span>
                      <span className="text-muted-foreground">{healthData.monthlyComparison.incomeVsExpense.ratio}% spent</span>
                    </div>
                    <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-muted">
                      <div
                        className="bg-emerald-500 rounded-l-full transition-all"
                        style={{ width: `${Math.max(5, 100 - healthData.monthlyComparison.incomeVsExpense.ratio)}%` }}
                      />
                      <div
                        className="bg-rose-400 rounded-r-full transition-all"
                        style={{ width: `${Math.min(95, healthData.monthlyComparison.incomeVsExpense.ratio)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Income: {formatINR(healthData.monthlyComparison.incomeVsExpense.income)}</span>
                      <span>Expense: {formatINR(healthData.monthlyComparison.incomeVsExpense.expense)}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Savings Target */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">Savings Target (20% of income)</span>
                      <span className="text-muted-foreground">{healthData.monthlyComparison.savingsTarget.percentage}% achieved</span>
                    </div>
                    <Progress
                      value={Math.min(healthData.monthlyComparison.savingsTarget.percentage, 100)}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Saved: {formatINR(healthData.monthlyComparison.savingsTarget.current)}</span>
                      <span>Target: {formatINR(healthData.monthlyComparison.savingsTarget.target)}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Investment Target */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">Investment Target (30% of income)</span>
                      <span className="text-muted-foreground">{healthData.monthlyComparison.investmentTarget.percentage}% achieved</span>
                    </div>
                    <Progress
                      value={Math.min(healthData.monthlyComparison.investmentTarget.percentage, 100)}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Current: {formatINR(healthData.monthlyComparison.investmentTarget.current)}</span>
                      <span>Target: {formatINR(healthData.monthlyComparison.investmentTarget.target)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <div className="space-y-4">
                {/* Top Recommendations */}
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

                {/* Quick Wins */}
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
              <Button onClick={fetchHealth} className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
                <Heart className="h-4 w-4 mr-2" /> Check Financial Health
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    )
  }

  // ─── Bills Tab ───────────────────────────────────────────────────────────

  const BillsTab = () => {
    const [showDialog, setShowDialog] = useState(false)
    const [newBill, setNewBill] = useState({ name: "", amount: "", dueDate: "", category: "", isRecurring: false, recurringFreq: "monthly" })

    const upcoming = bills.filter(b => !b.isPaid).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    const paid = bills.filter(b => b.isPaid)
    const totalUpcoming = upcoming.reduce((s, b) => s + b.amount, 0)

    const handleAddBill = async () => {
      if (!newBill.name || !newBill.amount || !newBill.dueDate) {
        toast.error("Please fill all required fields")
        return
      }
      try {
        const res = await fetch("/api/bills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newBill),
        })
        if (res.ok) {
          toast.success("Bill reminder added!")
          setShowDialog(false)
          setNewBill({ name: "", amount: "", dueDate: "", category: "", isRecurring: false, recurringFreq: "monthly" })
          fetchBills()
        }
      } catch {
        toast.error("Failed to add bill")
      }
    }

    const handleMarkPaid = async (id: string) => {
      try {
        const bill = bills.find(b => b.id === id)
        if (!bill) return
        await fetch("/api/bills", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, isPaid: true }),
        })
        toast.success("Marked as paid!")
        fetchBills()
      } catch {
        toast.error("Failed to update")
      }
    }

    const handleDeleteBill = async (id: string) => {
      try {
        await fetch(`/api/bills?id=${id}`, { method: "DELETE" })
        toast.success("Bill removed")
        fetchBills()
      } catch {
        toast.error("Failed to remove")
      }
    }

    return (
      <motion.div key="bills" {...fadeUp} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Bill Reminders</h2>
            <p className="text-muted-foreground text-sm">Never miss a payment</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" /> Add Reminder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Bill Reminder</DialogTitle>
                <DialogDescription>Set up a payment reminder</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Bill Name</Label>
                  <Input placeholder="e.g. Electricity Bill" value={newBill.name} onChange={e => setNewBill({ ...newBill, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input type="number" placeholder="0" value={newBill.amount} onChange={e => setNewBill({ ...newBill, amount: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={newBill.dueDate} onChange={e => setNewBill({ ...newBill, dueDate: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Recurring</Label>
                  <Switch checked={newBill.isRecurring} onCheckedChange={c => setNewBill({ ...newBill, isRecurring: c })} />
                </div>
                {newBill.isRecurring && (
                  <Select value={newBill.recurringFreq} onValueChange={v => setNewBill({ ...newBill, recurringFreq: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleAddBill} className="bg-emerald-600 hover:bg-emerald-700 text-white">Add Reminder</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Bills</p>
                <p className="text-2xl font-bold">{formatINR(totalUpcoming)}</p>
              </div>
              <Badge variant="secondary">{upcoming.length} pending</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Bills */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Upcoming</h3>
          {upcoming.map(bill => {
            const daysLeft = Math.ceil((new Date(bill.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            const isUrgent = daysLeft <= 3
            return (
              <Card key={bill.id} className={isUrgent ? "border-amber-500/50" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isUrgent ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted"}`}>
                        {isUrgent ? <AlertCircle className="h-5 w-5 text-amber-600" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{bill.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(bill.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          {bill.isRecurring && <Badge variant="outline" className="ml-2 text-[10px] px-1">{bill.recurringFreq}</Badge>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatINR(bill.amount)}</span>
                      <Button size="sm" variant="outline" onClick={() => handleMarkPaid(bill.id)} className="text-emerald-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Paid
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteBill(bill.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {upcoming.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
              <p>All bills are paid! 🎉</p>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // ─── Reports Tab ─────────────────────────────────────────────────────────

  const ReportsTab = () => {
    if (!dashboard) return null
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

        {/* Income vs Expense Chart */}
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

        {/* Top Spending Categories */}
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

        {/* Financial Health */}
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

  // ─── Render ──────────────────────────────────────────────────────────────

  // Show landing page if not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background">
        {/* ─── Navbar ─────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-md">₹</div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">RupeeTrack</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
            </nav>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => { setAuthMode("login"); setShowAuthDialog(true) }}>
                Sign In
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
                onClick={() => { setAuthMode("register"); setShowAuthDialog(true) }}
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </header>

        {/* ─── Hero Section ────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl" />
            <div className="absolute top-1/3 right-1/6 text-[18rem] font-black text-emerald-500/[0.03] select-none">₹</div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 relative">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                  Made for India 🇮🇳 • 100% Free
                </Badge>
              </motion.div>

              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Master your money,
                <br />
                <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 bg-clip-text text-transparent">
                  the Indian way.
                </span>
              </motion.h1>

              <motion.p
                className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Track every rupee with Indian categories, manage investments from PF to SIP,
                build savings goals, and know your financial health score — all in one place.
              </motion.p>

              <motion.div
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Button
                  size="lg"
                  className="text-lg px-8 h-14 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/25"
                  onClick={() => { setAuthMode("register"); setShowAuthDialog(true) }}
                >
                  Start Tracking Free
                  <ArrowUpRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 h-14 border-2"
                  onClick={() => { setAuthMode("login"); setShowAuthDialog(true) }}
                >
                  Sign In to Dashboard
                </Button>
              </motion.div>

              <motion.p
                className="mt-5 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                No credit card needed • Set up in 30 seconds
              </motion.p>

              {/* Hero Dashboard Preview */}
              <motion.div
                className="mt-16 relative"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <div className="relative mx-auto max-w-5xl rounded-2xl border border-border/50 shadow-2xl shadow-emerald-500/10 overflow-hidden bg-card">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
                    <div className="h-3 w-3 rounded-full bg-rose-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="ml-3 text-xs text-muted-foreground">rupeetrack.in — Dashboard</span>
                  </div>
                  <div className="p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: "Monthly Income", value: "₹75,000", color: "emerald", icon: "↑" },
                      { label: "Expenses", value: "₹42,300", color: "rose", icon: "↓" },
                      { label: "Savings", value: "₹32,700", color: "teal", icon: "🐷" },
                      { label: "Investments", value: "₹8.5L", color: "violet", icon: "📈" },
                    ].map((card, i) => (
                      <div key={i} className={`rounded-xl p-4 bg-gradient-to-br ${
                        card.color === "emerald" ? "from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20" :
                        card.color === "rose" ? "from-rose-500/10 to-rose-500/5 border border-rose-500/20" :
                        card.color === "teal" ? "from-teal-500/10 to-teal-500/5 border border-teal-500/20" :
                        "from-violet-500/10 to-violet-500/5 border border-violet-500/20"
                      }`}>
                        <p className="text-xs text-muted-foreground">{card.icon} {card.label}</p>
                        <p className="text-xl font-bold mt-1">{card.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-6 pb-6 sm:px-8 sm:pb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border/50 p-4 h-40 flex items-center justify-center text-muted-foreground/40 text-sm">
                      📊 Spending by Category Pie Chart
                    </div>
                    <div className="rounded-xl border border-border/50 p-4 h-40 flex items-center justify-center text-muted-foreground/40 text-sm">
                      📈 Daily Spending Trend
                    </div>
                  </div>
                </div>
                {/* Glow effect under dashboard */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 blur-3xl rounded-full" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── Stats Bar ───────────────────────────────────────────────────── */}
        <section className="border-y border-border/40 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "50+", label: "Indian Categories" },
                { value: "8", label: "Feature Modules" },
                { value: "100%", label: "Free Forever" },
                { value: "0", label: "Data Shared" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Features Section ─────────────────────────────────────────────── */}
        <section id="features" className="py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="secondary" className="mb-4">Features</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Everything you need to manage money in India
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">
                From daily chai expenses to long-term SIP investments — we&apos;ve got you covered.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <ArrowLeftRight className="h-6 w-6" />,
                  title: "Smart Transactions",
                  desc: "Track every rupee with Indian categories — Swiggy, Zomato, DTH, LPG, Maid, Uber, and 50+ more.",
                  color: "emerald",
                },
                {
                  icon: <Wallet className="h-6 w-6" />,
                  title: "Budget Tracking",
                  desc: "Set monthly budgets per category. Get visual alerts when you're overspending before month-end.",
                  color: "violet",
                },
                {
                  icon: <Heart className="h-6 w-6" />,
                  title: "Financial Health Score",
                  desc: "Get a personalized 0-100 score based on savings rate, budget discipline, emergency fund, and more.",
                  color: "rose",
                },
                {
                  icon: <Target className="h-6 w-6" />,
                  title: "Savings Goals",
                  desc: "Planning a Goa trip? New laptop? Wedding fund? Set goals, track progress, and celebrate milestones.",
                  color: "amber",
                },
                {
                  icon: <TrendingUp className="h-6 w-6" />,
                  title: "Investment Portfolio",
                  desc: "Track PF, PPF, Mutual Funds, SIP, FD, Stocks, NPS — all in one dashboard with returns tracking.",
                  color: "sky",
                },
                {
                  icon: <Bell className="h-6 w-6" />,
                  title: "Bill Reminders",
                  desc: "Never miss a bill again. Track rent, EMIs, subscriptions with due date alerts and recurring support.",
                  color: "orange",
                },
                {
                  icon: <BarChart3 className="h-6 w-6" />,
                  title: "Financial Reports",
                  desc: "Monthly reports with income vs expense charts, top spending categories, and health indicators.",
                  color: "pink",
                },
                {
                  icon: <PiggyBank className="h-6 w-6" />,
                  title: "Emergency Fund Tracker",
                  desc: "Know exactly how many months of expenses your savings can cover. Aim for the 6-month target.",
                  color: "teal",
                },
                {
                  icon: <Shield className="h-6 w-6" />,
                  title: "Secure & Private",
                  desc: "Your financial data stays yours. Encrypted passwords, secure sessions, zero data sharing. Ever.",
                  color: "indigo",
                },
              ].map((feature, i) => {
                const colorMap: Record<string, string> = {
                  emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600",
                  violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-600",
                  rose: "bg-rose-100 dark:bg-rose-900/30 text-rose-600",
                  amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
                  sky: "bg-sky-100 dark:bg-sky-900/30 text-sky-600",
                  orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600",
                  pink: "bg-pink-100 dark:bg-pink-900/30 text-pink-600",
                  teal: "bg-teal-100 dark:bg-teal-900/30 text-teal-600",
                  indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600",
                }
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group border-border/50">
                      <CardContent className="pt-6">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${colorMap[feature.color] || colorMap.emerald} group-hover:scale-110 transition-transform`}>
                          {feature.icon}
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ─── How It Works ──────────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-20 sm:py-28 bg-muted/30 border-y border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="secondary" className="mb-4">How It Works</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Start your financial journey in 3 steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {[
                {
                  step: "01",
                  title: "Sign up in seconds",
                  desc: "Create your free account. No credit card, no paperwork. Just your name and email.",
                  icon: <User className="h-8 w-8" />,
                },
                {
                  step: "02",
                  title: "Track your money",
                  desc: "Add transactions with Indian categories. Set budgets. Add your investments and bills.",
                  icon: <ArrowLeftRight className="h-8 w-8" />,
                },
                {
                  step: "03",
                  title: "Watch your health improve",
                  desc: "See your Financial Health Score rise as you save more, invest better, and stay on budget.",
                  icon: <Heart className="h-8 w-8" />,
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  className="relative text-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                >
                  {i < 2 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] border-t-2 border-dashed border-emerald-300 dark:border-emerald-700" />
                  )}
                  <div className="relative z-10 mx-auto mb-6 h-24 w-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center text-white shadow-xl shadow-emerald-500/25">
                    {step.icon}
                    <span className="text-xs font-bold mt-1 opacity-80">{step.step}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Testimonials ──────────────────────────────────────────────────── */}
        <section id="testimonials" className="py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="secondary" className="mb-4">Testimonials</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Loved by people who track every rupee
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: "Priya Sharma",
                  role: "Software Engineer, Bangalore",
                  text: "Finally an expense tracker that understands Indian spending! Swiggy, Zomato, DTH — all categories I actually use. My savings went from 5% to 22% in 3 months.",
                  avatar: "P",
                },
                {
                  name: "Rahul Verma",
                  role: "Product Manager, Mumbai",
                  text: "The Financial Health Score is a game-changer. It's like a credit score for my daily finances. I check it every week and try to improve my grade.",
                  avatar: "R",
                },
                {
                  name: "Ananya Patel",
                  role: "CA Student, Ahmedabad",
                  text: "Tracking my SIP, PPF, and FD in one place is so convenient. I used to maintain spreadsheets. Now it's all automated with beautiful charts.",
                  avatar: "A",
                },
              ].map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full border-border/50 hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, j) => (
                          <span key={j} className="text-amber-400 text-lg">★</span>
                        ))}
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/90 mb-6">&ldquo;{testimonial.text}&rdquo;</p>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{testimonial.name}</p>
                          <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA Section ─────────────────────────────────────────────────── */}
        <section className="py-20 sm:py-28 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                Ready to take control of your finances?
              </h2>
              <p className="mt-6 text-emerald-100 text-lg max-w-2xl mx-auto leading-relaxed">
                Join thousands of Indians who are saving smarter, investing better, and living financially healthier — for free.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="text-lg px-8 h-14 bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl"
                  onClick={() => { setAuthMode("register"); setShowAuthDialog(true) }}
                >
                  Get Started — It&apos;s Free
                  <ArrowUpRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 h-14 border-2 border-white/30 text-white hover:bg-white/10"
                  onClick={() => { setAuthMode("login"); setShowAuthDialog(true) }}
                >
                  I already have an account
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── Footer ──────────────────────────────────────────────────────── */}
        <footer className="border-t border-border/40 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">₹</div>
                <span className="font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">RupeeTrack</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Made with ❤️ for India 🇮🇳 • Your data stays yours. Always.
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>© 2025 RupeeTrack</span>
              </div>
            </div>
          </div>
        </footer>

        {/* ─── Auth Dialog ─────────────────────────────────────────────────── */}
        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-1">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">₹</div>
                <span className="font-bold text-lg">RupeeTrack</span>
              </div>
              <DialogTitle className="text-center text-xl">
                {authMode === "login" ? "Welcome Back!" : "Create Your Account"}
              </DialogTitle>
              <DialogDescription className="text-center">
                {authMode === "login"
                  ? "Sign in to access your dashboard"
                  : "Start your financial journey today"}
              </DialogDescription>
            </DialogHeader>
            {authMode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" value={loginForm.email}
                      onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="pl-10" disabled={authLoading} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••"
                      value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="pl-10 pr-10" disabled={authLoading} />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
                  disabled={authLoading}>
                  {authLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Sign In
                </Button>
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Demo Account</span></div>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-sm">
                  <p className="text-muted-foreground text-center">
                    <span className="font-mono text-xs">demo@rupeetrack.in</span> / <span className="font-mono text-xs">demo123</span>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="reg-name" type="text" placeholder="Rohit Pendurkar" value={registerForm.name}
                      onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                      className="pl-10" disabled={authLoading} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="reg-email" type="email" placeholder="you@example.com" value={registerForm.email}
                      onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                      className="pl-10" disabled={authLoading} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="reg-password" type={showPassword ? "text" : "password"} placeholder="Min 6 characters"
                      value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                      className="pl-10 pr-10" disabled={authLoading} />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-salary">Monthly Salary (₹) <span className="text-muted-foreground text-xs">optional</span></Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="reg-salary" type="number" placeholder="75000" value={registerForm.monthlySalary}
                      onChange={e => setRegisterForm({ ...registerForm, monthlySalary: e.target.value })}
                      className="pl-10" disabled={authLoading} />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
                  disabled={authLoading}>
                  {authLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Create Account
                </Button>
              </form>
            )}
            <div className="text-center pt-2 border-t mt-2">
              <p className="text-sm text-muted-foreground">
                {authMode === "login" ? "Don't have an account?" : "Already have an account?"}
                <button type="button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                  className="ml-1 font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
                  {authMode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Loading session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 animate-pulse">
            ₹
          </div>
          <p className="text-muted-foreground">Loading RupeeTrack...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 animate-pulse">
            ₹
          </div>
          <p className="text-muted-foreground">Loading RupeeTrack...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-border flex-col bg-card/50 backdrop-blur-sm">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center justify-between">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">₹</div>
              <span className="font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">RupeeTrack</span>
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && <DashboardTab />}
            {activeTab === "transactions" && <TransactionsTab />}
            {activeTab === "budgets" && <BudgetsTab />}
            {activeTab === "goals" && <GoalsTab />}
            {activeTab === "investments" && <InvestmentsTab />}
            {activeTab === "health" && <FinancialHealthTab />}
            {activeTab === "bills" && <BillsTab />}
            {activeTab === "reports" && <ReportsTab />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

// ─── Reusable Components ─────────────────────────────────────────────────────

function SummaryCard({ title, value, icon, trend, color, subtitle }: {
  title: string; value: string; icon: React.ReactNode; trend: "up" | "down"; color: string; subtitle: string
}) {
  const colorMap: Record<string, string> = {
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    rose: "from-rose-500/10 to-rose-500/5 border-rose-500/20",
    teal: "from-teal-500/10 to-teal-500/5 border-teal-500/20",
    red: "from-red-500/10 to-red-500/5 border-red-500/20",
    violet: "from-violet-500/10 to-violet-500/5 border-violet-500/20",
    amber: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
  }
  const iconColorMap: Record<string, string> = {
    emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600",
    rose: "bg-rose-100 dark:bg-rose-900/30 text-rose-600",
    teal: "bg-teal-100 dark:bg-teal-900/30 text-teal-600",
    red: "bg-red-100 dark:bg-red-900/30 text-red-600",
    violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-600",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
  }

  return (
    <Card className={`bg-gradient-to-br ${colorMap[color] || colorMap.emerald} border`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconColorMap[color] || iconColorMap.emerald}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function HealthIndicator({ label, value, target, unit, color }: {
  label: string; value: number; target: number; unit: string; color: string
}) {
  const pct = Math.min(percentage(value, target), 100)
  const isGood = value >= target
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    violet: "text-violet-600",
    rose: "text-rose-600",
  }

  return (
    <div className="space-y-2 p-3 rounded-xl bg-muted/50">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${colorMap[color]}`}>{value}{unit}</p>
      <Progress value={pct} className="h-1.5" />
      <p className="text-xs text-muted-foreground">Target: {target}{unit}</p>
    </div>
  )
}
