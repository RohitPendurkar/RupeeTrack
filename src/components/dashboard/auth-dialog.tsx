"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  User, Mail, Lock, Eye, EyeOff, IndianRupee, Loader2,
} from "lucide-react"

export function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authLoading, setAuthLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "", monthlySalary: "" })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginForm.email || !loginForm.password) {
      toast.error("Please fill in all fields")
      return
    }
    setAuthLoading(true)
    try {
      const result = await signIn("credentials", {
        email: loginForm.email,
        password: loginForm.password,
        redirect: false,
      })
      if (result?.error) {
        toast.error(result.error)
      } else if (result?.ok) {
        toast.success("Welcome back!")
        onOpenChange(false)
      }
    } catch {
      toast.error("Login failed. Please try again.")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      toast.error("Please fill in all required fields")
      return
    }
    if (registerForm.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    setAuthLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          password: registerForm.password,
          monthlySalary: registerForm.monthlySalary ? parseFloat(registerForm.monthlySalary) : 0,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Account created! Please sign in.")
        setAuthMode("login")
        setLoginForm({ email: registerForm.email, password: "" })
        setRegisterForm({ name: "", email: "", password: "", monthlySalary: "" })
      } else {
        toast.error(data.error || "Registration failed")
      }
    } catch {
      toast.error("Registration failed. Please try again.")
    } finally {
      setAuthLoading(false)
    }
  }

  const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL || "demo@rupeetrack.in"
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD || "demo123"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">₹</div>
            <span className="font-bold text-lg">RupeeTrack</span>
          </div>
          <DialogTitle className="text-center text-xl">
            {authMode === "login" ? "Welcome Back!" : "Create Your Account"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {authMode === "login"
              ? "Sign in to access your dashboard"
              : "Start your financial journey today"}
          </DialogDescription>
        </DialogHeader>
        {authMode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="pl-10" disabled={authLoading} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••"
                  value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="pl-10 pr-10" disabled={authLoading} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
              disabled={authLoading}>
              {authLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Sign In
            </Button>
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Demo Account</span></div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-sm">
              <p className="text-muted-foreground text-center">
                <span className="font-mono text-xs">{demoEmail}</span> / <span className="font-mono text-xs">{demoPassword}</span>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="reg-name" type="text" placeholder="Rohit Pendurkar" value={registerForm.name}
                  onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                  className="pl-10" disabled={authLoading} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="reg-email" type="email" placeholder="you@example.com" value={registerForm.email}
                  onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="pl-10" disabled={authLoading} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="reg-password" type={showPassword ? "text" : "password"} placeholder="Min 6 characters"
                  value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="pl-10 pr-10" disabled={authLoading} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-salary">Monthly Salary (₹) <span className="text-muted-foreground text-xs">optional</span></Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="reg-salary" type="number" placeholder="75000" value={registerForm.monthlySalary}
                  onChange={e => setRegisterForm({ ...registerForm, monthlySalary: e.target.value })}
                  className="pl-10" disabled={authLoading} />
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
              disabled={authLoading}>
              {authLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Account
            </Button>
          </form>
        )}
        <div className="text-center pt-2 border-t mt-2">
          <p className="text-sm text-muted-foreground">
            {authMode === "login" ? "Don't have an account?" : "Already have an account?"}
            <button type="button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
              className="ml-1 font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
              {authMode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
