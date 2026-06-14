import { Progress } from "@/components/ui/progress"
import { percentage } from "@/lib/helpers"

export function HealthIndicator({ label, value, target, unit, color }: {
  label: string; value: number; target: number; unit: string; color: string
}) {
  const pct = Math.min(percentage(value, target), 100)
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    violet: "text-violet-600",
    rose: "text-rose-600",
  }

  return (
    <div className="space-y-2 p-3 rounded-xl bg-muted/50">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${colorMap[color]}`}>{value}{unit}</p>
      <Progress value={pct} className="h-1.5" />
      <p className="text-xs text-muted-foreground">Target: {target}{unit}</p>
    </div>
  )
}
