"use client";

import { useEffect, useState } from "react";
import { Upload, FileCheck, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ComingSoonCard } from "@/components/dashboard/coming-soon-card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api-client";

interface DashboardStats {
  protocols: number;
  documents: number;
  drafts: number;
  finals: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    protocols: 0,
    documents: 0,
    drafts: 0,
    finals: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [protocolsRes, documentsRes] = await Promise.all([
          api.listProtocols(),
          api.listDocuments(),
        ]);

        const docs = documentsRes.documents || [];
        setStats({
          protocols: protocolsRes.protocols?.length || 0,
          documents: docs.length,
          drafts: docs.filter((d: any) => d.status === "draft").length,
          finals: docs.filter((d: any) => d.status === "final").length,
        });

        // Create activity feed from recent items
        const recentActivities = docs.slice(0, 5).map((doc: any) => ({
          id: doc.id,
          type: "generate" as const,
          title: `${doc.document_type.toUpperCase()} generated`,
          timestamp: formatRelativeTime(doc.created_at),
        }));
        setActivities(recentActivities);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 stagger-children">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="text-muted-foreground">
            {stats.protocols} protocols, {stats.documents} documents generated
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/protocols">
            <Upload className="h-4 w-4" />
            New Protocol
          </Link>
        </Button>
      </div>

      {/* Bento Grid */}
      <BentoGrid>
        {/* Stats Cards */}
        <BentoCard>
          <StatsCard
            title="Protocols"
            value={stats.protocols}
            icon={Upload}
            subtitle="Clinical trial protocols uploaded"
          />
        </BentoCard>

        <BentoCard>
          <StatsCard
            title="Documents"
            value={stats.documents}
            icon={FileCheck}
            subtitle={`${stats.drafts} drafts, ${stats.finals} final`}
          />
        </BentoCard>

        {/* Quick Actions */}
        <BentoCard rowSpan={2}>
          <div className="flex flex-col h-full">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">
              Quick Actions
            </h3>
            <QuickActions className="flex-1" />
          </div>
        </BentoCard>

        {/* Recent Activity */}
        <BentoCard colSpan={2}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Recent Activity
              </h3>
              <Link
                href="/documents"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <ActivityFeed activities={activities} className="flex-1" />
          </div>
        </BentoCard>

        {/* Coming Soon */}
        <BentoCard className="bg-gradient-to-br from-muted/50 to-muted">
          <ComingSoonCard />
        </BentoCard>
      </BentoGrid>
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
