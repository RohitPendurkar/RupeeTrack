import { Card, CardContent } from "@/components/ui/card"

export function SummaryCard({ title, value, icon, color, subtitle }: {
  title: string; value: string; icon: React.ReactNode; color: string; subtitle: string
}) {
  const colorMap: Record<string, string> = {
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    rose: "from-rose-500/10 to-rose-500/5 border-rose-500/20",
    teal: "from-teal-500/10 to-teal-500/5 border-teal-500/20",
    red: "from-red-500/10 to-red-500/5 border-red-500/20",
    violet: "from-violet-500/10 to-violet-500/5 border-violet-500/20",
    amber: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
  }
  const iconColorMap: Record<string, string> = {
    emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600",
    rose: "bg-rose-100 dark:bg-rose-900/30 text-rose-600",
    teal: "bg-teal-100 dark:bg-teal-900/30 text-teal-600",
    red: "bg-red-100 dark:bg-red-900/30 text-red-600",
    violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-600",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
  }

  return (
    <Card className={`bg-gradient-to-br ${colorMap[color] || colorMap.emerald} border`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconColorMap[color] || iconColorMap.emerald}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
