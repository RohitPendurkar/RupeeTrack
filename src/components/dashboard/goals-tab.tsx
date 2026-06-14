"use client"

import { useState, useEffect } from "react"
import { formatINR, percentage } from "@/lib/helpers"
import { motion } from "framer-motion"
import { Plus, CheckCircle2, Target } from "lucide-react"
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
import { toast } from "sonner"
import type { SavingsGoal } from "@/types/dashboard"

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
}

const goalIcons = ["🎯", "🏖️", "💻", "🪔", "🚗", "🏠", "💍", "🎓", "✈️", "📱", "🛡️", "💰"]

export function GoalsTab() {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [showContribute, setShowContribute] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<string>("")
  const [contributeAmount, setContributeAmount] = useState("")
  const [newGoal, setNewGoal] = useState({ name: "", targetAmount: "", deadline: "", icon: "🎯", color: "#10b981" })

  const reloadGoals = async () => {
    try {
      const res = await fetch("/api/goals")
      if (res.ok) setGoals(await res.json())
    } catch (err) {
      console.error("Goals fetch error:", err)
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    const loadData = async () => {
      try {
        const res = await fetch("/api/goals", { signal: controller.signal })
        if (res.ok && !controller.signal.aborted) setGoals(await res.json())
      } catch (err) {
        if (!controller.signal.aborted) console.error("Goals fetch error:", err)
      }
    }

    loadData()
    return () => controller.abort()
  }, [])

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
        reloadGoals()
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
        reloadGoals()
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
                      key={icon} type="button"
                      className={`h-10 w-10 rounded-lg text-lg flex items-center justify-center border-2 transition-colors ${newGoal.icon === icon ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-border"}`}
                      onClick={() => setNewGoal({ ...newGoal, icon })}
                    >{icon}</button>
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
                  size="sm" className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
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
