"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowUpRight, ArrowLeftRight, Wallet, Target, TrendingUp,
  Heart, Bell, BarChart3, PiggyBank, Shield, User,
  IndianRupee, CheckCircle2, Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-provider"
import { AuthDialog } from "./auth-dialog"

export function LandingPage() {
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-md">₹</div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">RupeeTrack</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => { setAuthMode("login"); setShowAuthDialog(true) }}>
              Sign In
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
              onClick={() => { setAuthMode("register"); setShowAuthDialog(true) }}
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl" />
          <div className="absolute top-1/3 right-1/6 text-[18rem] font-black text-emerald-500/[0.03] select-none">₹</div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                Made for India • 100% Free
              </Badge>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            >
              Master your money,
              <br />
              <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 bg-clip-text text-transparent">
                the Indian way.
              </span>
            </motion.h1>

            <motion.p
              className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            >
              Track every rupee with Indian categories, manage investments from PF to SIP,
              build savings goals, and know your financial health score — all in one place.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button
                size="lg" className="text-lg px-8 h-14 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/25"
                onClick={() => { setAuthMode("register"); setShowAuthDialog(true) }}
              >
                Start Tracking Free
                <ArrowUpRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 h-14 border-2"
                onClick={() => { setAuthMode("login"); setShowAuthDialog(true) }}
              >
                Sign In to Dashboard
              </Button>
            </motion.div>

            <motion.p className="mt-5 text-sm text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
              No credit card needed • Set up in 30 seconds
            </motion.p>

            <motion.div
              className="mt-16 relative"
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
            >
              <div className="relative mx-auto max-w-5xl rounded-2xl border border-border/50 shadow-2xl shadow-emerald-500/10 overflow-hidden bg-card">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
                  <div className="h-3 w-3 rounded-full bg-rose-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs text-muted-foreground">rupeetrack.in — Dashboard</span>
                </div>
                <div className="p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Monthly Income", value: "₹75,000", color: "emerald", icon: "↑" },
                    { label: "Expenses", value: "₹42,300", color: "rose", icon: "↓" },
                    { label: "Savings", value: "₹32,700", color: "teal", icon: "🐷" },
                    { label: "Investments", value: "₹8.5L", color: "violet", icon: "📈" },
                  ].map((card, i) => (
                    <div key={i} className={`rounded-xl p-4 bg-gradient-to-br ${
                      card.color === "emerald" ? "from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20" :
                      card.color === "rose" ? "from-rose-500/10 to-rose-500/5 border border-rose-500/20" :
                      card.color === "teal" ? "from-teal-500/10 to-teal-500/5 border border-teal-500/20" :
                      "from-violet-500/10 to-violet-500/5 border border-violet-500/20"
                    }`}>
                      <p className="text-xs text-muted-foreground">{card.icon} {card.label}</p>
                      <p className="text-xl font-bold mt-1">{card.value}</p>
                    </div>
                  ))}
                </div>
                <div className="px-6 pb-6 sm:px-8 sm:pb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border/50 p-4 h-40 flex items-center justify-center text-muted-foreground/40 text-sm">
                    📊 Spending by Category Pie Chart
                  </div>
                  <div className="rounded-xl border border-border/50 p-4 h-40 flex items-center justify-center text-muted-foreground/40 text-sm">
                    📈 Daily Spending Trend
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 blur-3xl rounded-full" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/40 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "50+", label: "Indian Categories" },
              { value: "8", label: "Feature Modules" },
              { value: "100%", label: "Free Forever" },
              { value: "0", label: "Data Shared" },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Everything you need to manage money in India</h2>
            <p className="mt-4 text-muted-foreground text-lg">From daily chai expenses to long-term SIP investments — we&apos;ve got you covered.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <ArrowLeftRight className="h-6 w-6" />, title: "Smart Transactions", desc: "Track every rupee with Indian categories — Swiggy, Zomato, DTH, LPG, Maid, Uber, and 50+ more.", color: "emerald" },
              { icon: <Wallet className="h-6 w-6" />, title: "Budget Tracking", desc: "Set monthly budgets per category. Get visual alerts when you're overspending before month-end.", color: "violet" },
              { icon: <Heart className="h-6 w-6" />, title: "Financial Health Score", desc: "Get a personalized 0-100 score based on savings rate, budget discipline, emergency fund, and more.", color: "rose" },
              { icon: <Target className="h-6 w-6" />, title: "Savings Goals", desc: "Planning a Goa trip? New laptop? Wedding fund? Set goals, track progress, and celebrate milestones.", color: "amber" },
              { icon: <TrendingUp className="h-6 w-6" />, title: "Investment Portfolio", desc: "Track PF, PPF, Mutual Funds, SIP, FD, Stocks, NPS — all in one dashboard with returns tracking.", color: "sky" },
              { icon: <Bell className="h-6 w-6" />, title: "Bill Reminders", desc: "Never miss a bill again. Track rent, EMIs, subscriptions with due date alerts and recurring support.", color: "orange" },
              { icon: <BarChart3 className="h-6 w-6" />, title: "Financial Reports", desc: "Monthly reports with income vs expense charts, top spending categories, and health indicators.", color: "pink" },
              { icon: <PiggyBank className="h-6 w-6" />, title: "Emergency Fund Tracker", desc: "Know exactly how many months of expenses your savings can cover. Aim for the 6-month target.", color: "teal" },
              { icon: <Shield className="h-6 w-6" />, title: "Secure & Private", desc: "Your financial data stays yours. Encrypted passwords, secure sessions, zero data sharing. Ever.", color: "indigo" },
            ].map((feature, i) => {
              const colorMap: Record<string, string> = {
                emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600",
                violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-600",
                rose: "bg-rose-100 dark:bg-rose-900/30 text-rose-600",
                amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
                sky: "bg-sky-100 dark:bg-sky-900/30 text-sky-600",
                orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600",
                pink: "bg-pink-100 dark:bg-pink-900/30 text-pink-600",
                teal: "bg-teal-100 dark:bg-teal-900/30 text-teal-600",
                indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600",
              }
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group border-border/50">
                    <CardContent className="pt-6">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${colorMap[feature.color] || colorMap.emerald} group-hover:scale-110 transition-transform`}>
                        {feature.icon}
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 sm:py-28 bg-muted/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Start your financial journey in 3 steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { step: "01", title: "Sign up in seconds", desc: "Create your free account. No credit card, no paperwork. Just your name and email.", icon: <User className="h-8 w-8" /> },
              { step: "02", title: "Track your money", desc: "Add transactions with Indian categories. Set budgets. Add your investments and bills.", icon: <ArrowLeftRight className="h-8 w-8" /> },
              { step: "03", title: "Watch your health improve", desc: "See your Financial Health Score rise as you save more, invest better, and stay on budget.", icon: <Heart className="h-8 w-8" /> },
            ].map((step, i) => (
              <motion.div key={i} className="relative text-center" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                {i < 2 && <div className="hidden md:block absolute top-12 left-[60%] w-[80%] border-t-2 border-dashed border-emerald-300 dark:border-emerald-700" />}
                <div className="relative z-10 mx-auto mb-6 h-24 w-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center text-white shadow-xl shadow-emerald-500/25">
                  {step.icon}
                  <span className="text-xs font-bold mt-1 opacity-80">{step.step}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Loved by people who track every rupee</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Priya Sharma", role: "Software Engineer, Bangalore", text: "Finally an expense tracker that understands Indian spending! Swiggy, Zomato, DTH — all categories I actually use. My savings went from 5% to 22% in 3 months.", avatar: "P" },
              { name: "Rahul Verma", role: "Product Manager, Mumbai", text: "The Financial Health Score is a game-changer. It's like a credit score for my daily finances. I check it every week and try to improve my grade.", avatar: "R" },
              { name: "Ananya Patel", role: "CA Student, Ahmedabad", text: "Tracking my SIP, PPF, and FD in one place is so convenient. I used to maintain spreadsheets. Now it's all automated with beautiful charts.", avatar: "A" },
            ].map((testimonial, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full border-border/50 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (<span key={j} className="text-amber-400 text-lg">★</span>))}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90 mb-6">&ldquo;{testimonial.text}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">{testimonial.avatar}</div>
                      <div>
                        <p className="text-sm font-semibold">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">Ready to take control of your finances?</h2>
            <p className="mt-6 text-emerald-100 text-lg max-w-2xl mx-auto leading-relaxed">
              Join thousands of Indians who are saving smarter, investing better, and living financially healthier — for free.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-lg px-8 h-14 bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl"
                onClick={() => { setAuthMode("register"); setShowAuthDialog(true) }}>
                Get Started — It&apos;s Free
                <ArrowUpRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 h-14 border-2 border-white/30 text-white hover:bg-white/10"
                onClick={() => { setAuthMode("login"); setShowAuthDialog(true) }}>
                I already have an account
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border/40 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">₹</div>
              <span className="font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">RupeeTrack</span>
            </div>
            <p className="text-sm text-muted-foreground">Made with ❤️ for India • Your data stays yours. Always.</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>© 2025 RupeeTrack</span>
            </div>
          </div>
        </div>
      </footer>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  )
}
