import { create } from 'zustand'

export type TabId = 'dashboard' | 'transactions' | 'budgets' | 'goals' | 'investments' | 'health' | 'bills' | 'reports'

interface AppState {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  selectedMonth: number
  selectedYear: number
  setSelectedMonth: (month: number) => void
  setSelectedYear: (year: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  selectedMonth: new Date().getMonth() + 1,
  selectedYear: new Date().getFullYear(),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  setSelectedYear: (year) => set({ selectedYear: year }),
}))
