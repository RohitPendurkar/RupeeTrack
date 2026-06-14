import { NextResponse } from 'next/server'
import { compareRegimes, type Deductions } from '@/lib/tax-calculator'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { grossIncome, deductions } = body as {
      grossIncome: number
      deductions?: Deductions
    }

    if (!grossIncome || grossIncome <= 0) {
      return NextResponse.json({ error: 'Valid gross income required' }, { status: 400 })
    }

    const result = compareRegimes(grossIncome, deductions)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to calculate tax' }, { status: 500 })
  }
}
