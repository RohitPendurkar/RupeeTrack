import type { TabId } from "@/lib/store"
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Target, TrendingUp,
  Heart, Bell, BarChart3,
  Landmark, Shield, Percent, Briefcase, MoreHorizontal,
} from "lucide-react"

export const NAV_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: "transactions", label: "Transactions", icon: <ArrowLeftRight className="h-5 w-5" /> },
  { id: "budgets", label: "Budgets", icon: <Wallet className="h-5 w-5" /> },
  { id: "goals", label: "Savings Goals", icon: <Target className="h-5 w-5" /> },
  { id: "investments", label: "Investments", icon: <TrendingUp className="h-5 w-5" /> },
  { id: "health", label: "Financial Health", icon: <Heart className="h-5 w-5" /> },
  { id: "bills", label: "Bill Reminders", icon: <Bell className="h-5 w-5" /> },
  { id: "reports", label: "Reports", icon: <BarChart3 className="h-5 w-5" /> },
]

export const INVESTMENT_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pf: { label: "Provident Fund", icon: <Landmark className="h-4 w-4" />, color: "#0ea5e9" },
  ppf: { label: "Public PF", icon: <Shield className="h-4 w-4" />, color: "#8b5cf6" },
  mutual_fund: { label: "Mutual Fund", icon: <TrendingUp className="h-4 w-4" />, color: "#f97316" },
  fd: { label: "Fixed Deposit", icon: <Landmark className="h-4 w-4" />, color: "#22c55e" },
  sip: { label: "SIP", icon: <Percent className="h-4 w-4" />, color: "#ec4899" },
  stocks: { label: "Stocks", icon: <BarChart3 className="h-4 w-4" />, color: "#ef4444" },
  nps: { label: "NPS", icon: <Briefcase className="h-4 w-4" />, color: "#14b8a6" },
  other: { label: "Other", icon: <MoreHorizontal className="h-4 w-4" />, color: "#6b7280" },
}
