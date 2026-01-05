"use client";

import { FileText, Upload, Download, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "upload" | "generate" | "download";
  title: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  className?: string;
}

const iconMap = {
  upload: Upload,
  generate: FileText,
  download: Download,
};

const colorMap = {
  upload: "bg-info/10 text-info",
  generate: "bg-primary/10 text-primary",
  download: "bg-success/10 text-success",
};

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
        <Clock className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {activities.map((activity, index) => {
        const Icon = iconMap[activity.type];
        return (
          <div
            key={activity.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg bg-muted/50 transition-colors hover:bg-muted",
              "animate-fade-in-up opacity-0"
            )}
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
          >
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", colorMap[activity.type])}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{activity.title}</p>
              <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
