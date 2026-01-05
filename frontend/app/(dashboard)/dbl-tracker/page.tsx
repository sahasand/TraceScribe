"use client";

import { useState } from "react";
import { Search, AlertCircle, Clock, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- Types ---

interface DatasetStatus {
  name: string;
  status: "SDV" | "DM-REV" | "SDR" | "Empty";
  tooltip: string;
}

interface Visit {
  name: string;
  status: "done" | "not-done";
  datasets: DatasetStatus[];
}

interface Patient {
  id: string;
  site: string;
  status: "Completed" | "Active" | "Discontinued" | "Screen Failure";
  dblReady: boolean;
  completion: number;
  totalDatasets: number;
  completedDatasets: number;
  sdv: number;
  dmRev: number;
  queries: number;
  visits: Visit[];
  blocker?: string;
}

// --- Demo Data ---

const DEMO_PATIENTS: Patient[] = [
  {
    id: "PAT-001",
    site: "Site 001 - North America",
    status: "Completed",
    dblReady: false,
    completion: 87.5,
    totalDatasets: 32,
    completedDatasets: 28,
    sdv: 91.2,
    dmRev: 89.7,
    queries: 2,
    blocker: "2 open queries (max 30 days)",
    visits: [
      {
        name: "Screening",
        status: "done",
        datasets: [
          { name: "DM", status: "SDV", tooltip: "Demographics: SDV Complete" },
          { name: "IE", status: "SDV", tooltip: "Inclusion/Exclusion: SDV Complete" },
          { name: "VS", status: "SDV", tooltip: "Vital Signs: SDV Complete" },
          { name: "LB", status: "DM-REV", tooltip: "Laboratory: DM Review" },
        ]
      },
      {
        name: "Baseline",
        status: "done",
        datasets: [
          { name: "VS", status: "SDV", tooltip: "Vital Signs: SDV Complete" },
          { name: "EG", status: "SDV", tooltip: "ECG: SDV Complete" },
          { name: "LB", status: "SDV", tooltip: "Laboratory: SDV Complete" },
          { name: "EX", status: "SDR", tooltip: "Exposure: SDR" },
        ]
      },
      {
        name: "Week 4",
        status: "done",
        datasets: [
          { name: "VS", status: "SDV", tooltip: "Vital Signs: SDV Complete" },
          { name: "AE", status: "DM-REV", tooltip: "Adverse Events: DM Review" },
          { name: "CM", status: "SDV", tooltip: "Concomitant Meds: SDV Complete" },
        ]
      },
      {
        name: "Week 12",
        status: "done",
        datasets: [
          { name: "VS", status: "SDV", tooltip: "Vital Signs: SDV Complete" },
          { name: "LB", status: "SDV", tooltip: "Laboratory: SDV Complete" },
          { name: "QS", status: "DM-REV", tooltip: "Questionnaire: DM Review" },
        ]
      },
      {
        name: "End of Study",
        status: "done",
        datasets: [
          { name: "DS", status: "SDV", tooltip: "Disposition: SDV Complete" },
          { name: "AE", status: "Empty", tooltip: "Adverse Events: No Data" },
        ]
      },
    ]
  },
  {
    id: "PAT-002",
    site: "Site 002 - Europe",
    status: "Active",
    dblReady: false,
    completion: 72.3,
    totalDatasets: 28,
    completedDatasets: 20,
    sdv: 78.6,
    dmRev: 75.2,
    queries: 5,
    blocker: "SDV 78.6% (target: 100%)",
    visits: [
      {
        name: "Screening",
        status: "done",
        datasets: [
          { name: "DM", status: "SDV", tooltip: "Demographics: SDV Complete" },
          { name: "IE", status: "SDR", tooltip: "Inclusion/Exclusion: SDR" },
          { name: "VS", status: "SDV", tooltip: "Vital Signs: SDV Complete" },
          { name: "LB", status: "SDV", tooltip: "Laboratory: SDV Complete" },
        ]
      },
      {
        name: "Baseline",
        status: "done",
        datasets: [
          { name: "VS", status: "DM-REV", tooltip: "Vital Signs: DM Review" },
          { name: "EG", status: "DM-REV", tooltip: "ECG: DM Review" },
          { name: "LB", status: "SDV", tooltip: "Laboratory: SDV Complete" },
        ]
      },
      {
        name: "Week 4",
        status: "done",
        datasets: [
          { name: "VS", status: "SDV", tooltip: "Vital Signs: SDV Complete" },
          { name: "AE", status: "SDR", tooltip: "Adverse Events: SDR" },
          { name: "CM", status: "Empty", tooltip: "Concomitant Meds: No Data" },
        ]
      },
      {
        name: "Week 12",
        status: "not-done",
        datasets: [
          { name: "VS", status: "Empty", tooltip: "Vital Signs: No Data" },
          { name: "LB", status: "Empty", tooltip: "Laboratory: No Data" },
        ]
      },
    ]
  },
  {
    id: "PAT-003",
    site: "Site 003 - Asia Pacific",
    status: "Completed",
    dblReady: true,
    completion: 100,
    totalDatasets: 30,
    completedDatasets: 30,
    sdv: 100,
    dmRev: 100,
    queries: 0,
    visits: [
      {
        name: "Screening",
        status: "done",
        datasets: [
          { name: "DM", status: "SDV", tooltip: "Demographics: SDV Complete" },
          { name: "IE", status: "SDV", tooltip: "Inclusion/Exclusion: SDV Complete" },
          { name: "VS", status: "SDV", tooltip: "Vital Signs: SDV Complete" },
          { name: "LB", status: "SDV", tooltip: "Laboratory: SDV Complete" },
        ]
      },
      {
        name: "Baseline",
        status: "done",
        datasets: [
          { name: "VS", status: "SDV", tooltip: "Vital Signs: SDV Complete" },
          { name: "EG", status: "SDV", tooltip: "ECG: SDV Complete" },
          { name: "LB", status: "SDV", tooltip: "Laboratory: SDV Complete" },
          { name: "EX", status: "SDV", tooltip: "Exposure: SDV Complete" },
        ]
      },
      {
        name: "Week 4",
        status: "done",
        datasets: [
          { name: "VS", status: "SDV", tooltip: "Vital Signs: SDV Complete" },
          { name: "AE", status: "SDV", tooltip: "Adverse Events: SDV Complete" },
          { name: "CM", status: "SDV", tooltip: "Concomitant Meds: SDV Complete" },
        ]
      },
      {
        name: "Week 12",
        status: "done",
        datasets: [
          { name: "VS", status: "SDV", tooltip: "Vital Signs: SDV Complete" },
          { name: "LB", status: "SDV", tooltip: "Laboratory: SDV Complete" },
          { name: "QS", status: "SDV", tooltip: "Questionnaire: SDV Complete" },
        ]
      },
      {
        name: "End of Study",
        status: "done",
        datasets: [
          { name: "DS", status: "SDV", tooltip: "Disposition: SDV Complete" },
          { name: "AE", status: "SDV", tooltip: "Adverse Events: SDV Complete" },
        ]
      },
    ]
  },
  {
    id: "PAT-004",
    site: "Site 001 - North America",
    status: "Active",
    dblReady: false,
    completion: 65.8,
    totalDatasets: 25,
    completedDatasets: 16,
    sdv: 70.4,
    dmRev: 68.9,
    queries: 1,
    blocker: "1 query open (12 days old)",
    visits: [
      {
        name: "Screening",
        status: "done",
        datasets: [
          { name: "DM", status: "SDV", tooltip: "Demographics: SDV Complete" },
          { name: "IE", status: "SDV", tooltip: "Inclusion/Exclusion: SDV Complete" },
          { name: "VS", status: "SDR", tooltip: "Vital Signs: SDR" },
        ]
      },
      {
        name: "Baseline",
        status: "done",
        datasets: [
          { name: "VS", status: "SDV", tooltip: "Vital Signs: SDV Complete" },
          { name: "EG", status: "DM-REV", tooltip: "ECG: DM Review" },
          { name: "LB", status: "DM-REV", tooltip: "Laboratory: DM Review" },
        ]
      },
      {
        name: "Week 4",
        status: "done",
        datasets: [
          { name: "VS", status: "SDR", tooltip: "Vital Signs: SDR" },
          { name: "AE", status: "Empty", tooltip: "Adverse Events: No Data" },
        ]
      },
    ]
  },
  {
    id: "PAT-005",
    site: "Site 002 - Europe",
    status: "Discontinued",
    dblReady: false,
    completion: 45.2,
    totalDatasets: 20,
    completedDatasets: 9,
    sdv: 52.1,
    dmRev: 48.3,
    queries: 0,
    blocker: "Patient discontinued - partial data",
    visits: [
      {
        name: "Screening",
        status: "done",
        datasets: [
          { name: "DM", status: "SDV", tooltip: "Demographics: SDV Complete" },
          { name: "IE", status: "SDV", tooltip: "Inclusion/Exclusion: SDV Complete" },
        ]
      },
      {
        name: "Baseline",
        status: "done",
        datasets: [
          { name: "VS", status: "SDR", tooltip: "Vital Signs: SDR" },
          { name: "LB", status: "DM-REV", tooltip: "Laboratory: DM Review" },
        ]
      },
      {
        name: "Week 4",
        status: "not-done",
        datasets: [
          { name: "VS", status: "Empty", tooltip: "Vital Signs: No Data" },
        ]
      },
    ]
  },
];

// --- Helper Functions ---

const getStatusColor = (status: DatasetStatus["status"]) => {
  switch (status) {
    case "SDV": return "bg-emerald-500 text-white shadow-sm";
    case "DM-REV": return "bg-amber-500 text-white shadow-sm";
    case "SDR": return "bg-blue-500 text-white shadow-sm";
    case "Empty": return "bg-slate-400 text-white shadow-sm";
    default: return "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
  }
};

const getPatientStatusColor = (status: Patient["status"]) => {
  switch (status) {
    case "Completed": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "Active": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "Discontinued": return "bg-red-500/10 text-red-500 border-red-500/20";
    case "Screen Failure": return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    default: return "bg-slate-500/10 text-slate-500";
  }
};

// --- Components ---

export default function DBLTrackerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dblFilter, setDblFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");

  const filteredPatients = DEMO_PATIENTS.filter(p => {
    const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesDbl = dblFilter === "all" || (dblFilter === "yes" ? p.dblReady : !p.dblReady);
    const matchesSite = siteFilter === "all" || p.site === siteFilter;
    return matchesSearch && matchesStatus && matchesDbl && matchesSite;
  });

  const stats = {
    total: DEMO_PATIENTS.length,
    completed: DEMO_PATIENTS.filter(p => p.status === "Completed").length,
    active: DEMO_PATIENTS.filter(p => p.status === "Active").length,
    discontinued: DEMO_PATIENTS.filter(p => p.status === "Discontinued").length,
    dblReady: DEMO_PATIENTS.filter(p => p.dblReady).length,
    queries: DEMO_PATIENTS.reduce((acc, p) => acc + p.queries, 0),
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header with DEMO badge */}
      <div className="relative overflow-hidden rounded-xl border bg-card shadow-lg group">
        {/* Background grid pattern */}
        <div className="absolute inset-0 bg-grid opacity-[0.02]" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-coral-500/10 opacity-50 group-hover:opacity-70 transition-opacity duration-500" />

        <div className="relative z-10 p-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
                <Database className="w-6 h-6 text-teal-500" />
              </div>
              <div>
                <h1 className="text-3xl font-light tracking-tight text-foreground">
                  Database Lock Tracker
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time patient data completion monitoring
                </p>
              </div>
            </div>

            {/* DEMO Badge */}
            <div className="flex flex-col items-end gap-2">
              <Badge
                variant="outline"
                className="bg-coral-500/10 text-coral-500 border-coral-500/30 px-4 py-1.5 text-xs font-mono font-bold animate-pulse"
              >
                DEMO MODE
              </Badge>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-mono">
                <Clock className="w-3 h-3" />
                <span>Sample Data • Last Updated: Jan 2026</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Sample Dataset:</span> Displaying {DEMO_PATIENTS.length} patients with synthetic clinical trial data for demonstration purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Patients", value: stats.total, color: "from-blue-400 to-indigo-400", icon: "👥" },
          { label: "Completed", value: stats.completed, color: "from-emerald-400 to-teal-400", icon: "✓" },
          { label: "Active", value: stats.active, color: "from-blue-400 to-cyan-400", icon: "→" },
          { label: "Discontinued", value: stats.discontinued, color: "from-red-400 to-rose-400", icon: "✕" },
          { label: "DBL Ready", value: stats.dblReady, color: "from-violet-400 to-purple-400", icon: "🔒" },
          { label: "Open Queries", value: stats.queries, color: "from-amber-400 to-orange-400", icon: "?" },
        ].map((stat, i) => (
          <Card key={i} className="p-4 text-center border-white/5 bg-white/5 backdrop-blur-sm shadow-sm hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className={cn("text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r", stat.color)}>
              {stat.value}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-medium">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-card/50 p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patient ID..."
            className="pl-9 bg-background/50 border-white/10 font-mono"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-background/50 border-white/10">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Discontinued">Discontinued</SelectItem>
          </SelectContent>
        </Select>
        <Select value={siteFilter} onValueChange={setSiteFilter}>
          <SelectTrigger className="w-[220px] bg-background/50 border-white/10">
            <SelectValue placeholder="All Sites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            <SelectItem value="Site 001 - North America">Site 001 - North America</SelectItem>
            <SelectItem value="Site 002 - Europe">Site 002 - Europe</SelectItem>
            <SelectItem value="Site 003 - Asia Pacific">Site 003 - Asia Pacific</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dblFilter} onValueChange={setDblFilter}>
          <SelectTrigger className="w-[160px] bg-background/50 border-white/10">
            <SelectValue placeholder="All DBL Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All DBL Status</SelectItem>
            <SelectItem value="yes">DBL Ready</SelectItem>
            <SelectItem value="no">Not Ready</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-[10px] uppercase tracking-wide text-muted-foreground p-5 rounded-lg bg-card/30 border border-dashed">
        <div className="font-semibold text-foreground mr-2">Dataset Status:</div>
        {[
          { color: "bg-emerald-500", label: "SDV (Source Data Verification Complete)" },
          { color: "bg-amber-500", label: "DM-REV (Data Management Review)" },
          { color: "bg-blue-500", label: "SDR (Source Data Review)" },
          { color: "bg-slate-400", label: "Empty (No Data)" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${item.color} shadow-sm`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Patient Grid */}
      <div className="space-y-6">
        <TooltipProvider>
        {filteredPatients.map((patient) => (
          <Card key={patient.id} className="overflow-hidden hover:border-teal-500/50 transition-all duration-300 group shadow-md hover:shadow-xl">
            {/* Patient Header */}
            <div className="flex items-center justify-between p-6 bg-muted/30 border-b">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-mono font-light tracking-tight text-foreground">{patient.id}</h3>
                  <Badge variant="outline" className={cn("uppercase text-[10px] tracking-wider font-semibold", getPatientStatusColor(patient.status))}>
                    {patient.status}
                  </Badge>
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-2 uppercase tracking-wide">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    {patient.site}
                </div>
              </div>

              <div className="flex items-center gap-4">
                 <Badge variant="outline" className={cn("uppercase py-1.5 px-3 font-semibold", patient.dblReady ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>
                    {patient.dblReady ? "🔒 DBL Ready" : "⏳ In Progress"}
                 </Badge>
              </div>
            </div>

            {/* Patient Body */}
            <div className="p-6 space-y-6">

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs uppercase tracking-wider font-medium text-muted-foreground">
                    <span>Data Completion</span>
                    <span className="font-mono">{patient.completion}% ({patient.completedDatasets}/{patient.totalDatasets} datasets)</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-1000 shadow-glow"
                      style={{ width: `${patient.completion}%` }}
                    />
                </div>
              </div>

              {/* Metrics */}
              <div className="flex gap-8 p-3 bg-muted/30 rounded-lg w-fit border border-white/5">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">SDV: <span className="text-foreground font-bold ml-1 font-mono">{patient.sdv}%</span></div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">DM-REV: <span className="text-foreground font-bold ml-1 font-mono">{patient.dmRev}%</span></div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Queries: <span className={patient.queries > 0 ? "text-coral-500 font-bold ml-1 font-mono" : "text-foreground font-bold ml-1 font-mono"}>{patient.queries}</span></div>
              </div>

              {/* Visits & Datasets */}
              {patient.visits.length > 0 ? (
                 <div className="space-y-6">
                    {patient.visits.map((visit, vIndex) => (
                        <div key={vIndex}>
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 border-b border-border/50 pb-1 w-fit font-semibold">
                                {visit.name}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {visit.datasets.map((ds, dIndex) => (
                                    <Tooltip key={dIndex}>
                                        <TooltipTrigger>
                                            <div className={cn(
                                                "w-12 h-8 rounded text-[9px] font-bold flex items-center justify-center transition-transform hover:scale-110 cursor-default font-mono",
                                                getStatusColor(ds.status)
                                            )}>
                                                {ds.name}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p className="font-semibold">{ds.tooltip}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        </div>
                    ))}
                 </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">No visit data available.</div>
              )}

              {/* Blocker */}
              {patient.blocker && (
                <div className="flex items-center gap-3 p-3 bg-coral-500/5 border-l-2 border-coral-500 rounded-r text-sm">
                    <AlertCircle className="h-4 w-4 text-coral-500" />
                    <div>
                        <span className="font-bold text-coral-500 uppercase text-xs mr-2 tracking-wide">Blocker:</span>
                        <span className="text-coral-400 font-medium">{patient.blocker}</span>
                    </div>
                </div>
              )}

            </div>
          </Card>
        ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
