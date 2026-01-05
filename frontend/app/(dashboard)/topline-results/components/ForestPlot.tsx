'use client';

import { formatPValue, formatEffectSize } from '../lib/analytics';
import type { ForestPlotData } from '../types';

interface ForestPlotProps {
  data: ForestPlotData[];
  width?: number;
  height?: number;
}

export function ForestPlot({ data, width = 800, height = 400 }: ForestPlotProps) {
  // Layout dimensions
  const margin = { top: 40, right: 200, bottom: 60, left: 280 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const rowHeight = plotHeight / data.length;

  // Determine scale range based on effect types
  const allValues = data.flatMap(d => [d.ci95Lower, d.effectSize, d.ci95Upper]);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  // Determine reference line position (1.0 for ratios, 0 for differences)
  const hasRatios = data.some(d => ['HR', 'OR', 'RR'].includes(d.effectType));
  const referenceLine = hasRatios ? 1.0 : 0;

  // Add padding to scale
  const range = maxValue - minValue;
  const padding = range * 0.2;
  const scaleMin = Math.min(minValue - padding, referenceLine - padding);
  const scaleMax = Math.max(maxValue + padding, referenceLine + padding);

  // Scale function: value to pixel position
  const xScale = (value: number) => {
    return ((value - scaleMin) / (scaleMax - scaleMin)) * plotWidth;
  };

  // Reference line position
  const refLineX = xScale(referenceLine);

  // Generate tick marks for x-axis
  const generateTicks = () => {
    const tickCount = 5;
    const ticks: number[] = [];
    const step = (scaleMax - scaleMin) / (tickCount - 1);

    for (let i = 0; i < tickCount; i++) {
      ticks.push(scaleMin + i * step);
    }

    return ticks;
  };

  const ticks = generateTicks();

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="font-sans">
        {/* Background */}
        <rect width={width} height={height} fill="#0f172a" />

        {/* Plot area background */}
        <rect
          x={margin.left}
          y={margin.top}
          width={plotWidth}
          height={plotHeight}
          fill="#1e293b"
          stroke="#334155"
          strokeWidth="1"
        />

        {/* Reference line (vertical dashed line at 1.0 or 0) */}
        <line
          x1={margin.left + refLineX}
          y1={margin.top}
          x2={margin.left + refLineX}
          y2={margin.top + plotHeight}
          stroke="#475569"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        {/* X-axis */}
        <line
          x1={margin.left}
          y1={margin.top + plotHeight}
          x2={margin.left + plotWidth}
          y2={margin.top + plotHeight}
          stroke="#475569"
          strokeWidth="1"
        />

        {/* X-axis ticks and labels */}
        {ticks.map((tick, i) => {
          const x = margin.left + xScale(tick);
          return (
            <g key={i}>
              <line
                x1={x}
                y1={margin.top + plotHeight}
                x2={x}
                y2={margin.top + plotHeight + 6}
                stroke="#475569"
                strokeWidth="1"
              />
              <text
                x={x}
                y={margin.top + plotHeight + 20}
                textAnchor="middle"
                fontSize="12"
                fill="#94a3b8"
              >
                {tick.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Forest plot data */}
        {data.map((item, index) => {
          const y = margin.top + (index + 0.5) * rowHeight;
          const ciLowerX = margin.left + xScale(item.ci95Lower);
          const ciUpperX = margin.left + xScale(item.ci95Upper);
          const effectX = margin.left + xScale(item.effectSize);

          const color = item.significant ? '#14b8a6' : '#f59e0b'; // teal if significant, amber if not

          return (
            <g key={index}>
              {/* Endpoint label (left side) */}
              <text
                x={margin.left - 10}
                y={y + 5}
                textAnchor="end"
                fontSize="14"
                fill="#e2e8f0"
                fontWeight={item.endpointType === 'primary' ? 'bold' : 'normal'}
              >
                {item.endpointType === 'primary' ? `★ ${item.endpoint}` : item.endpoint}
              </text>

              {/* Confidence interval line */}
              <line
                x1={ciLowerX}
                y1={y}
                x2={ciUpperX}
                y2={y}
                stroke={color}
                strokeWidth="2"
              />

              {/* CI end caps */}
              <line
                x1={ciLowerX}
                y1={y - 8}
                x2={ciLowerX}
                y2={y + 8}
                stroke={color}
                strokeWidth="2"
              />
              <line
                x1={ciUpperX}
                y1={y - 8}
                x2={ciUpperX}
                y2={y + 8}
                stroke={color}
                strokeWidth="2"
              />

              {/* Point estimate (diamond) */}
              <polygon
                points={`${effectX},${y - 8} ${effectX + 8},${y} ${effectX},${y + 8} ${effectX - 8},${y}`}
                fill={color}
                stroke={color}
                strokeWidth="1"
              />

              {/* Effect size and CI (right side) */}
              <text
                x={margin.left + plotWidth + 10}
                y={y + 5}
                fontSize="13"
                fill="#cbd5e1"
                fontFamily="monospace"
              >
                {formatEffectSize(item.effectSize, item.effectType)} ({item.ci95Lower.toFixed(item.effectType === 'MD' ? 1 : 2)}–{item.ci95Upper.toFixed(item.effectType === 'MD' ? 1 : 2)})
              </text>

              {/* P-value (right side) */}
              <text
                x={margin.left + plotWidth + 130}
                y={y + 5}
                fontSize="13"
                fill={item.significant ? '#10b981' : '#94a3b8'}
                fontFamily="monospace"
                fontWeight={item.significant ? 'bold' : 'normal'}
              >
                {formatPValue(item.pValue)}
              </text>
            </g>
          );
        })}

        {/* Column headers */}
        <text
          x={margin.left - 10}
          y={margin.top - 15}
          textAnchor="end"
          fontSize="12"
          fill="#94a3b8"
          fontWeight="bold"
        >
          ENDPOINT
        </text>
        <text
          x={margin.left + plotWidth + 10}
          y={margin.top - 15}
          fontSize="12"
          fill="#94a3b8"
          fontWeight="bold"
        >
          EFFECT (95% CI)
        </text>
        <text
          x={margin.left + plotWidth + 130}
          y={margin.top - 15}
          fontSize="12"
          fill="#94a3b8"
          fontWeight="bold"
        >
          P-VALUE
        </text>

        {/* Favors labels */}
        <text
          x={margin.left + plotWidth * 0.25}
          y={height - 20}
          textAnchor="middle"
          fontSize="12"
          fill="#94a3b8"
          fontStyle="italic"
        >
          ← Favors Drug X
        </text>
        <text
          x={margin.left + plotWidth * 0.75}
          y={height - 20}
          textAnchor="middle"
          fontSize="12"
          fill="#94a3b8"
          fontStyle="italic"
        >
          Favors Placebo →
        </text>
      </svg>
    </div>
  );
}
