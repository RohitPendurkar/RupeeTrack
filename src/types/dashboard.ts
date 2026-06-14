export interface Category {
  id: string
  name: string
  type: string
  icon: string
  color: string
  isDefault: boolean
}

export interface Transaction {
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

export interface BudgetItem {
  id: string
  categoryId: string
  amount: number
  month: number
  year: number
  category: Category
  spent: number
}

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string | null
  icon: string
  color: string
  contributions: { id: string; amount: number; date: string; note: string | null }[]
}

export interface Investment {
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

export interface BillReminder {
  id: string
  name: string
  amount: number
  dueDate: string
  category: string
  isPaid: boolean
  isRecurring: boolean
  recurringFreq: string | null
}

export interface DashboardData {
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
