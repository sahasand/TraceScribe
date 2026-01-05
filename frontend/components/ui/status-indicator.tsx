import { cn } from "@/lib/utils";
import { Check, AlertCircle, Loader2, Clock, Languages } from "lucide-react";

type Status = "generating" | "draft" | "final" | "error" | "translating";

interface StatusIndicatorProps {
  status: Status;
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  generating: {
    icon: Loader2,
    label: "Generating",
    color: "text-info",
    bgColor: "bg-info/10",
    animate: true,
  },
  translating: {
    icon: Languages,
    label: "Translating",
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950",
    animate: true,
  },
  draft: {
    icon: Clock,
    label: "Draft",
    color: "text-warning",
    bgColor: "bg-warning/10",
    animate: false,
  },
  final: {
    icon: Check,
    label: "Final",
    color: "text-success",
    bgColor: "bg-success/10",
    animate: false,
  },
  error: {
    icon: AlertCircle,
    label: "Error",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    animate: false,
  },
};

export function StatusIndicator({
  status,
  showLabel = true,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        config.bgColor,
        config.color,
        className
      )}
    >
      <Icon
        className={cn(
          "h-3 w-3",
          config.animate && "animate-spin"
        )}
      />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}
