"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-destructive to-rose-600 flex items-center justify-center text-white font-bold text-2xl mb-6">
        !
      </div>
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={reset} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
        Try Again
      </Button>
    </div>
  )
}
