import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-2xl mb-6">
        ?
      </div>
      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        This page doesn&apos;t exist. Let&apos;s get you back on track.
      </p>
      <Link href="/">
        <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
          Go Home
        </Button>
      </Link>
    </div>
  )
}
