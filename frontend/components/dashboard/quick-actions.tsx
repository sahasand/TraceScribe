"use client";

import Link from "next/link";
import { FileText, Upload, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    name: "ICF",
    description: "Informed Consent",
    color: "from-teal-500 to-emerald-500",
  },
  {
    name: "DMP",
    description: "Data Management",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "SAP",
    description: "Statistical Analysis",
    color: "from-violet-500 to-purple-500",
  },
];

export function QuickActions({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action) => (
          <button
            key={action.name}
            className={cn(
              "relative group p-4 rounded-xl text-white text-center",
              "bg-gradient-to-br transition-all duration-300",
              "hover:scale-105 hover:shadow-lg",
              action.color
            )}
          >
            <p className="text-lg font-bold">{action.name}</p>
            <p className="text-xs opacity-80">{action.description}</p>
          </button>
        ))}
      </div>

      <Link
        href="/protocols"
        className="flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Upload Protocol</p>
            <p className="text-xs text-muted-foreground">Start generating documents</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </Link>
    </div>
  );
}
