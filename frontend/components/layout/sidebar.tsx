"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Upload,
  FileCheck,
  Settings,
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Lock,
  GitCompare,
  Wrench,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useState } from "react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
  badge?: string;
}

const navigation: NavGroup[] = [
  {
    label: "Workspace",
    defaultOpen: true,
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Protocols", href: "/protocols", icon: Upload },
      { name: "Documents", href: "/documents", icon: FileCheck },
    ],
  },
  {
    label: "Analytics",
    items: [
      { name: "Dashboards", href: "/dashboards/query-status", icon: BarChart3 },
      { name: "Top-line Results", href: "/topline-results", icon: TrendingUp },
    ],
  },
  {
    label: "Data Tools",
    items: [
      { name: "DBL Tracker", href: "/dbl-tracker", icon: Lock },
      { name: "Data Reconciliation", href: "/data-reconciliation", icon: GitCompare },
      { name: "Custom Work", href: "/custom-work", icon: Wrench, disabled: true },
    ],
  },
];

function NavGroupComponent({ group }: { group: NavGroup }) {
  const [isOpen, setIsOpen] = useState(group.defaultOpen ?? true);
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted hover:text-sidebar-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          {group.label}
          {group.badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-accent/20 text-accent rounded">
              {group.badge}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            isOpen ? "rotate-0" : "-rotate-90"
          )}
        />
      </button>

      <div
        className={cn(
          "space-y-0.5 overflow-hidden transition-all duration-200",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {group.items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.name}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                item.disabled && "pointer-events-none",
                isActive
                  ? "bg-sidebar-accent text-white shadow-glow"
                  : item.disabled
                  ? "text-sidebar-muted/50 cursor-not-allowed"
                  : "text-sidebar-muted hover:bg-sidebar-border/50 hover:text-sidebar-foreground"
              )}
              onClick={(e) => item.disabled && e.preventDefault()}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.name}</span>
              {item.disabled && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sidebar-border text-sidebar-muted">
                  soon
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-bg border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">
            TraceScribe
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navigation.map((group) => (
          <NavGroupComponent key={group.label} group={group} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-sidebar-border">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
            pathname === "/settings"
              ? "bg-sidebar-accent text-white"
              : "text-sidebar-muted hover:bg-sidebar-border/50 hover:text-sidebar-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
