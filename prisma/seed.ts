import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

const EXPENSE_CATEGORIES = [
  { name: 'Rent', icon: 'Home', color: '#ef4444', type: 'expense', isDefault: true },
  { name: 'Groceries', icon: 'ShoppingCart', color: '#f97316', type: 'expense', isDefault: true },
  { name: 'Electricity', icon: 'Zap', color: '#eab308', type: 'expense', isDefault: true },
  { name: 'Water', icon: 'Droplets', color: '#3b82f6', type: 'expense', isDefault: true },
  { name: 'Gas / LPG', icon: 'Flame', color: '#f59e0b', type: 'expense', isDefault: true },
  { name: 'Mobile Recharge', icon: 'Smartphone', color: '#8b5cf6', type: 'expense', isDefault: true },
  { name: 'Internet / WiFi', icon: 'Wifi', color: '#6366f1', type: 'expense', isDefault: true },
  { name: 'DTH / Cable', icon: 'Tv', color: '#a855f7', type: 'expense', isDefault: true },
  { name: 'Maid / Cook', icon: 'HandHelping', color: '#ec4899', type: 'expense', isDefault: true },
  { name: 'Driver', icon: 'Car', color: '#14b8a6', type: 'expense', isDefault: true },
  { name: 'Transport', icon: 'Bus', color: '#06b6d4', type: 'expense', isDefault: true },
  { name: 'Fuel', icon: 'Fuel', color: '#84cc16', type: 'expense', isDefault: true },
  { name: 'Dining Out', icon: 'UtensilsCrossed', color: '#f43f5e', type: 'expense', isDefault: true },
  { name: 'Swiggy / Zomato', icon: 'Bike', color: '#fb923c', type: 'expense', isDefault: true },
  { name: 'Medical', icon: 'Heart', color: '#dc2626', type: 'expense', isDefault: true },
  { name: 'Medicine', icon: 'Pill', color: '#e11d48', type: 'expense', isDefault: true },
  { name: 'Education', icon: 'GraduationCap', color: '#7c3aed', type: 'expense', isDefault: true },
  { name: 'EMI / Loan', icon: 'Landmark', color: '#be123c', type: 'expense', isDefault: true },
  { name: 'Insurance', icon: 'Shield', color: '#0ea5e9', type: 'expense', isDefault: true },
  { name: 'Clothing', icon: 'Shirt', color: '#d946ef', type: 'expense', isDefault: true },
  { name: 'Personal Care', icon: 'Sparkles', color: '#f472b6', type: 'expense', isDefault: true },
  { name: 'Gym / Fitness', icon: 'Dumbbell', color: '#22c55e', type: 'expense', isDefault: true },
  { name: 'Entertainment', icon: 'Gamepad2', color: '#a78bfa', type: 'expense', isDefault: true },
  { name: 'Subscriptions', icon: 'CreditCard', color: '#6d28d9', type: 'expense', isDefault: true },
  { name: 'Gifts / Donations', icon: 'Gift', color: '#fb7185', type: 'expense', isDefault: true },
  { name: 'Festival Expenses', icon: 'PartyPopper', color: '#fbbf24', type: 'expense', isDefault: true },
  { name: 'Vacation / Travel', icon: 'Plane', color: '#2dd4bf', type: 'expense', isDefault: true },
  { name: 'Home Maintenance', icon: 'Wrench', color: '#78716c', type: 'expense', isDefault: true },
  { name: 'Car Maintenance', icon: 'CarFront', color: '#57534e', type: 'expense', isDefault: true },
  { name: 'Pet Care', icon: 'PawPrint', color: '#a3e635', type: 'expense', isDefault: true },
  { name: 'Other Expense', icon: 'MoreHorizontal', color: '#6b7280', type: 'expense', isDefault: true },
]

const INCOME_CATEGORIES = [
  { name: 'Salary', icon: 'Briefcase', color: '#22c55e', type: 'income', isDefault: true },
  { name: 'Bonus', icon: 'Award', color: '#16a34a', type: 'income', isDefault: true },
  { name: 'Freelance', icon: 'Laptop', color: '#15803d', type: 'income', isDefault: true },
  { name: 'Rental Income', icon: 'Building2', color: '#166534', type: 'income', isDefault: true },
  { name: 'Interest Income', icon: 'Percent', color: '#14532d', type: 'income', isDefault: true },
  { name: 'Dividend', icon: 'TrendingUp', color: '#059669', type: 'income', isDefault: true },
  { name: 'Capital Gains', icon: 'ArrowUpRight', color: '#047857', type: 'income', isDefault: true },
  { name: 'Side Business', icon: 'Store', color: '#065f46', type: 'income', isDefault: true },
  { name: 'Refund', icon: 'RotateCcw', color: '#0d9488', type: 'income', isDefault: true },
  { name: 'Other Income', icon: 'Plus', color: '#6b7280', type: 'income', isDefault: true },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 12)
  const user = await db.user.create({
    data: {
      name: 'Rohit Pendurkar',
      email: 'demo@rupeetrack.in',
      password: hashedPassword,
      monthlySalary: 75000,
      taxRegime: 'new',
    },
  })
  console.log(`✅ Created demo user: ${user.email} (password: demo123)`)

  const userId = user.id

  // Create expense categories
  for (const cat of EXPENSE_CATEGORIES) {
    await db.category.create({ data: { ...cat, userId } })
  }
  console.log(`✅ Created ${EXPENSE_CATEGORIES.length} expense categories`)

  // Create income categories
  for (const cat of INCOME_CATEGORIES) {
    await db.category.create({ data: { ...cat, userId } })
  }
  console.log(`✅ Created ${INCOME_CATEGORIES.length} income categories`)

  // Create sample transactions for current month
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const categories = await db.category.findMany({ where: { userId } })
  const getCategory = (name: string) => categories.find(c => c.name === name)

  const sampleTransactions = [
    { amount: 75000, type: 'income', description: 'Monthly Salary', category: 'Salary', date: new Date(currentYear, currentMonth, 1) },
    { amount: 18000, type: 'expense', description: 'House Rent', category: 'Rent', date: new Date(currentYear, currentMonth, 1) },
    { amount: 5500, type: 'expense', description: 'Groceries from BigBasket', category: 'Groceries', date: new Date(currentYear, currentMonth, 3) },
    { amount: 2100, type: 'expense', description: 'Electricity Bill', category: 'Electricity', date: new Date(currentYear, currentMonth, 5) },
    { amount: 450, type: 'expense', description: 'Water Bill', category: 'Water', date: new Date(currentYear, currentMonth, 5) },
    { amount: 890, type: 'expense', description: 'Jio Recharge', category: 'Mobile Recharge', date: new Date(currentYear, currentMonth, 2) },
    { amount: 999, type: 'expense', description: 'Airtel WiFi', category: 'Internet / WiFi', date: new Date(currentYear, currentMonth, 1) },
    { amount: 4000, type: 'expense', description: 'Maid Salary', category: 'Maid / Cook', date: new Date(currentYear, currentMonth, 1) },
    { amount: 1500, type: 'expense', description: 'Uber / Auto', category: 'Transport', date: new Date(currentYear, currentMonth, 7) },
    { amount: 3500, type: 'expense', description: 'Fuel for Car', category: 'Fuel', date: new Date(currentYear, currentMonth, 6) },
    { amount: 2800, type: 'expense', description: 'Dinner at Punjab Grill', category: 'Dining Out', date: new Date(currentYear, currentMonth, 8) },
    { amount: 1200, type: 'expense', description: 'Swiggy Orders', category: 'Swiggy / Zomato', date: new Date(currentYear, currentMonth, 10) },
    { amount: 500, type: 'expense', description: 'Medicine from Apollo', category: 'Medicine', date: new Date(currentYear, currentMonth, 4) },
    { amount: 15000, type: 'expense', description: 'Personal Loan EMI', category: 'EMI / Loan', date: new Date(currentYear, currentMonth, 5) },
    { amount: 2500, type: 'expense', description: 'Health Insurance', category: 'Insurance', date: new Date(currentYear, currentMonth, 1) },
    { amount: 3000, type: 'expense', description: 'Shopping at Myntra', category: 'Clothing', date: new Date(currentYear, currentMonth, 9) },
    { amount: 1500, type: 'expense', description: 'Cult.fit Membership', category: 'Gym / Fitness', date: new Date(currentYear, currentMonth, 1) },
    { amount: 799, type: 'expense', description: 'Netflix + Hotstar', category: 'Subscriptions', date: new Date(currentYear, currentMonth, 1) },
    { amount: 2000, type: 'expense', description: 'Weekend Movie + Popcorn', category: 'Entertainment', date: new Date(currentYear, currentMonth, 11) },
    { amount: 5000, type: 'expense', description: 'Birthday Gift', category: 'Gifts / Donations', date: new Date(currentYear, currentMonth, 12) },
  ]

  for (const txn of sampleTransactions) {
    const cat = getCategory(txn.category)
    if (cat) {
      await db.transaction.create({
        data: { amount: txn.amount, type: txn.type, description: txn.description, date: txn.date, categoryId: cat.id, userId },
      })
    }
  }
  console.log(`✅ Created ${sampleTransactions.length} sample transactions`)

  // Create sample budgets
  const budgetItems = [
    { category: 'Rent', amount: 18000 },
    { category: 'Groceries', amount: 8000 },
    { category: 'Dining Out', amount: 4000 },
    { category: 'Transport', amount: 3000 },
    { category: 'Entertainment', amount: 3000 },
    { category: 'Shopping', amount: 3000 },
    { category: 'Medical', amount: 2000 },
    { category: 'Subscriptions', amount: 1500 },
    { category: 'Personal Care', amount: 2000 },
    { category: 'Fuel', amount: 4000 },
  ]

  for (const budget of budgetItems) {
    const cat = getCategory(budget.category)
    if (cat) {
      await db.budget.create({
        data: { categoryId: cat.id, amount: budget.amount, month: currentMonth + 1, year: currentYear, userId },
      })
    }
  }
  console.log(`✅ Created ${budgetItems.length} sample budgets`)

  // Create sample savings goals
  const goals = [
    { name: 'Emergency Fund', targetAmount: 300000, currentAmount: 125000, icon: '🛡️', color: '#ef4444', deadline: new Date(currentYear + 1, 5, 30) },
    { name: 'Goa Vacation', targetAmount: 50000, currentAmount: 22000, icon: '🏖️', color: '#06b6d4', deadline: new Date(currentYear, 11, 15) },
    { name: 'New Laptop', targetAmount: 80000, currentAmount: 35000, icon: '💻', color: '#8b5cf6', deadline: new Date(currentYear + 1, 2, 1) },
    { name: 'Diwali Shopping', targetAmount: 25000, currentAmount: 8000, icon: '🪔', color: '#f59e0b', deadline: new Date(currentYear, 9, 20) },
  ]

  for (const goal of goals) {
    await db.savingsGoal.create({ data: { ...goal, userId } })
  }
  console.log(`✅ Created ${goals.length} savings goals`)

  // Create sample investments
  const investments = [
    { name: 'Employee PF', type: 'pf', investedAmount: 540000, currentValue: 612000, startDate: new Date(2020, 3, 1), returnRate: 8.15 },
    { name: 'PPF Account', type: 'ppf', investedAmount: 300000, currentValue: 375000, startDate: new Date(2019, 0, 1), returnRate: 7.1 },
    { name: 'HDFC Mid Cap Fund', type: 'mutual_fund', investedAmount: 120000, currentValue: 168000, startDate: new Date(2022, 5, 15), returnRate: 18.5 },
    { name: 'SBI FD 5 Year', type: 'fd', investedAmount: 200000, currentValue: 228000, startDate: new Date(2022, 0, 1), maturityDate: new Date(2027, 0, 1), returnRate: 6.8 },
    { name: 'NPS Tier 1', type: 'nps', investedAmount: 150000, currentValue: 178500, startDate: new Date(2021, 6, 1), returnRate: 10.2 },
    { name: 'SBI Small Cap SIP', type: 'sip', investedAmount: 180000, currentValue: 252000, startDate: new Date(2021, 0, 1), returnRate: 22.0 },
  ]

  for (const inv of investments) {
    await db.investment.create({ data: { ...inv, userId } })
  }
  console.log(`✅ Created ${investments.length} investments`)

  // Create sample bill reminders
  const bills = [
    { name: 'Rent Payment', amount: 18000, dueDate: new Date(currentYear, currentMonth, 1), category: 'Rent', isRecurring: true, recurringFreq: 'monthly' },
    { name: 'Electricity Bill', amount: 2000, dueDate: new Date(currentYear, currentMonth, 15), category: 'Electricity', isRecurring: true, recurringFreq: 'monthly' },
    { name: 'WiFi Bill', amount: 999, dueDate: new Date(currentYear, currentMonth, 1), category: 'Internet', isRecurring: true, recurringFreq: 'monthly' },
    { name: 'Car Insurance', amount: 12000, dueDate: new Date(currentYear, currentMonth, 20), category: 'Insurance', isPaid: true },
    { name: 'Maid Salary', amount: 4000, dueDate: new Date(currentYear, currentMonth, 1), category: 'Maid', isRecurring: true, recurringFreq: 'monthly' },
  ]

  for (const bill of bills) {
    await db.billReminder.create({ data: { ...bill, userId } })
  }
  console.log(`✅ Created ${bills.length} bill reminders`)

  console.log('\n🎉 Seeding complete!')
  console.log('📧 Login with: demo@rupeetrack.in / demo123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
