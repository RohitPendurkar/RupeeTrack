export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 animate-pulse">
          ₹
        </div>
        <p className="text-muted-foreground">Loading RupeeTrack...</p>
      </div>
    </div>
  )
}
