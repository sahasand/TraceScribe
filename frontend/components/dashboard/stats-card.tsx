import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              trend.positive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {trend.positive ? "+" : ""}{trend.value}
          </span>
        )}
      </div>
      <div className="flex-1">
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-sm font-medium text-muted-foreground mt-1">{title}</p>
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
          {subtitle}
        </p>
      )}
    </div>
  );
}
