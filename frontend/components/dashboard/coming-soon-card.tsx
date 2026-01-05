import { Sparkles, BarChart3, Lock, GitCompare, Wrench, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  { name: "Analytics", icon: BarChart3 },
  { name: "Reconciliation", icon: GitCompare },
  { name: "Custom Work", icon: Wrench },
  { name: "Top-line", icon: TrendingUp },
];

export function ComingSoonCard({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold text-accent">Coming Soon</span>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-2">
        {features.map((feature) => (
          <div
            key={feature.name}
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
          >
            <feature.icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{feature.name}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-4 pt-3 border-t">
        More tools launching soon
      </p>
    </div>
  );
}
