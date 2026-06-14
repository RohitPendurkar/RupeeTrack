// Indian Tax Calculator - Old vs New Regime (FY 2024-25)

export interface TaxResult {
  regime: 'old' | 'new'
  grossIncome: number
  totalDeductions: number
  taxableIncome: number
  taxAmount: number
  cess: number
  totalTax: number
  effectiveRate: number
  slabs: { slab: string; rate: number; amount: number }[]
}

export interface Deductions {
  section80C: number   // Max 1,50,000 (PF, PPF, ELSS, LIC, etc.)
  section80D: number   // Max 25,000 (Health Insurance) / 50,000 for parents
  section80CCD: number // Max 50,000 (NPS additional)
  hra: number          // House Rent Allowance
  section24b: number   // Max 2,00,000 (Home Loan Interest)
  section80E: number   // Education Loan Interest (no limit)
  section80G: number   // Donations (50% or 100% with/without qualifying limit)
  otherDeductions: number
}

const DEFAULT_DEDUCTIONS: Deductions = {
  section80C: 0,
  section80D: 0,
  section80CCD: 0,
  hra: 0,
  section24b: 0,
  section80E: 0,
  section80G: 0,
  otherDeductions: 0,
}

// New Regime Slabs (FY 2024-25)
const NEW_REGIME_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 0.05 },
  { min: 700000, max: 1000000, rate: 0.10 },
  { min: 1000000, max: 1200000, rate: 0.15 },
  { min: 1200000, max: 1500000, rate: 0.20 },
  { min: 1500000, max: Infinity, rate: 0.30 },
]

// Old Regime Slabs (FY 2024-25)
const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 0.05 },
  { min: 500000, max: 1000000, rate: 0.20 },
  { min: 1000000, max: Infinity, rate: 0.30 },
]

function calculateSlabTax(income: number, slabs: typeof NEW_REGIME_SLABS): { slab: string; rate: number; amount: number }[] {
  const result: { slab: string; rate: number; amount: number }[] = []
  let remaining = income

  for (const slab of slabs) {
    const slabWidth = slab.max === Infinity ? remaining : slab.max - slab.min
    const taxableInSlab = Math.max(0, Math.min(remaining, slabWidth))
    const tax = taxableInSlab * slab.rate

    if (taxableInSlab > 0) {
      const slabLabel = slab.max === Infinity
        ? `Above ₹${(slab.min / 100000).toFixed(1)}L`
        : `₹${(slab.min / 100000).toFixed(1)}L - ₹${(slab.max / 100000).toFixed(1)}L`

      result.push({
        slab: slabLabel,
        rate: slab.rate * 100,
        amount: Math.round(tax),
      })
    }

    remaining -= taxableInSlab
    if (remaining <= 0) break
  }

  return result
}

export function calculateNewRegimeTax(grossIncome: number): TaxResult {
  const slabs = calculateSlabTax(grossIncome, NEW_REGIME_SLABS)
  let taxAmount = slabs.reduce((sum, s) => sum + s.amount, 0)

  // Rebate u/s 87A for income up to 7L under new regime
  if (grossIncome <= 700000) {
    taxAmount = 0
  }

  const cess = Math.round(taxAmount * 0.04)
  const totalTax = taxAmount + cess
  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0

  return {
    regime: 'new',
    grossIncome,
    totalDeductions: 0, // New regime has standard deduction of 50,000
    taxableIncome: Math.max(0, grossIncome - 50000), // Standard deduction
    taxAmount,
    cess,
    totalTax,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    slabs,
  }
}

export function calculateOldRegimeTax(grossIncome: number, deductions: Deductions = DEFAULT_DEDUCTIONS): TaxResult {
  // Standard deduction of 50,000
  const standardDeduction = 50000

  const totalDeductions = standardDeduction +
    Math.min(deductions.section80C, 150000) +
    Math.min(deductions.section80D, 25000) +
    Math.min(deductions.section80CCD, 50000) +
    deductions.hra +
    Math.min(deductions.section24b, 200000) +
    deductions.section80E +
    deductions.section80G +
    deductions.otherDeductions

  const taxableIncome = Math.max(0, grossIncome - totalDeductions)
  const slabs = calculateSlabTax(taxableIncome, OLD_REGIME_SLABS)
  let taxAmount = slabs.reduce((sum, s) => sum + s.amount, 0)

  // Rebate u/s 87A for income up to 5L under old regime
  if (taxableIncome <= 500000) {
    taxAmount = 0
  }

  const cess = Math.round(taxAmount * 0.04)
  const totalTax = taxAmount + cess
  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0

  return {
    regime: 'old',
    grossIncome,
    totalDeductions,
    taxableIncome,
    taxAmount,
    cess,
    totalTax,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    slabs,
  }
}

export function compareRegimes(grossIncome: number, deductions: Deductions = DEFAULT_DEDUCTIONS): {
  oldRegime: TaxResult
  newRegime: TaxResult
  savings: number
  betterRegime: 'old' | 'new'
} {
  const oldRegime = calculateOldRegimeTax(grossIncome, deductions)
  const newRegime = calculateNewRegimeTax(grossIncome)

  const savings = Math.abs(oldRegime.totalTax - newRegime.totalTax)
  const betterRegime = oldRegime.totalTax <= newRegime.totalTax ? 'old' : 'new'

  return { oldRegime, newRegime, savings, betterRegime }
}
