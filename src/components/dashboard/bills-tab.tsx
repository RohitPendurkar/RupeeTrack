"use client"

import { useState, useEffect } from "react"
import { formatINR } from "@/lib/helpers"
import { motion } from "framer-motion"
import { Plus, CheckCircle2, Clock, AlertCircle, Trash2 } from "lucide-react"
import {
  Card, CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import type { BillReminder } from "@/types/dashboard"

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
}

export function BillsTab() {
  const [bills, setBills] = useState<BillReminder[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [newBill, setNewBill] = useState({ name: "", amount: "", dueDate: "", category: "", isRecurring: false, recurringFreq: "monthly" })

  const reloadBills = async () => {
    try {
      const res = await fetch("/api/bills")
      if (res.ok) setBills(await res.json())
    } catch (err) {
      console.error("Bills fetch error:", err)
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    const loadData = async () => {
      try {
        const res = await fetch("/api/bills", { signal: controller.signal })
        if (res.ok && !controller.signal.aborted) setBills(await res.json())
      } catch (err) {
        if (!controller.signal.aborted) console.error("Bills fetch error:", err)
      }
    }

    loadData()
    return () => controller.abort()
  }, [])

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
        reloadBills()
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
      reloadBills()
    } catch {
      toast.error("Failed to update")
    }
  }

  const handleDeleteBill = async (id: string) => {
    try {
      await fetch(`/api/bills?id=${id}`, { method: "DELETE" })
      toast.success("Bill removed")
      reloadBills()
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
            <p>All bills are paid!</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
