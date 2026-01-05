'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  MessageSquare,
  Upload,
  Layers,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  RotateCcw,
  FileSpreadsheet,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type {
  QueryRecord,
  QueryStats,
  SiteMetrics,
  AgeBin,
  StatusDistribution,
  FormMetrics,
  AppMode,
} from './types';

import {
  DEMO_QUERIES,
  DEMO_STATS,
  DEMO_SITE_METRICS,
  DEMO_STATUS_DISTRIBUTION,
  DEMO_AGE_BINS,
  DEMO_TOP_FORMS,
} from './lib/demo-data';

import { parseQueryFile } from './lib/parser';
import {
  calculateStats,
  generateSiteMetrics,
  generateAgeBins,
  generateStatusDistribution,
  generateTopForms,
} from './lib/analytics';

// Dynamic import for ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function QueryStatusPage() {
  // ===== STATE =====
  const [appMode, setAppMode] = useState<AppMode>('initial');
  const [demoStep, setDemoStep] = useState(0);

  // Data state
  const [rawQueries, setRawQueries] = useState<QueryRecord[]>([]);
  const [filteredQueries, setFilteredQueries] = useState<QueryRecord[]>([]);

  // Calculated metrics
  const [stats, setStats] = useState<QueryStats>(DEMO_STATS);
  const [siteMetrics, setSiteMetrics] = useState<SiteMetrics[]>(DEMO_SITE_METRICS);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>(DEMO_STATUS_DISTRIBUTION);
  const [ageBins, setAgeBins] = useState<AgeBin[]>(DEMO_AGE_BINS);
  const [topForms, setTopForms] = useState<FormMetrics[]>(DEMO_TOP_FORMS);

  // UI state
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string>('');

  // ===== EFFECTS =====

  // Site filter effect
  useEffect(() => {
    if (selectedSite === 'all') {
      setFilteredQueries(rawQueries);
    } else {
      setFilteredQueries(rawQueries.filter(q => q.Site === selectedSite));
    }
  }, [selectedSite, rawQueries]);

  // Recalculate metrics when filtered queries change
  useEffect(() => {
    if (filteredQueries.length > 0) {
      setStats(calculateStats(filteredQueries));
      setSiteMetrics(generateSiteMetrics(filteredQueries, 10));
      setStatusDistribution(generateStatusDistribution(filteredQueries));
      setAgeBins(generateAgeBins(filteredQueries));
      setTopForms(generateTopForms(filteredQueries, 8));
    }
  }, [filteredQueries]);

  // ===== HANDLERS =====

  const loadDemoData = async () => {
    setAppMode('demo-loading');
    setDemoStep(0);

    const steps = [
      { delay: 300, step: 1 },
      { delay: 500, step: 2 },
      { delay: 800, step: 3 },
      { delay: 600, step: 4 },
      { delay: 300, step: 5 },
    ];

    for (const { delay, step } of steps) {
      await new Promise(resolve => setTimeout(resolve, delay));
      setDemoStep(step);
    }

    // Load demo data
    setRawQueries(DEMO_QUERIES);
    setFilteredQueries(DEMO_QUERIES);
    setStats(DEMO_STATS);
    setSiteMetrics(DEMO_SITE_METRICS);
    setStatusDistribution(DEMO_STATUS_DISTRIBUTION);
    setAgeBins(DEMO_AGE_BINS);
    setTopForms(DEMO_TOP_FORMS);
    setSelectedSite('all');
    setSearchTerm('');

    await new Promise(resolve => setTimeout(resolve, 500));
    setAppMode('demo');
  };

  const handleFileUpload = async (file: File) => {
    setUploadStatus('uploading');
    setUploadError('');

    try {
      setUploadStatus('processing');
      const result = await parseQueryFile(file);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to parse file');
      }

      // Load parsed data
      setRawQueries(result.data);
      setFilteredQueries(result.data);
      setSelectedSite('all');
      setSearchTerm('');
      setAppMode('live');
      setUploadStatus('idle');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      setUploadStatus('error');
    }
  };

  const handleSiteFilter = (value: string) => {
    setSelectedSite(value);
  };

  const resetToInitial = () => {
    setAppMode('initial');
    setRawQueries([]);
    setFilteredQueries([]);
    setSelectedSite('all');
    setSearchTerm('');
    setUploadStatus('idle');
    setUploadError('');
  };

  // ===== CONDITIONAL RENDERING =====

  if (appMode === 'initial') {
    return <DemoHero onLoadDemo={loadDemoData} />;
  }

  if (appMode === 'demo-loading') {
    return <DemoLoadingAnimation step={demoStep} />;
  }

  // Get unique sites for filter dropdown
  const uniqueSites = Array.from(new Set(rawQueries.map(q => q.Site))).sort();

  // Filter queries for table display
  const displayQueries = filteredQueries.filter(q =>
    searchTerm === '' ||
    q.Site.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.Subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.Form.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.QueryID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.QueryText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.Status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ===== MAIN DASHBOARD RENDER =====
  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 rounded-lg">
            <MessageSquare className="h-6 w-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Query Status Dashboard</h1>
            <Badge
              className={`${
                appMode === 'demo'
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  : 'bg-teal-500/20 text-teal-400 border-teal-500/30'
              } font-mono text-xs px-2 py-0.5 ${appMode === 'demo' ? 'animate-pulse' : ''}`}
            >
              {appMode === 'demo' ? 'DEMO MODE' : 'LIVE DATA'}
            </Badge>
          </div>
        </div>
        <Button
          onClick={resetToInitial}
          variant="outline"
          className="border-slate-700 hover:bg-slate-800"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* File Upload Zone (Demo Mode Only) */}
      {appMode === 'demo' && (
        <FileUploadZone
          onFileUpload={handleFileUpload}
          uploadStatus={uploadStatus}
          uploadError={uploadError}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Queries"
          value={stats.totalQueries}
          icon={Layers}
          color="teal"
        />
        <KPICard
          label="Open Queries"
          value={`${stats.openQueries} (${stats.openRate}%)`}
          icon={AlertCircle}
          color="orange"
        />
        <KPICard
          label="Closed Queries"
          value={`${stats.closedQueries} (${stats.closedRate}%)`}
          icon={CheckCircle2}
          color="emerald"
        />
        <KPICard
          label="Avg. Query Age"
          value={`${stats.avgAge} days`}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Site Filter */}
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700 p-4">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-slate-400" />
          <div className="flex-1">
            <label className="text-sm text-slate-400 mb-2 block">Filter by Site</label>
            <Select value={selectedSite} onValueChange={handleSiteFilter}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Sites ({rawQueries.length} queries)</SelectItem>
                {uniqueSites.map(site => {
                  const count = rawQueries.filter(q => q.Site === site).length;
                  return (
                    <SelectItem key={site} value={site}>
                      {site} ({count})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Site Performance Leaderboard - 2 columns */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-teal-400" />
              <h3 className="text-lg font-semibold text-white">Site Performance</h3>
            </div>
            <SitePerformanceChart data={siteMetrics} />
          </Card>
        </div>

        {/* Status Distribution Donut - 1 column */}
        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-teal-400" />
            <h3 className="text-lg font-semibold text-white">Status Distribution</h3>
          </div>
          <StatusDonutChart data={statusDistribution} total={stats.totalQueries} />
        </Card>

        {/* Query Aging Analysis - 2 columns */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Query Aging Analysis</h3>
            </div>
            <AgingAreaChart bins={ageBins} />
          </Card>
        </div>

        {/* Top Forms - 1 column */}
        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileSpreadsheet className="h-5 w-5 text-teal-400" />
            <h3 className="text-lg font-semibold text-white">Top Forms</h3>
          </div>
          <TopFormsBarChart forms={topForms} />
        </Card>
      </div>

      {/* Data Table */}
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Query Details</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          <QueryDataTable queries={displayQueries} />
        </div>
      </Card>
    </div>
  );
}

// ===== SUB-COMPONENTS =====

interface DemoHeroProps {
  onLoadDemo: () => void;
}

function DemoHero({ onLoadDemo }: DemoHeroProps) {
  const [showUpload, setShowUpload] = useState(false);

  if (showUpload) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full bg-slate-900/50 backdrop-blur-sm border-slate-700 p-12">
          <div className="text-center space-y-6">
            <div className="inline-flex p-4 bg-teal-500/10 rounded-2xl">
              <Upload className="h-12 w-12 text-teal-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Upload Query Report</h2>
              <p className="text-slate-400">
                Upload a Query Status Report Excel file to analyze your data
              </p>
            </div>
            <div className="pt-4">
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg cursor-pointer transition-colors"
              >
                <Upload className="h-5 w-5 mr-2" />
                Select File
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // This will be handled by the parent component
                    window.location.reload();
                  }
                }}
              />
            </div>
            <Button
              onClick={() => setShowUpload(false)}
              variant="outline"
              className="border-slate-700 hover:bg-slate-800"
            >
              Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <Card className="max-w-4xl w-full bg-slate-900/50 backdrop-blur-sm border-slate-700 p-12">
        <div className="text-center space-y-8">
          {/* Icon */}
          <div className="inline-flex p-6 bg-teal-500/10 rounded-3xl animate-pulse">
            <MessageSquare className="h-16 w-16 text-teal-400" />
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white">
              Clinical Trial Query Management Dashboard
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Real-time query tracking and analytics for clinical trial data managers.
              Monitor query volumes, aging trends, and site performance with intelligent
              EDC export parsing.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              onClick={onLoadDemo}
              size="lg"
              className="bg-teal-500 hover:bg-teal-600 text-white px-8"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Try Demo with Sample Data
            </Button>
            <Button
              onClick={() => setShowUpload(true)}
              size="lg"
              variant="outline"
              className="border-slate-700 hover:bg-slate-800 px-8"
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload Query Report
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-8">
            {[
              'Query Aging Analysis',
              'Site Performance Tracking',
              'Status Distribution',
              'Top Forms Identification',
            ].map((feature) => (
              <Badge
                key={feature}
                variant="outline"
                className="border-slate-700 text-slate-300 px-4 py-1.5"
              >
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

interface DemoLoadingAnimationProps {
  step: number;
}

function DemoLoadingAnimation({ step }: DemoLoadingAnimationProps) {
  const steps = [
    { label: 'Loading query metadata...', detail: 'Parsing EDC export format' },
    { label: 'Analyzing query data...', detail: '87 queries across 6 sites' },
    { label: 'Calculating site metrics...', detail: 'Aggregating by site and status' },
    { label: 'Generating analytics...', detail: 'Aging distribution, top forms' },
    { label: 'Complete!', detail: 'Ready to explore dashboard' },
  ];

  const currentStep = steps[step - 1] || steps[0];
  const progress = (step / 5) * 100;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full bg-slate-900/50 backdrop-blur-sm border-slate-700 p-12">
        <div className="space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-6 bg-teal-500/10 rounded-3xl">
              <MessageSquare className="h-16 w-16 text-teal-400 animate-pulse" />
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-orange-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-center space-y-1">
              <p className="text-lg font-medium text-white">{currentStep.label}</p>
              <p className="text-sm text-slate-400">{currentStep.detail}</p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index < step ? 'bg-teal-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: 'teal' | 'orange' | 'emerald' | 'amber';
}

function KPICard({ label, value, icon: Icon, color }: KPICardProps) {
  const colorClasses = {
    teal: 'bg-teal-500/10 text-teal-400',
    orange: 'bg-orange-500/10 text-orange-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
  };

  return (
    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700 p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

interface FileUploadZoneProps {
  onFileUpload: (file: File) => void;
  uploadStatus: 'idle' | 'uploading' | 'processing' | 'error';
  uploadError: string;
}

function FileUploadZone({ onFileUpload, uploadStatus, uploadError }: FileUploadZoneProps) {
  return (
    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700 border-2 border-dashed p-8">
      <div className="flex items-center gap-6">
        <div className="p-4 bg-orange-500/10 rounded-xl">
          <Upload className="h-8 w-8 text-orange-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            Ready to analyze your own data?
          </h3>
          <p className="text-sm text-slate-400 mb-3">
            Upload a Query Status Report Excel file (.xlsx, .xls, .csv)
          </p>
          <div className="flex items-center gap-3">
            <label
              htmlFor="file-upload-live"
              className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                uploadStatus === 'idle'
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadStatus === 'idle' && 'Select File'}
              {uploadStatus === 'uploading' && 'Uploading...'}
              {uploadStatus === 'processing' && 'Processing...'}
              {uploadStatus === 'error' && 'Upload Failed'}
            </label>
            <input
              id="file-upload-live"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              disabled={uploadStatus !== 'idle'}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileUpload(file);
              }}
            />
          </div>
          {uploadError && (
            <p className="text-sm text-red-400 mt-2">{uploadError}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

interface SitePerformanceChartProps {
  data: SiteMetrics[];
}

function SitePerformanceChart({ data }: SitePerformanceChartProps) {
  if (data.length === 0) {
    return <div className="text-center text-slate-400 py-8">No data available</div>;
  }

  // Truncate long site names
  const truncateSite = (site: string, maxLength = 30) => {
    return site.length > maxLength ? site.substring(0, maxLength) + '...' : site;
  };

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      background: 'transparent',
      toolbar: { show: false },
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      animations: { enabled: true, speed: 800 },
    },
    theme: { mode: 'dark' },
    colors: ['#f97316', '#14b8a6'], // Orange for open, Teal for closed
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 6,
        borderRadiusApplication: 'end',
      },
    },
    xaxis: {
      categories: data.map(d => truncateSite(d.site)),
      labels: {
        style: { colors: '#94a3b8' },
        rotate: -45,
        rotateAlways: true,
      },
    },
    yaxis: {
      labels: { style: { colors: '#94a3b8' } },
    },
    grid: { borderColor: '#334155', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    legend: {
      position: 'top',
      labels: { colors: '#94a3b8' },
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val) => `${val} queries`,
      },
    },
  };

  const series = [
    {
      name: 'Open/Pending',
      data: data.map(d => d.open),
    },
    {
      name: 'Closed',
      data: data.map(d => d.closed),
    },
  ];

  return (
    <div className="w-full h-80">
      <Chart options={options} series={series} type="bar" height="100%" />
    </div>
  );
}

interface StatusDonutChartProps {
  data: StatusDistribution[];
  total: number;
}

function StatusDonutChart({ data, total }: StatusDonutChartProps) {
  if (data.length === 0) {
    return <div className="text-center text-slate-400 py-8">No data available</div>;
  }

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'donut',
      background: 'transparent',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      animations: { enabled: true, speed: 800 },
    },
    theme: { mode: 'dark' },
    colors: ['#10b981', '#14b8a6', '#f59e0b', '#f97316', '#ef4444'],
    labels: data.map(d => d.status),
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              color: '#94a3b8',
              formatter: () => total.toString(),
            },
          },
        },
      },
    },
    legend: {
      position: 'bottom',
      labels: { colors: '#94a3b8' },
    },
    dataLabels: {
      enabled: true,
      style: { colors: ['#ffffff'] },
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val) => `${val} queries`,
      },
    },
  };

  const series = data.map(d => d.count);

  return (
    <div className="w-full h-80">
      <Chart options={options} series={series} type="donut" height="100%" />
    </div>
  );
}

interface AgingAreaChartProps {
  bins: AgeBin[];
}

function AgingAreaChart({ bins }: AgingAreaChartProps) {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      background: 'transparent',
      toolbar: { show: false },
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      animations: { enabled: true, speed: 800 },
    },
    theme: { mode: 'dark' },
    colors: ['#f97316'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
      },
    },
    xaxis: {
      categories: bins.map(b => b.range),
      labels: {
        style: { colors: '#94a3b8' },
        rotate: -45,
      },
    },
    yaxis: {
      labels: { style: { colors: '#94a3b8' } },
    },
    grid: { borderColor: '#334155', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val) => `${val} queries`,
      },
    },
  };

  const series = [
    {
      name: 'Open Queries',
      data: bins.map(b => b.count),
    },
  ];

  return (
    <div className="w-full h-80">
      <Chart options={options} series={series} type="area" height="100%" />
    </div>
  );
}

interface TopFormsBarChartProps {
  forms: FormMetrics[];
}

function TopFormsBarChart({ forms }: TopFormsBarChartProps) {
  if (forms.length === 0) {
    return <div className="text-center text-slate-400 py-8">No data available</div>;
  }

  const truncateForm = (form: string, maxLength = 20) => {
    return form.length > maxLength ? form.substring(0, maxLength) + '...' : form;
  };

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      background: 'transparent',
      toolbar: { show: false },
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      animations: { enabled: true, speed: 800 },
    },
    theme: { mode: 'dark' },
    colors: ['#14b8a6'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        borderRadiusApplication: 'end',
      },
    },
    xaxis: {
      labels: { style: { colors: '#94a3b8' } },
    },
    yaxis: {
      labels: {
        style: { colors: '#94a3b8' },
        maxWidth: 150,
      },
    },
    grid: { borderColor: '#334155', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val) => `${val} queries`,
      },
    },
  };

  const series = [
    {
      name: 'Queries',
      data: forms.map(f => ({ x: truncateForm(f.form), y: f.count })),
    },
  ];

  return (
    <div className="w-full h-80">
      <Chart options={options} series={series} type="bar" height="100%" />
    </div>
  );
}

interface QueryDataTableProps {
  queries: QueryRecord[];
}

function QueryDataTable({ queries }: QueryDataTableProps) {
  if (queries.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">No queries found</p>
      </div>
    );
  }

  const getStatusColor = (status: QueryRecord['Status']) => {
    switch (status) {
      case 'Closed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Open':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'New':
        return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
      case 'Pending':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Answered':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left p-3 text-sm font-semibold text-slate-400">Site</th>
            <th className="text-left p-3 text-sm font-semibold text-slate-400">Subject</th>
            <th className="text-left p-3 text-sm font-semibold text-slate-400">Form</th>
            <th className="text-left p-3 text-sm font-semibold text-slate-400">Query ID</th>
            <th className="text-left p-3 text-sm font-semibold text-slate-400">Query Text</th>
            <th className="text-left p-3 text-sm font-semibold text-slate-400">Age</th>
            <th className="text-left p-3 text-sm font-semibold text-slate-400">Status</th>
          </tr>
        </thead>
        <tbody>
          {queries.map((query, index) => (
            <tr
              key={`${query.QueryID}-${index}`}
              className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
            >
              <td className="p-3 text-sm text-slate-300">{query.Site}</td>
              <td className="p-3 text-sm text-slate-300 font-mono">{query.Subject}</td>
              <td className="p-3 text-sm text-slate-300">{query.Form}</td>
              <td className="p-3 text-sm text-slate-300 font-mono">{query.QueryID}</td>
              <td className="p-3 text-sm text-slate-300 max-w-md truncate">
                {query.QueryText}
              </td>
              <td className="p-3 text-sm text-slate-300">{query.Age}d</td>
              <td className="p-3">
                <Badge className={`${getStatusColor(query.Status)} text-xs`}>
                  {query.Status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
