"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { formatINR } from "@/lib/helpers"
import { motion } from "framer-motion"
import { Plus, IndianRupee, Trash2 } from "lucide-react"
import {
  Card, CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import type { Transaction, Category } from "@/types/dashboard"

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
}

export function TransactionsTab() {
  const { selectedMonth, selectedYear } = useAppStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [newTxn, setNewTxn] = useState({ amount: "", type: "expense", description: "", date: new Date().toISOString().split("T")[0], categoryId: "" })
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all")

  const reloadTransactions = async () => {
    try {
      const [txnRes, catRes] = await Promise.all([
        fetch(`/api/transactions?month=${selectedMonth}&year=${selectedYear}`),
        fetch("/api/categories"),
      ])
      if (txnRes.ok) setTransactions(await txnRes.json())
      if (catRes.ok) setCategories(await catRes.json())
    } catch (err) {
      console.error("Data fetch error:", err)
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    const loadData = async () => {
      try {
        const [txnRes, catRes] = await Promise.all([
          fetch(`/api/transactions?month=${selectedMonth}&year=${selectedYear}`, { signal: controller.signal }),
          fetch("/api/categories", { signal: controller.signal }),
        ])
        if (!controller.signal.aborted) {
          if (txnRes.ok) setTransactions(await txnRes.json())
          if (catRes.ok) setCategories(await catRes.json())
        }
      } catch (err) {
        if (!controller.signal.aborted) console.error("Data fetch error:", err)
      }
    }

    loadData()
    return () => controller.abort()
  }, [selectedMonth, selectedYear])

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
        reloadTransactions()
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
        reloadTransactions()
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
                  type="button" variant={newTxn.type === "expense" ? "destructive" : "outline"} className="flex-1"
                  onClick={() => { setNewTxn({ ...newTxn, type: "expense", categoryId: "" }) }}
                >Expense</Button>
                <Button
                  type="button" variant={newTxn.type === "income" ? "default" : "outline"} className="flex-1"
                  onClick={() => { setNewTxn({ ...newTxn, type: "income", categoryId: "" }) }}
                >Income</Button>
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
              <Button onClick={handleAddTransaction} className="bg-emerald-600 hover:bg-emerald-700 text-white">Add Transaction</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {(["all", "income", "expense"] as const).map(t => (
          <Button key={t} variant={filterType === t ? "default" : "outline"} size="sm" onClick={() => setFilterType(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
        <Badge variant="secondary" className="ml-auto self-center">{filteredTxns.length} transactions</Badge>
      </div>

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
