"use client"

import { useState, useEffect } from "react"
import { formatINR } from "@/lib/helpers"
import { motion } from "framer-motion"
import { Plus, Trash2 } from "lucide-react"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts"
import { INVESTMENT_TYPE_LABELS } from "./constants"
import type { Investment } from "@/types/dashboard"

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
}

export function InvestmentsTab() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [newInv, setNewInv] = useState({
    name: "", type: "mutual_fund", investedAmount: "", currentValue: "",
    startDate: new Date().toISOString().split("T")[0], maturityDate: "", returnRate: "", notes: "",
  })

  const reloadInvestments = async () => {
    try {
      const res = await fetch("/api/investments")
      if (res.ok) setInvestments(await res.json())
    } catch (err) {
      console.error("Investments fetch error:", err)
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    const loadData = async () => {
      try {
        const res = await fetch("/api/investments", { signal: controller.signal })
        if (res.ok && !controller.signal.aborted) setInvestments(await res.json())
      } catch (err) {
        if (!controller.signal.aborted) console.error("Investments fetch error:", err)
      }
    }

    loadData()
    return () => controller.abort()
  }, [])

  const totalInvested = investments.reduce((s, i) => s + i.investedAmount, 0)
  const totalCurrent = investments.reduce((s, i) => s + i.currentValue, 0)
  const totalReturns = totalCurrent - totalInvested
  const returnsPct = totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(1) : "0"

  const investmentsByType = investments.reduce((acc, inv) => {
    if (!acc[inv.type]) acc[inv.type] = []
    acc[inv.type].push(inv)
    return acc
  }, {} as Record<string, Investment[]>)

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
        reloadInvestments()
      }
    } catch {
      toast.error("Failed to add investment")
    }
  }

  const handleDeleteInvestment = async (id: string) => {
    try {
      await fetch(`/api/investments?id=${id}`, { method: "DELETE" })
      toast.success("Investment removed")
      reloadInvestments()
    } catch {
      toast.error("Failed to remove")
    }
  }

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {investments.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={Object.entries(investmentsByType).map(([type, invs]) => ({
                      name: INVESTMENT_TYPE_LABELS[type]?.label || type,
                      value: invs.reduce((s, i) => s + i.currentValue, 0),
                    }))}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                    paddingAngle={3} dataKey="value" nameKey="name"
                  >
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
