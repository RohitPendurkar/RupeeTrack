import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, monthlySalary } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        monthlySalary: monthlySalary || 0,
        taxRegime: "new",
      },
    })

    // Create default categories for the new user
    const defaultExpenseCategories = [
      { name: 'Rent', icon: 'Home', color: '#ef4444', type: 'expense', isDefault: true },
      { name: 'Groceries', icon: 'ShoppingCart', color: '#f97316', type: 'expense', isDefault: true },
      { name: 'Electricity', icon: 'Zap', color: '#eab308', type: 'expense', isDefault: true },
      { name: 'Water', icon: 'Droplets', color: '#3b82f6', type: 'expense', isDefault: true },
      { name: 'Gas / LPG', icon: 'Flame', color: '#f59e0b', type: 'expense', isDefault: true },
      { name: 'Mobile Recharge', icon: 'Smartphone', color: '#8b5cf6', type: 'expense', isDefault: true },
      { name: 'Internet / WiFi', icon: 'Wifi', color: '#6366f1', type: 'expense', isDefault: true },
      { name: 'DTH / Cable', icon: 'Tv', color: '#a855f7', type: 'expense', isDefault: true },
      { name: 'Maid / Cook', icon: 'HandHelping', color: '#ec4899', type: 'expense', isDefault: true },
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
      { name: 'Other Expense', icon: 'MoreHorizontal', color: '#6b7280', type: 'expense', isDefault: true },
    ]

    const defaultIncomeCategories = [
      { name: 'Salary', icon: 'Briefcase', color: '#22c55e', type: 'income', isDefault: true },
      { name: 'Bonus', icon: 'Award', color: '#16a34a', type: 'income', isDefault: true },
      { name: 'Freelance', icon: 'Laptop', color: '#15803d', type: 'income', isDefault: true },
      { name: 'Rental Income', icon: 'Building2', color: '#166534', type: 'income', isDefault: true },
      { name: 'Interest Income', icon: 'Percent', color: '#14532d', type: 'income', isDefault: true },
      { name: 'Dividend', icon: 'TrendingUp', color: '#059669', type: 'income', isDefault: true },
      { name: 'Other Income', icon: 'Plus', color: '#6b7280', type: 'income', isDefault: true },
    ]

    for (const cat of defaultExpenseCategories) {
      await db.category.create({ data: { ...cat, userId: user.id } })
    }
    for (const cat of defaultIncomeCategories) {
      await db.category.create({ data: { ...cat, userId: user.id } })
    }

    return NextResponse.json(
      { message: "Account created successfully! Please sign in.", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
