"use client"

import { useSession } from "next-auth/react"
import { useAppStore } from "@/lib/store"
import { NAV_ITEMS } from "./constants"
import { getMonthName } from "@/lib/helpers"
import { ThemeToggle } from "@/components/theme-provider"
import {
  ChevronLeft, ChevronRight, LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { data: session } = useSession()
  const { activeTab, setActiveTab, selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useAppStore()

  const navigateMonth = (dir: -1 | 1) => {
    let m = selectedMonth + dir
    let y = selectedYear
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setSelectedMonth(m)
    setSelectedYear(y)
  }

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    onNavigate?.()
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
  }

  return (
    <div className="flex flex-col h-full">
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
}
