"use client";

import { useState, useRef } from "react";
import { GitCompare, Database, Activity, AlertTriangle, CheckCircle2, Calendar, ArrowRight, TrendingUp, Upload, Loader2, X, FileSpreadsheet, PlayCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEMO_RECONCILIATION_RESULTS,
  DEMO_SUBJECT_GAPS,
  DEMO_VISIT_GAPS,
  DEMO_CATEGORY_GAPS,
  DEMO_DATE_MISMATCHES,
  DEMO_STATS,
  DEMO_EDC_DATA,
  DEMO_LAB_DATA,
} from './lib/demo-data';
import { parseEDCFile, parseLabFile } from './lib/parsers';
import {
  performReconciliation,
  generateSubjectGaps,
  generateVisitGaps,
  generateCategoryGaps,
  generateDateMismatches,
  calculateStats,
} from './lib/reconciliation';
import type {
  ReconciliationResult,
  EDCRecord,
  LabRecord,
  SubjectGap,
  VisitGap,
  CategoryGap,
  DateMismatch,
  ReconciliationStats,
} from './types';

type AppMode = 'initial' | 'demo-loading' | 'demo' | 'live';
type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

// Helper function for delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function DataReconciliationPage() {
  const [appMode, setAppMode] = useState<AppMode>('initial');
  const [demoStep, setDemoStep] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("summary");

  // File upload state
  const [edcFile, setEdcFile] = useState<File | null>(null);
  const [labFile, setLabFile] = useState<File | null>(null);
  const [edcStatus, setEdcStatus] = useState<UploadStatus>('idle');
  const [labStatus, setLabStatus] = useState<UploadStatus>('idle');
  const [uploadError, setUploadError] = useState<string>('');
  const [processingStep, setProcessingStep] = useState<string>('');

  // Data state
  const [edcData, setEdcData] = useState<EDCRecord[]>([]);
  const [labData, setLabData] = useState<LabRecord[]>([]);
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const [subjectGaps, setSubjectGaps] = useState<SubjectGap[]>([]);
  const [visitGaps, setVisitGaps] = useState<VisitGap[]>([]);
  const [categoryGaps, setCategoryGaps] = useState<CategoryGap[]>([]);
  const [dateMismatches, setDateMismatches] = useState<DateMismatch[]>([]);
  const [stats, setStats] = useState<ReconciliationStats>({
    totalRecords: 0,
    matched: 0,
    edcOnly: 0,
    labOnly: 0,
    dateMismatches: 0,
    perfectMatches: 0,
    subjectGaps: { edcOnly: 0, labOnly: 0 },
  });

  const edcInputRef = useRef<HTMLInputElement>(null);
  const labInputRef = useRef<HTMLInputElement>(null);

  // Handle EDC file upload
  const handleEDCUpload = async (file: File) => {
    setEdcFile(file);
    setEdcStatus('uploading');
    setUploadError('');

    const result = await parseEDCFile(file);

    if (result.success && result.data) {
      setEdcData(result.data);
      setEdcStatus('complete');
    } else {
      setEdcStatus('error');
      setUploadError(result.error || 'Failed to parse EDC file');
    }
  };

  // Handle Lab file upload
  const handleLabUpload = async (file: File) => {
    setLabFile(file);
    setLabStatus('uploading');
    setUploadError('');

    const result = await parseLabFile(file);

    if (result.success && result.data) {
      setLabData(result.data);
      setLabStatus('complete');

      // Trigger reconciliation
      await runReconciliation(edcData, result.data);
    } else {
      setLabStatus('error');
      setUploadError(result.error || 'Failed to parse Lab file');
    }
  };

  // Run reconciliation with animated steps
  const runReconciliation = async (edc: EDCRecord[], lab: LabRecord[]) => {
    setEdcStatus('processing');
    setLabStatus('processing');

    // Step 1: Aggregating
    setProcessingStep('Aggregating lab data by patient-visit-category...');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 2: Matching
    setProcessingStep('Performing reconciliation...');
    await new Promise(resolve => setTimeout(resolve, 500));
    const reconciliationResults = performReconciliation(edc, lab);

    // Step 3: Finding gaps
    setProcessingStep('Finding subject gaps...');
    await new Promise(resolve => setTimeout(resolve, 400));
    const subjectGapsResults = generateSubjectGaps(reconciliationResults);

    setProcessingStep('Analyzing visit gaps...');
    await new Promise(resolve => setTimeout(resolve, 400));
    const visitGapsResults = generateVisitGaps(reconciliationResults);

    setProcessingStep('Checking category gaps...');
    await new Promise(resolve => setTimeout(resolve, 400));
    const categoryGapsResults = generateCategoryGaps(reconciliationResults);

    setProcessingStep('Identifying date mismatches...');
    await new Promise(resolve => setTimeout(resolve, 400));
    const dateMismatchesResults = generateDateMismatches(reconciliationResults);

    // Step 4: Calculate stats
    setProcessingStep('Calculating statistics...');
    await new Promise(resolve => setTimeout(resolve, 300));
    const statsResults = calculateStats(reconciliationResults);

    // Update state
    setResults(reconciliationResults);
    setSubjectGaps(subjectGapsResults);
    setVisitGaps(visitGapsResults);
    setCategoryGaps(categoryGapsResults);
    setDateMismatches(dateMismatchesResults);
    setStats(statsResults);

    // Complete
    setProcessingStep('Complete!');
    await new Promise(resolve => setTimeout(resolve, 500));

    setAppMode('live');
    setEdcStatus('complete');
    setLabStatus('complete');
    setProcessingStep('');
  };

  // Load demo data with animation
  const loadDemoData = async () => {
    setAppMode('demo-loading');
    setDemoStep(0);

    await sleep(300);
    setDemoStep(1); // Loading EDC metadata

    await sleep(500);
    setDemoStep(2); // Loading Lab results

    await sleep(800);
    setDemoStep(3); // Performing reconciliation

    await sleep(600);
    setDemoStep(4); // Finding gaps

    await sleep(300);
    setDemoStep(5); // Complete

    await sleep(400);

    // Load demo data
    setEdcData(DEMO_EDC_DATA);
    setLabData(DEMO_LAB_DATA);
    setResults(DEMO_RECONCILIATION_RESULTS);
    setSubjectGaps(DEMO_SUBJECT_GAPS);
    setVisitGaps(DEMO_VISIT_GAPS);
    setCategoryGaps(DEMO_CATEGORY_GAPS);
    setDateMismatches(DEMO_DATE_MISMATCHES);
    setStats(DEMO_STATS);

    setAppMode('demo');
  };

  // Show upload flow from initial state
  const showUploadFlow = () => {
    setAppMode('demo');
  };

  // Reset to initial state
  const resetToInitial = () => {
    setAppMode('initial');
    setDemoStep(0);
    setEdcFile(null);
    setLabFile(null);
    setEdcStatus('idle');
    setLabStatus('idle');
    setUploadError('');
    setProcessingStep('');
    setEdcData([]);
    setLabData([]);
    setResults([]);
    setSubjectGaps([]);
    setVisitGaps([]);
    setCategoryGaps([]);
    setDateMismatches([]);
    setStats({
      totalRecords: 0,
      matched: 0,
      edcOnly: 0,
      labOnly: 0,
      dateMismatches: 0,
      perfectMatches: 0,
      subjectGaps: { edcOnly: 0, labOnly: 0 },
    });
  };

  // Reset to demo mode
  const resetToDemo = () => {
    setAppMode('demo');
    setEdcFile(null);
    setLabFile(null);
    setEdcStatus('idle');
    setLabStatus('idle');
    setUploadError('');
    setProcessingStep('');
    setEdcData(DEMO_EDC_DATA);
    setLabData(DEMO_LAB_DATA);
    setResults(DEMO_RECONCILIATION_RESULTS);
    setSubjectGaps(DEMO_SUBJECT_GAPS);
    setVisitGaps(DEMO_VISIT_GAPS);
    setCategoryGaps(DEMO_CATEGORY_GAPS);
    setDateMismatches(DEMO_DATE_MISMATCHES);
    setStats(DEMO_STATS);
  };

  const filterResults = (items: any[]) => {
    if (!searchTerm) return items;
    return items.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const isProcessing = edcStatus === 'processing' || labStatus === 'processing';

  // Show DemoHero on initial load
  if (appMode === 'initial') {
    return <DemoHero onLoadDemo={loadDemoData} onUpload={showUploadFlow} />;
  }

  // Show loading animation
  if (appMode === 'demo-loading') {
    return <DemoLoadingAnimation step={demoStep} />;
  }

  // Show dashboard (demo or live mode)
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 border border-slate-700">
        <div className="absolute inset-0 bg-grid opacity-10" />

        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
                <GitCompare className="h-8 w-8 text-teal-400" />
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">Data Reconciliation</h1>
                  <Badge className={`${
                    appMode === 'demo'
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  } font-mono text-xs px-2 py-0.5`}>
                    {appMode === 'demo' ? 'DEMO MODE' : 'LIVE DATA'}
                  </Badge>
                </div>
                <p className="text-slate-400 text-sm max-w-2xl">
                  Compare EDC metadata with central laboratory results to identify data discrepancies.
                  Automated detection of subject gaps, visit mismatches, category conflicts, and date inconsistencies.
                </p>
              </div>
            </div>

            {appMode === 'demo' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={resetToInitial}
                className="border-slate-600 hover:bg-slate-800"
              >
                <X className="h-3 w-3 mr-2" />
                Reset Demo
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDemo}
                className="border-slate-600 hover:bg-slate-800"
              >
                <X className="h-3 w-3 mr-2" />
                Clear & Reset
              </Button>
            )}
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 border-t border-slate-700 pt-4">
            <Database className="h-3.5 w-3.5" />
            <span>
              {appMode === 'demo'
                ? 'Displaying sample reconciliation results • 10 patients • Last Updated: Jan 2026'
                : `Live reconciliation • ${stats.totalRecords} records • ${new Set(results.map(r => r.PATIENT)).size} patients`}
            </span>
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      {appMode === 'demo' && (
        <Card className="p-6 bg-slate-900/50 border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="h-5 w-5 text-teal-400" />
            <h2 className="text-lg font-semibold text-white">Upload Your Data</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* EDC Upload */}
            <div>
              <FileUploadZone
                label="EDC Metadata"
                description="Excel file (.xlsx) with PATIENT, SITE, VISIT, LBCAT, LBDAT columns"
                accept=".xlsx,.xls"
                file={edcFile}
                status={edcStatus}
                onFileSelect={(file) => handleEDCUpload(file)}
                inputRef={edcInputRef}
                disabled={isProcessing}
              />
            </div>

            {/* Lab Upload */}
            <div>
              <FileUploadZone
                label="Lab Results"
                description="CSV/Excel file with USUBJID, VISIT, LBCAT, LBDTC, LBTESTCD columns"
                accept=".csv,.xlsx,.xls"
                file={labFile}
                status={labStatus}
                onFileSelect={(file) => handleLabUpload(file)}
                inputRef={labInputRef}
                disabled={!edcFile || edcStatus !== 'complete' || isProcessing}
              />
            </div>
          </div>

          {/* Processing Status */}
          {isProcessing && processingStep && (
            <div className="mt-6 p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-teal-400 animate-spin" />
                <span className="text-sm text-teal-300 font-medium">{processingStep}</span>
              </div>
            </div>
          )}

          {/* Error */}
          {uploadError && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span className="text-sm text-red-300">{uploadError}</span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Records" value={stats.totalRecords} icon={Activity} color="slate" />
        <StatCard label="Perfect Matches" value={stats.perfectMatches} icon={CheckCircle2} color="emerald" />
        <StatCard label="Matched" value={stats.matched} icon={CheckCircle2} color="teal" />
        <StatCard label="EDC Only" value={stats.edcOnly} icon={AlertTriangle} color="blue" />
        <StatCard label="Lab Only" value={stats.labOnly} icon={AlertTriangle} color="orange" />
        <StatCard label="Date Mismatches" value={stats.dateMismatches} icon={Calendar} color="red" />
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search patients, visits, categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md bg-slate-900/50 border-slate-700 font-mono text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <Card className="bg-slate-900/50 border-slate-700">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b border-slate-700 bg-transparent rounded-none h-auto p-0">
            <TabsTrigger value="summary" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none px-6 py-3">
              Summary
            </TabsTrigger>
            <TabsTrigger value="subjects" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none px-6 py-3">
              Subject Gaps
              <Badge className="ml-2 bg-slate-800 text-slate-300 text-xs">{subjectGaps.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="visits" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none px-6 py-3">
              Visit Gaps
              <Badge className="ml-2 bg-slate-800 text-slate-300 text-xs">{visitGaps.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none px-6 py-3">
              Category Gaps
              <Badge className="ml-2 bg-slate-800 text-slate-300 text-xs">{categoryGaps.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="dates" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none px-6 py-3">
              Date Mismatches
              <Badge className="ml-2 bg-slate-800 text-slate-300 text-xs">{dateMismatches.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="p-6 space-y-6">
            <SummaryView stats={stats} />
          </TabsContent>

          <TabsContent value="subjects" className="p-6">
            <SubjectGapsTable data={filterResults(subjectGaps)} />
          </TabsContent>

          <TabsContent value="visits" className="p-6">
            <VisitGapsTable data={filterResults(visitGaps)} />
          </TabsContent>

          <TabsContent value="categories" className="p-6">
            <CategoryGapsTable data={filterResults(categoryGaps)} />
          </TabsContent>

          <TabsContent value="dates" className="p-6">
            <DateMismatchesTable data={filterResults(dateMismatches)} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

// File Upload Zone Component
function FileUploadZone({
  label,
  description,
  accept,
  file,
  status,
  onFileSelect,
  inputRef,
  disabled,
}: {
  label: string;
  description: string;
  accept: string;
  file: File | null;
  status: UploadStatus;
  onFileSelect: (file: File) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  disabled?: boolean;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && !disabled) {
      onFileSelect(droppedFile);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        disabled
          ? 'border-slate-700 bg-slate-900/30 opacity-50 cursor-not-allowed'
          : status === 'complete'
          ? 'border-emerald-500/50 bg-emerald-500/5'
          : status === 'error'
          ? 'border-red-500/50 bg-red-500/5'
          : 'border-slate-600 hover:border-teal-500/50 hover:bg-slate-800/50 cursor-pointer'
      }`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-3">
        {status === 'uploading' || status === 'processing' ? (
          <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
        ) : status === 'complete' ? (
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        ) : status === 'error' ? (
          <AlertTriangle className="h-8 w-8 text-red-400" />
        ) : (
          <FileSpreadsheet className="h-8 w-8 text-slate-500" />
        )}

        <div>
          <p className="font-semibold text-white mb-1">{label}</p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>

        {file && (
          <div className="mt-2 px-3 py-1 bg-slate-800 rounded text-xs font-mono text-slate-300">
            {file.name}
          </div>
        )}

        {status === 'idle' && !disabled && (
          <Button size="sm" variant="outline" className="mt-2 border-slate-600 hover:bg-slate-800">
            <Upload className="h-3 w-3 mr-2" />
            Choose File
          </Button>
        )}

        {status === 'complete' && (
          <p className="text-xs text-emerald-400 mt-1">✓ File uploaded successfully</p>
        )}

        {disabled && !file && (
          <p className="text-xs text-slate-500 mt-1">Upload EDC file first</p>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon: Icon,
  color
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    slate: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  };

  const colors = colorMap[color] || colorMap.slate;

  return (
    <Card className={`p-4 bg-slate-900/50 border ${colors.border} hover:bg-slate-900/80 transition-colors`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-slate-500 mb-1">{label}</p>
          <p className={`text-2xl font-bold font-mono ${colors.text}`}>{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon className={`h-4 w-4 ${colors.text}`} />
        </div>
      </div>
    </Card>
  );
}

// Summary View with Sankey-style Flow Diagram
function SummaryView({ stats }: { stats: ReconciliationStats }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-teal-400" />
          Data Flow Overview
        </h3>

        <div className="flex items-center justify-between gap-8">
          <div className="flex-1">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold font-mono text-blue-400 mb-2">
                {stats.matched + stats.edcOnly}
              </div>
              <div className="text-sm text-slate-400">EDC Metadata</div>
              <div className="text-xs text-slate-500 mt-1 font-mono">
                ({stats.edcOnly} EDC only)
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-12 bg-emerald-500/50" />
              <ArrowRight className="h-4 w-4 text-emerald-400" />
              <div className="text-xs font-mono text-emerald-400 whitespace-nowrap">
                {stats.perfectMatches} perfect
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-12 bg-amber-500/50" />
              <ArrowRight className="h-4 w-4 text-amber-400" />
              <div className="text-xs font-mono text-amber-400 whitespace-nowrap">
                {stats.dateMismatches} date diff
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold font-mono text-teal-400 mb-2">
                {stats.matched}
              </div>
              <div className="text-sm text-slate-400">Matched Records</div>
              <div className="text-xs text-slate-500 mt-1 font-mono">
                Patient + Visit + Category
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-teal-400" />
              <div className="h-0.5 w-12 bg-teal-500/50" />
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold font-mono text-orange-400 mb-2">
                {stats.matched + stats.labOnly}
              </div>
              <div className="text-sm text-slate-400">Lab Results</div>
              <div className="text-xs text-slate-500 mt-1 font-mono">
                ({stats.labOnly} Lab only)
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GapSummaryCard
          title="Subject Gaps"
          edcOnly={stats.subjectGaps.edcOnly}
          labOnly={stats.subjectGaps.labOnly}
          description="Patients missing from one system"
        />
        <GapSummaryCard
          title="Visit Gaps"
          edcOnly={1}
          labOnly={0}
          description="Visits missing for common patients"
        />
        <GapSummaryCard
          title="Category Gaps"
          edcOnly={1}
          labOnly={0}
          description="Lab categories missing"
        />
      </div>
    </div>
  );
}

function GapSummaryCard({
  title,
  edcOnly,
  labOnly,
  description
}: {
  title: string;
  edcOnly: number;
  labOnly: number;
  description: string;
}) {
  return (
    <Card className="p-5 bg-slate-800/50 border-slate-700">
      <h4 className="font-semibold text-white mb-3">{title}</h4>
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">EDC Only</span>
          <span className="font-mono font-bold text-blue-400">{edcOnly}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Lab Only</span>
          <span className="font-mono font-bold text-orange-400">{labOnly}</span>
        </div>
      </div>
      <p className="text-xs text-slate-500">{description}</p>
    </Card>
  );
}

// Subject Gaps Table
function SubjectGapsTable({ data }: { data: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Patient</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Gap Type</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Site</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Visits</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Categories</th>
          </tr>
        </thead>
        <tbody>
          {data.map((gap, idx) => (
            <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
              <td className="py-3 px-4 font-mono text-sm text-white">{gap.PATIENT}</td>
              <td className="py-3 px-4">
                <MatchStatusBadge status={gap.GAP_TYPE} />
              </td>
              <td className="py-3 px-4 text-sm text-slate-400">{gap.SITE || '—'}</td>
              <td className="py-3 px-4 font-mono text-sm text-slate-300">{gap.VISIT_COUNT}</td>
              <td className="py-3 px-4 text-sm text-slate-400">{gap.CATEGORIES.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Visit Gaps Table
function VisitGapsTable({ data }: { data: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Patient</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Visit</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Gap Type</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Site</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Categories</th>
          </tr>
        </thead>
        <tbody>
          {data.map((gap, idx) => (
            <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
              <td className="py-3 px-4 font-mono text-sm text-white">{gap.PATIENT}</td>
              <td className="py-3 px-4 font-mono text-sm text-slate-300">{gap.VISIT}</td>
              <td className="py-3 px-4">
                <MatchStatusBadge status={gap.GAP_TYPE} />
              </td>
              <td className="py-3 px-4 text-sm text-slate-400">{gap.SITE || '—'}</td>
              <td className="py-3 px-4 text-sm text-slate-400">{gap.CATEGORIES.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Category Gaps Table
function CategoryGapsTable({ data }: { data: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Patient</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Visit</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Category</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Gap Type</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Site</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((gap, idx) => (
            <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
              <td className="py-3 px-4 font-mono text-sm text-white">{gap.PATIENT}</td>
              <td className="py-3 px-4 font-mono text-sm text-slate-300">{gap.VISIT}</td>
              <td className="py-3 px-4 text-sm text-slate-300">{gap.LBCAT}</td>
              <td className="py-3 px-4">
                <MatchStatusBadge status={gap.GAP_TYPE} />
              </td>
              <td className="py-3 px-4 text-sm text-slate-400">{gap.SITE || '—'}</td>
              <td className="py-3 px-4 font-mono text-sm text-slate-400">{gap.EDC_DATE || gap.LAB_DATE || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Date Mismatches Table
function DateMismatchesTable({ data }: { data: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Patient</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Visit</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Category</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">EDC Date</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Lab Date</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Difference</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Site</th>
          </tr>
        </thead>
        <tbody>
          {data.map((mismatch, idx) => (
            <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
              <td className="py-3 px-4 font-mono text-sm text-white">{mismatch.PATIENT}</td>
              <td className="py-3 px-4 font-mono text-sm text-slate-300">{mismatch.VISIT}</td>
              <td className="py-3 px-4 text-sm text-slate-300">{mismatch.LBCAT}</td>
              <td className="py-3 px-4 font-mono text-sm text-slate-300">{mismatch.EDC_DATE}</td>
              <td className="py-3 px-4 font-mono text-sm text-slate-300">{mismatch.LAB_DATE}</td>
              <td className="py-3 px-4">
                <DateDiffBadge days={mismatch.DATE_DIFF_DAYS} />
              </td>
              <td className="py-3 px-4 text-sm text-slate-400">{mismatch.SITE || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Match Status Badge
function MatchStatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { bg: string; text: string; label: string }> = {
    'MATCHED': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Matched' },
    'EDC_ONLY': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'EDC Only' },
    'LAB_ONLY': { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Lab Only' },
  };

  const config = statusMap[status] || statusMap['MATCHED'];

  return (
    <Badge className={`${config.bg} ${config.text} border-0 font-mono text-xs`}>
      {config.label}
    </Badge>
  );
}

// Date Difference Badge
function DateDiffBadge({ days }: { days: number }) {
  const isWarning = Math.abs(days) >= 7;
  const sign = days > 0 ? '+' : '';

  return (
    <Badge
      className={`${
        isWarning
          ? 'bg-red-500/20 text-red-400'
          : 'bg-amber-500/20 text-amber-400'
      } border-0 font-mono text-xs`}
    >
      {sign}{days}d
    </Badge>
  );
}

// Demo Hero Component (Initial Landing)
function DemoHero({
  onLoadDemo,
  onUpload,
}: {
  onLoadDemo: () => void;
  onUpload: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[70vh] animate-in fade-in duration-700">
      <div className="max-w-2xl text-center space-y-8 px-4">
        {/* Animated Icon */}
        <div className="inline-block p-6 rounded-2xl bg-teal-500/10 border-2 border-teal-500/30 animate-pulse">
          <GitCompare className="h-20 w-20 text-teal-400" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-bold text-white leading-tight">
          Clinical Trial Data Reconciliation
        </h1>

        {/* Description */}
        <p className="text-lg text-slate-400 max-w-xl mx-auto">
          Automatically compare EDC metadata with lab results.
          Identify discrepancies in subjects, visits, categories, and dates.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button
            size="lg"
            onClick={onLoadDemo}
            className="bg-teal-500 hover:bg-teal-400 text-white px-8 py-6 text-lg shadow-lg hover:shadow-teal-500/50 transition-all"
          >
            <PlayCircle className="h-5 w-5 mr-2" />
            Try Demo with Sample Data
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onUpload}
            className="border-slate-600 hover:bg-slate-800 px-8 py-6 text-lg"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload Your Own Files
          </Button>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-3 justify-center pt-8">
          <Badge className="bg-slate-800 text-slate-300 border-slate-700 px-3 py-1">
            Subject Gaps
          </Badge>
          <Badge className="bg-slate-800 text-slate-300 border-slate-700 px-3 py-1">
            Visit Mismatches
          </Badge>
          <Badge className="bg-slate-800 text-slate-300 border-slate-700 px-3 py-1">
            Category Conflicts
          </Badge>
          <Badge className="bg-slate-800 text-slate-300 border-slate-700 px-3 py-1">
            Date Discrepancies
          </Badge>
        </div>
      </div>
    </div>
  );
}

// Processing Step Component
function ProcessingStep({
  label,
  status,
  detail,
}: {
  label: string;
  status: 'pending' | 'active' | 'complete';
  detail: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700">
      <div className="flex-shrink-0">
        {status === 'complete' ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        ) : status === 'active' ? (
          <Loader2 className="h-5 w-5 text-teal-400 animate-spin" />
        ) : (
          <div className="h-5 w-5 rounded-full border-2 border-slate-600" />
        )}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${
          status === 'complete' ? 'text-emerald-400' : status === 'active' ? 'text-teal-400' : 'text-slate-500'
        }`}>
          {label}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

// Demo Loading Animation Component
function DemoLoadingAnimation({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center min-h-[70vh] animate-in fade-in duration-500">
      <div className="max-w-lg w-full space-y-6 px-4">
        {/* Progress Steps */}
        <div className="space-y-4">
          <ProcessingStep
            label="Loading EDC metadata"
            status={step >= 2 ? 'complete' : step === 1 ? 'active' : 'pending'}
            detail="195 patients, 2,071 records"
          />
          <ProcessingStep
            label="Loading Lab results"
            status={step >= 3 ? 'complete' : step === 2 ? 'active' : 'pending'}
            detail="158 patients, 15,559 tests"
          />
          <ProcessingStep
            label="Performing reconciliation"
            status={step >= 4 ? 'complete' : step === 3 ? 'active' : 'pending'}
            detail="Matching patient-visit-category"
          />
          <ProcessingStep
            label="Finding gaps"
            status={step >= 5 ? 'complete' : step === 4 ? 'active' : 'pending'}
            detail="2 subject gaps, 1 visit gap"
          />
          <ProcessingStep
            label="Complete"
            status={step === 5 ? 'complete' : 'pending'}
            detail="Ready to view results"
          />
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 transition-all duration-500"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
