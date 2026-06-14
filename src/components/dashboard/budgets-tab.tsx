"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { formatINR, percentage } from "@/lib/helpers"
import { motion } from "framer-motion"
import { Plus, Trash2 } from "lucide-react"
import {
  Card, CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import type { BudgetItem, Category } from "@/types/dashboard"

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
}

export function BudgetsTab() {
  const { selectedMonth, selectedYear } = useAppStore()
  const [budgets, setBudgets] = useState<BudgetItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [newBudget, setNewBudget] = useState({ categoryId: "", amount: "" })

  const reloadBudgets = async () => {
    try {
      const [budgetRes, catRes] = await Promise.all([
        fetch(`/api/budgets?month=${selectedMonth}&year=${selectedYear}`),
        fetch("/api/categories"),
      ])
      if (budgetRes.ok) setBudgets(await budgetRes.json())
      if (catRes.ok) setCategories(await catRes.json())
    } catch (err) {
      console.error("Data fetch error:", err)
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    const loadData = async () => {
      try {
        const [budgetRes, catRes] = await Promise.all([
          fetch(`/api/budgets?month=${selectedMonth}&year=${selectedYear}`, { signal: controller.signal }),
          fetch("/api/categories", { signal: controller.signal }),
        ])
        if (!controller.signal.aborted) {
          if (budgetRes.ok) setBudgets(await budgetRes.json())
          if (catRes.ok) setCategories(await catRes.json())
        }
      } catch (err) {
        if (!controller.signal.aborted) console.error("Data fetch error:", err)
      }
    }

    loadData()
    return () => controller.abort()
  }, [selectedMonth, selectedYear])

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
        reloadBudgets()
      }
    } catch {
      toast.error("Failed to set budget")
    }
  }

  const handleDeleteBudget = async (id: string) => {
    try {
      await fetch(`/api/budgets?id=${id}`, { method: "DELETE" })
      toast.success("Budget removed")
      reloadBudgets()
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
