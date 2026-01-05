'use client';

import { useState } from 'react';
import { TrendingUp, Users, CheckCircle2, Calendar, Activity, AlertCircle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DEMO_STUDY_INFO,
  DEMO_DEMOGRAPHICS,
  DEMO_EFFICACY,
  DEMO_SAFETY,
  LOADING_STEPS,
  KPI_DATA,
} from './lib/demo-data';
import type { AppMode, SafetyTab } from './types';
import { EfficacySection } from './components/EfficacySection';
import { SafetySection } from './components/SafetySection';

// ============================================================================
// Demo Hero Component (Phase 1: Initial Landing)
// ============================================================================

function DemoHero({ onLoadDemo }: { onLoadDemo: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <Card className="max-w-3xl w-full bg-slate-900/50 border-slate-700 backdrop-blur">
        <div className="p-12 space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-teal-400 animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold text-white">
              Clinical Trial Top-line Results Dashboard
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Comprehensive phase 3 trial results spanning demographics, efficacy endpoints, and safety profiles.
              Visualize study outcomes with forest plots, KPIs, and detailed safety tables.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['Forest Plot Visualization', '10 Safety Tables', 'Efficacy Endpoints', 'Demographics Summary'].map((feature) => (
              <Badge
                key={feature}
                variant="outline"
                className="border-slate-600 text-slate-300 px-3 py-1"
              >
                {feature}
              </Badge>
            ))}
          </div>

          {/* CTA */}
          <div className="flex justify-center">
            <Button
              onClick={onLoadDemo}
              size="lg"
              className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-8 py-6 text-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              View Demo Results
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// Demo Loading Animation (Phase 2: Demo Loading)
// ============================================================================

function DemoLoadingAnimation({ step }: { step: number }) {
  const currentStep = LOADING_STEPS[step - 1] || LOADING_STEPS[0];
  const progress = (step / LOADING_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full bg-slate-900/50 border-slate-700 backdrop-blur">
        <div className="p-12 space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-teal-400 animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Loading Top-line Results</h2>
            <p className="text-slate-400">Preparing your dashboard...</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-orange-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Step {step} of {LOADING_STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2">
            {LOADING_STEPS.map((s) => (
              <div
                key={s.step}
                className={`w-2 h-2 rounded-full transition-colors ${
                  s.step <= step ? 'bg-teal-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Current Step Details */}
          <div className="text-center space-y-1">
            <p className="text-white font-medium">{currentStep.label}</p>
            <p className="text-sm text-slate-400">{currentStep.detail}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// Header Component
// ============================================================================

function Header({ appMode, onReset }: { appMode: AppMode; onReset: () => void }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-teal-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Top-line Results</h1>
          <p className="text-sm text-slate-400">Phase 3 Clinical Trial Outcomes</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {appMode === 'demo' && (
          <>
            <Badge variant="outline" className="border-amber-500/50 text-amber-400 px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              DEMO MODE
            </Badge>
            <Button
              onClick={onReset}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Reset
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// KPI Cards Component
// ============================================================================

const ICON_MAP: Record<string, any> = {
  Users,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Activity,
  AlertCircle,
};

function KPICardsGrid() {
  const kpis = [
    { ...KPI_DATA.totalEnrolled, label: 'Total Enrolled' },
    { ...KPI_DATA.completionRate, label: 'Completion Rate' },
    { ...KPI_DATA.studyDuration, label: 'Study Duration' },
    { ...KPI_DATA.primaryEndpoint, label: 'Primary Endpoint Met' },
    { ...KPI_DATA.anyTEAE, label: 'Any TEAE' },
    { ...KPI_DATA.seriousAEs, label: 'Serious AEs' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {kpis.map((kpi) => {
        const Icon = ICON_MAP[kpi.icon];
        const colorClass =
          kpi.color === 'teal'
            ? 'text-teal-400 bg-teal-500/10 border-teal-500/20'
            : kpi.color === 'emerald'
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            : kpi.color === 'amber'
            ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            : 'text-orange-400 bg-orange-500/10 border-orange-500/20';

        return (
          <Card key={kpi.label} className="bg-slate-900/50 border-slate-700 p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <p className="text-sm text-slate-400">{kpi.label}</p>
                <p className="text-3xl font-bold text-white">{kpi.value}</p>
                <p className="text-xs text-slate-500">{kpi.subtext}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center border`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================================================
// Placeholder Section Components (to be enhanced with proper components)
// ============================================================================

function StudyOverviewSection() {
  return (
    <Card className="bg-slate-900/50 border-slate-700 p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-teal-400" />
        <h2 className="text-xl font-bold text-white">Study Overview</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-slate-400 mb-1">Indication</p>
          <p className="text-white font-medium">{DEMO_STUDY_INFO.indication}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400 mb-1">Phase</p>
          <p className="text-white font-medium">{DEMO_STUDY_INFO.phase}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400 mb-1">Treatment Arms</p>
          <p className="text-white font-medium">
            {DEMO_STUDY_INFO.treatmentArms.map(arm => arm.name).join(' vs ')}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-400 mb-1">Duration</p>
          <p className="text-white font-medium">{DEMO_STUDY_INFO.studyDuration}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400 mb-1">Primary Endpoint</p>
          <p className="text-white font-medium">{DEMO_STUDY_INFO.primaryEndpoint}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400 mb-1">Enrollment</p>
          <p className="text-white font-medium">
            {DEMO_STUDY_INFO.treatmentArms.reduce((sum, arm) => sum + arm.n, 0)} patients
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-400 mb-1">DB Lock Date</p>
          <p className="text-white font-medium">{DEMO_STUDY_INFO.databaseLockDate}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400 mb-1">Sponsor</p>
          <p className="text-white font-medium">{DEMO_STUDY_INFO.sponsor}</p>
        </div>
      </div>
    </Card>
  );
}

function DemographicsSection() {
  const { baseline } = DEMO_DEMOGRAPHICS;

  return (
    <Card className="bg-slate-900/50 border-slate-700 p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-teal-400" />
        <h2 className="text-xl font-bold text-white">Baseline Demographics</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left text-sm text-slate-400 font-semibold py-3 px-4">Characteristic</th>
              <th className="text-right text-sm text-slate-400 font-semibold py-3 px-4">
                Drug X (n={DEMO_STUDY_INFO.treatmentArms[0].n})
              </th>
              <th className="text-right text-sm text-slate-400 font-semibold py-3 px-4">
                Placebo (n={DEMO_STUDY_INFO.treatmentArms[1].n})
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-800">
              <td className="py-3 px-4 text-white">Age (years), mean ± SD</td>
              <td className="py-3 px-4 text-right font-mono text-teal-400">
                {baseline.age.mean.drugX.toFixed(1)} ± {baseline.age.sd.drugX.toFixed(1)}
              </td>
              <td className="py-3 px-4 text-right font-mono text-orange-400">
                {baseline.age.mean.placebo.toFixed(1)} ± {baseline.age.sd.placebo.toFixed(1)}
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-3 px-4 text-white">Male, n (%)</td>
              <td className="py-3 px-4 text-right font-mono text-teal-400">
                {baseline.sex.male.drugX} ({baseline.sex.male.drugXPct.toFixed(1)}%)
              </td>
              <td className="py-3 px-4 text-right font-mono text-orange-400">
                {baseline.sex.male.placebo} ({baseline.sex.male.placeboPct.toFixed(1)}%)
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-3 px-4 text-white">Weight (kg), mean ± SD</td>
              <td className="py-3 px-4 text-right font-mono text-teal-400">
                {baseline.weight.mean.drugX.toFixed(1)} ± {baseline.weight.sd.drugX.toFixed(1)}
              </td>
              <td className="py-3 px-4 text-right font-mono text-orange-400">
                {baseline.weight.mean.placebo.toFixed(1)} ± {baseline.weight.sd.placebo.toFixed(1)}
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-3 px-4 text-white">BMI (kg/m²), mean ± SD</td>
              <td className="py-3 px-4 text-right font-mono text-teal-400">
                {baseline.bmi.mean.drugX.toFixed(1)} ± {baseline.bmi.sd.drugX.toFixed(1)}
              </td>
              <td className="py-3 px-4 text-right font-mono text-orange-400">
                {baseline.bmi.mean.placebo.toFixed(1)} ± {baseline.bmi.sd.placebo.toFixed(1)}
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-3 px-4 text-white">Ejection Fraction (%), mean ± SD</td>
              <td className="py-3 px-4 text-right font-mono text-teal-400">
                {baseline.baselineDisease.ejectionFraction.mean.drugX.toFixed(1)} ± {baseline.baselineDisease.ejectionFraction.sd.drugX.toFixed(1)}
              </td>
              <td className="py-3 px-4 text-right font-mono text-orange-400">
                {baseline.baselineDisease.ejectionFraction.mean.placebo.toFixed(1)} ± {baseline.baselineDisease.ejectionFraction.sd.placebo.toFixed(1)}
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-3 px-4 text-white">NT-proBNP (pg/mL), median (IQR)</td>
              <td className="py-3 px-4 text-right font-mono text-teal-400">
                {baseline.baselineDisease.ntProBNP.median.drugX} ({baseline.baselineDisease.ntProBNP.q1.drugX}-{baseline.baselineDisease.ntProBNP.q3.drugX})
              </td>
              <td className="py-3 px-4 text-right font-mono text-orange-400">
                {baseline.baselineDisease.ntProBNP.median.placebo} ({baseline.baselineDisease.ntProBNP.q1.placebo}-{baseline.baselineDisease.ntProBNP.q3.placebo})
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// EfficacySection and SafetySection are now imported from components/

// ============================================================================
// Main Page Component
// ============================================================================

export default function ToplineResultsPage() {
  const [appMode, setAppMode] = useState<AppMode>('initial');
  const [demoStep, setDemoStep] = useState(0);
  const [activeSafetyTab, setActiveSafetyTab] = useState<SafetyTab>('overall');

  const loadDemoData = async () => {
    setAppMode('demo-loading');
    setDemoStep(0);

    // Simulate loading steps
    for (const { delay, step } of LOADING_STEPS) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      setDemoStep(step);
    }

    // Final transition to demo view
    await new Promise((resolve) => setTimeout(resolve, 500));
    setAppMode('demo');
  };

  const resetToInitial = () => {
    setAppMode('initial');
    setDemoStep(0);
    setActiveSafetyTab('overall');
  };

  // Phase 1: Initial Landing
  if (appMode === 'initial') {
    return <DemoHero onLoadDemo={loadDemoData} />;
  }

  // Phase 2: Demo Loading
  if (appMode === 'demo-loading') {
    return <DemoLoadingAnimation step={demoStep} />;
  }

  // Phase 3: Dashboard View
  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-8">
      <Header appMode={appMode} onReset={resetToInitial} />
      <KPICardsGrid />
      <StudyOverviewSection />
      <DemographicsSection />
      <EfficacySection efficacy={DEMO_EFFICACY} />
      <SafetySection
        safety={DEMO_SAFETY}
        activeTab={activeSafetyTab}
        onTabChange={setActiveSafetyTab}
      />
    </div>
  );
}
