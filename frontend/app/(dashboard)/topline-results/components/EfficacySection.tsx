'use client';

import { TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ForestPlot } from './ForestPlot';
import { formatPValue } from '../lib/analytics';
import type { EfficacyData } from '../types';

interface EfficacySectionProps {
  efficacy: EfficacyData;
}

export function EfficacySection({ efficacy }: EfficacySectionProps) {
  const allEndpoints = [efficacy.primaryEndpoint, ...efficacy.secondaryEndpoints];

  return (
    <Card className="bg-slate-900/50 border-slate-700 p-6 mb-8">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-teal-400" />
        <h2 className="text-xl font-bold text-white">Efficacy Results</h2>
      </div>

      {/* Forest Plot - Hero Visualization */}
      <div className="mb-8 p-6 bg-slate-800/50 rounded-lg border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Forest Plot: Treatment Effect Estimates</h3>
        <ForestPlot data={efficacy.forestPlotData} width={900} height={450} />
      </div>

      {/* Detailed Results Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700">
              <th className="text-left text-xs uppercase font-semibold text-slate-400 py-3 px-4">Endpoint</th>
              <th className="text-left text-xs uppercase font-semibold text-slate-400 py-3 px-4">Description</th>
              <th className="text-right text-xs uppercase font-semibold text-slate-400 py-3 px-4">Drug X Result</th>
              <th className="text-right text-xs uppercase font-semibold text-slate-400 py-3 px-4">Placebo Result</th>
              <th className="text-right text-xs uppercase font-semibold text-slate-400 py-3 px-4">Effect Size</th>
              <th className="text-right text-xs uppercase font-semibold text-slate-400 py-3 px-4">95% CI</th>
              <th className="text-right text-xs uppercase font-semibold text-slate-400 py-3 px-4">P-Value</th>
            </tr>
          </thead>
          <tbody>
            {allEndpoints.map((ep, index) => (
              <tr
                key={index}
                className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    {ep.endpointType === 'primary' && (
                      <Badge variant="outline" className="border-teal-500/50 text-teal-400 text-xs">
                        PRIMARY
                      </Badge>
                    )}
                    <span className={`text-white ${ep.endpointType === 'primary' ? 'font-bold' : 'font-medium'}`}>
                      {ep.endpoint}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-slate-400 text-sm max-w-xs">
                  {ep.description}
                </td>
                <td className="py-4 px-4 text-right font-mono text-teal-400 text-sm">
                  {ep.drugXResult}
                </td>
                <td className="py-4 px-4 text-right font-mono text-orange-400 text-sm">
                  {ep.placeboResult}
                </td>
                <td className="py-4 px-4 text-right font-mono text-white font-semibold text-sm">
                  {ep.effectSize}
                </td>
                <td className="py-4 px-4 text-right font-mono text-slate-300 text-sm">
                  {ep.ci95}
                </td>
                <td className="py-4 px-4 text-right font-mono text-sm">
                  <span className={ep.significant ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {formatPValue(ep.pValue)}
                    {ep.significant && ' *'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footnote */}
      <div className="mt-4 space-y-1">
        <p className="text-xs text-slate-500">
          * Statistically significant at α = 0.05 (two-sided test)
        </p>
        <p className="text-xs text-slate-500">
          HR = Hazard Ratio, OR = Odds Ratio, MD = Mean Difference, CI = Confidence Interval
        </p>
        <p className="text-xs text-slate-500">
          6MWT = 6-Minute Walk Test, NYHA = New York Heart Association functional class, CV = Cardiovascular,
          HF = Heart Failure, KCCQ = Kansas City Cardiomyopathy Questionnaire, NT-proBNP = N-Terminal Pro-B-Type Natriuretic Peptide
        </p>
      </div>
    </Card>
  );
}
