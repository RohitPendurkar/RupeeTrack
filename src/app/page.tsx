"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useAppStore } from "@/lib/store"
import { AnimatePresence } from "framer-motion"
import { Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetTrigger,
} from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-provider"
import { LandingPage } from "@/components/dashboard/landing-page"
import { SidebarContent } from "@/components/dashboard/sidebar"
import { DashboardTab } from "@/components/dashboard/dashboard-tab"
import { TransactionsTab } from "@/components/dashboard/transactions-tab"
import { BudgetsTab } from "@/components/dashboard/budgets-tab"
import { GoalsTab } from "@/components/dashboard/goals-tab"
import { InvestmentsTab } from "@/components/dashboard/investments-tab"
import { FinancialHealthTab } from "@/components/dashboard/financial-health-tab"
import { BillsTab } from "@/components/dashboard/bills-tab"
import { ReportsTab } from "@/components/dashboard/reports-tab"
import { signOut } from "next-auth/react"
import { toast } from "sonner"

export default function HomePage() {
  const { data: session, status } = useSession()
  const { activeTab } = useAppStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await signOut({ redirect: false })
    toast.success("Logged out successfully")
  }

  if (status === "unauthenticated") {
    return <LandingPage />
  }

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

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:flex w-64 border-r border-border flex-col bg-card/50 backdrop-blur-sm sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      <main className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center justify-between">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
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
