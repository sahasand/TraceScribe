'use client';

import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SafetyTable, formatSafetyCount } from './SafetyTable';
import type { SafetyData, SafetyTab } from '../types';

interface SafetySectionProps {
  safety: SafetyData;
  activeTab: SafetyTab;
  onTabChange: (tab: SafetyTab) => void;
}

export function SafetySection({ safety, activeTab, onTabChange }: SafetySectionProps) {
  return (
    <Card className="bg-slate-900/50 border-slate-700 p-6 mb-8">
      <div className="flex items-center gap-2 mb-6">
        <AlertCircle className="w-5 h-5 text-teal-400" />
        <h2 className="text-xl font-bold text-white">Safety Profile</h2>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as SafetyTab)}>
        <TabsList className="bg-slate-800 border-slate-700 flex-wrap h-auto gap-1 mb-6">
          <TabsTrigger value="overall" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            Overall
            <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-300">
              {safety.overallSummary.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="common" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            Common AEs
            <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-300">
              {safety.commonAEs.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="saes" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            SAEs
            <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-300">
              {safety.saesBySOC.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="discontinuation" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            Discontinuation
            <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-300">
              {safety.aeDiscontinuation.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="deaths" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            Deaths
            <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-300">
              {safety.deaths.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="grade34" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            Grade 3-4
            <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-300">
              {safety.grade34AEs.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="aesi" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            AESI
            <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-300">
              {safety.aesi.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="labs" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            Labs
            <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-300">
              {safety.labAbnormalities.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="vitals" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            Vitals
            <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-300">
              {safety.vitalSignChanges.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="ecg" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            ECG
            <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-300">
              {safety.ecgFindings.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overall AE Summary */}
        <TabsContent value="overall">
          <SafetyTable
            title="Overall Adverse Event Summary"
            columns={[
              { header: 'Category', accessor: 'category', align: 'left' },
              {
                header: 'Drug X (n=150)',
                accessor: 'drugX',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-teal-400'),
              },
              {
                header: 'Placebo (n=150)',
                accessor: 'placebo',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-orange-400'),
              },
            ]}
            data={safety.overallSummary}
            footnotes={[
              'TEAE = Treatment-Emergent Adverse Event',
              'AE = Adverse Event',
              'D/C = Discontinuation',
            ]}
          />
        </TabsContent>

        {/* Tab 2: Most Common AEs */}
        <TabsContent value="common">
          <SafetyTable
            title="Most Common Adverse Events (≥5% in any arm)"
            columns={[
              { header: 'Rank', accessor: 'rank', align: 'center' },
              { header: 'Preferred Term', accessor: 'preferredTerm', align: 'left' },
              { header: 'SOC', accessor: 'soc', align: 'left' },
              {
                header: 'Drug X (n=150)',
                accessor: 'drugX',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-teal-400'),
              },
              {
                header: 'Placebo (n=150)',
                accessor: 'placebo',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-orange-400'),
              },
            ]}
            data={safety.commonAEs}
            searchable
            searchPlaceholder="Search adverse events..."
            footnotes={['SOC = System Organ Class (MedDRA coding)']}
          />
        </TabsContent>

        {/* Tab 3: SAEs by SOC */}
        <TabsContent value="saes">
          <SafetyTable
            title="Serious Adverse Events by System Organ Class"
            columns={[
              { header: 'System Organ Class', accessor: 'soc', align: 'left' },
              {
                header: 'Drug X (n=150)',
                accessor: 'drugX',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-teal-400'),
              },
              {
                header: 'Placebo (n=150)',
                accessor: 'placebo',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-orange-400'),
              },
            ]}
            data={safety.saesBySOC}
            footnotes={['SAE = Serious Adverse Event (ICH E2A criteria)']}
          />
        </TabsContent>

        {/* Tab 4: AEs Leading to Discontinuation */}
        <TabsContent value="discontinuation">
          <SafetyTable
            title="Adverse Events Leading to Treatment Discontinuation"
            columns={[
              { header: 'Preferred Term', accessor: 'preferredTerm', align: 'left' },
              { header: 'SOC', accessor: 'soc', align: 'left' },
              {
                header: 'Drug X (n=150)',
                accessor: 'drugX',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-teal-400'),
              },
              {
                header: 'Placebo (n=150)',
                accessor: 'placebo',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-orange-400'),
              },
            ]}
            data={safety.aeDiscontinuation}
          />
        </TabsContent>

        {/* Tab 5: Deaths */}
        <TabsContent value="deaths">
          <SafetyTable
            title="Deaths (On-treatment + 30-day Follow-up)"
            columns={[
              { header: 'Category', accessor: 'category', align: 'left' },
              {
                header: 'Drug X (n=150)',
                accessor: 'drugX',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-teal-400'),
              },
              {
                header: 'Placebo (n=150)',
                accessor: 'placebo',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-orange-400'),
              },
            ]}
            data={safety.deaths}
            footnotes={['On-treatment = Death occurred while on study medication or within 30 days of last dose']}
          />
        </TabsContent>

        {/* Tab 6: Grade 3-4 AEs */}
        <TabsContent value="grade34">
          <SafetyTable
            title="Grade 3-4 Adverse Events"
            columns={[
              { header: 'Preferred Term', accessor: 'preferredTerm', align: 'left' },
              { header: 'SOC', accessor: 'soc', align: 'left' },
              { header: 'Grade', accessor: 'grade', align: 'center' },
              {
                header: 'Drug X (n=150)',
                accessor: 'drugX',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-teal-400'),
              },
              {
                header: 'Placebo (n=150)',
                accessor: 'placebo',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-orange-400'),
              },
            ]}
            data={safety.grade34AEs}
            footnotes={['Grading per CTCAE v5.0']}
          />
        </TabsContent>

        {/* Tab 7: AESI */}
        <TabsContent value="aesi">
          <SafetyTable
            title="Adverse Events of Special Interest (AESI)"
            columns={[
              { header: 'Category', accessor: 'category', align: 'left' },
              {
                header: 'Drug X (n=150)',
                accessor: 'drugX',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-teal-400'),
              },
              {
                header: 'Placebo (n=150)',
                accessor: 'placebo',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-orange-400'),
              },
            ]}
            data={safety.aesi}
            footnotes={[
              'AESI = Pre-specified events of clinical interest based on mechanism of action',
              'SBP = Systolic Blood Pressure',
              'Cr = Serum Creatinine',
              'K+ = Serum Potassium',
            ]}
          />
        </TabsContent>

        {/* Tab 8: Laboratory Abnormalities */}
        <TabsContent value="labs">
          <SafetyTable
            title="Laboratory Abnormalities"
            columns={[
              { header: 'Parameter', accessor: 'parameter', align: 'left' },
              {
                header: 'Drug X (n=150)',
                accessor: 'drugX',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-teal-400'),
              },
              {
                header: 'Placebo (n=150)',
                accessor: 'placebo',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-orange-400'),
              },
            ]}
            data={safety.labAbnormalities}
            footnotes={[
              'ULN = Upper Limit of Normal',
              'ALT = Alanine Aminotransferase',
            ]}
          />
        </TabsContent>

        {/* Tab 9: Vital Sign Changes */}
        <TabsContent value="vitals">
          <SafetyTable
            title="Vital Sign Changes from Baseline"
            columns={[
              { header: 'Parameter', accessor: 'parameter', align: 'left' },
              {
                header: 'Drug X (n=150)',
                accessor: 'drugX',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-teal-400'),
              },
              {
                header: 'Placebo (n=150)',
                accessor: 'placebo',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-orange-400'),
              },
            ]}
            data={safety.vitalSignChanges}
            footnotes={[
              'SBP = Systolic Blood Pressure',
              'DBP = Diastolic Blood Pressure',
              'HR = Heart Rate',
              'bpm = beats per minute',
            ]}
          />
        </TabsContent>

        {/* Tab 10: ECG Findings */}
        <TabsContent value="ecg">
          <SafetyTable
            title="Cardiac Safety / ECG Findings"
            columns={[
              { header: 'Finding', accessor: 'finding', align: 'left' },
              {
                header: 'Drug X (n=150)',
                accessor: 'drugX',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-teal-400'),
              },
              {
                header: 'Placebo (n=150)',
                accessor: 'placebo',
                align: 'right',
                render: (value) => formatSafetyCount(value, 'text-orange-400'),
              },
            ]}
            data={safety.ecgFindings}
            footnotes={[
              'QTcF = QT interval corrected by Fridericia formula',
              'LBBB = Left Bundle Branch Block',
              'AF = Atrial Fibrillation',
            ]}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
