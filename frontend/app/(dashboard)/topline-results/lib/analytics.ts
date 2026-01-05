/**
 * Analytics and formatting utilities for Top-line Results Dashboard
 * Medical/regulatory-grade formatting for statistics
 */

/**
 * Format p-value for clinical reporting
 * - p < 0.001 → "<.001"
 * - p = 0.0234 → ".023"
 * - p = 0.1234 → ".123"
 * - p ≥ 0.995 → ">.99"
 */
export function formatPValue(p: number): string {
  if (p < 0.001) return '<.001';
  if (p >= 0.995) return '>.99';

  // Round to 3 decimal places and remove leading zero
  const rounded = Math.round(p * 1000) / 1000;
  return rounded.toString().replace(/^0/, '');
}

/**
 * Format confidence interval for clinical reporting
 * - (20.1, 33.3) → "(20.1-33.3)"
 * - Handles negative values: (-21.3, -11.1) → "(-21.3--11.1)"
 */
export function formatCI(lower: number, upper: number, decimals: number = 1): string {
  const lowerStr = lower.toFixed(decimals);
  const upperStr = upper.toFixed(decimals);
  return `(${lowerStr}-${upperStr})`;
}

/**
 * Format percentage from count and total
 * - (117, 150) → "78.0%"
 * - (23, 150) → "15.3%"
 * - Always shows 1 decimal place
 */
export function formatPercent(n: number, total: number): string {
  if (total === 0) return '0.0%';
  const pct = (n / total) * 100;
  return `${pct.toFixed(1)}%`;
}

/**
 * Format count with percentage
 * - (117, 150) → "117 (78.0%)"
 * - (3, 150) → "3 (2.0%)"
 */
export function formatCountPct(n: number, total: number): string {
  const pct = formatPercent(n, total);
  return `${n} (${pct})`;
}

/**
 * Format mean ± SD for clinical reporting
 * - (63.8, 11.8) → "63.8 ± 11.8"
 */
export function formatMeanSD(mean: number, sd: number, decimals: number = 1): string {
  return `${mean.toFixed(decimals)} ± ${sd.toFixed(decimals)}`;
}

/**
 * Format median with IQR
 * - (1820, 1180, 2790) → "1820 (1180-2790)"
 */
export function formatMedianIQR(median: number, q1: number, q3: number): string {
  return `${median} (${q1}-${q3})`;
}

/**
 * Format effect size based on type
 * - HR/OR/RR: "0.62" or "2.15"
 * - MD: "+26.7" or "-16.2"
 * - PCT: "-28.3%" or "+12.5%"
 */
export function formatEffectSize(effectSize: number, effectType: 'HR' | 'OR' | 'MD' | 'RR' | 'PCT'): string {
  switch (effectType) {
    case 'HR':
    case 'OR':
    case 'RR':
      return effectSize.toFixed(2);

    case 'MD':
      const sign = effectSize >= 0 ? '+' : '';
      return `${sign}${effectSize.toFixed(1)}`;

    case 'PCT':
      const pctSign = effectSize >= 0 ? '+' : '';
      return `${pctSign}${effectSize.toFixed(1)}%`;

    default:
      return effectSize.toFixed(2);
  }
}

/**
 * Format full effect size with CI for tables
 * - (2.15, 1.35, 3.42, 'OR') → "OR 2.15 (1.35-3.42)"
 * - (26.7, 20.1, 33.3, 'MD') → "MD +26.7 (20.1-33.3)"
 */
export function formatEffectWithCI(
  effectSize: number,
  ci95Lower: number,
  ci95Upper: number,
  effectType: 'HR' | 'OR' | 'MD' | 'RR' | 'PCT'
): string {
  const effect = formatEffectSize(effectSize, effectType);
  const ci = formatCI(ci95Lower, ci95Upper, effectType === 'MD' ? 1 : 2);
  return `${effectType} ${effect} ${ci}`;
}

/**
 * Determine if result is statistically significant
 * - p < 0.05 → true
 */
export function isSignificant(pValue: number, alpha: number = 0.05): boolean {
  return pValue < alpha;
}

/**
 * Format study arm display name
 * - "Drug X 10mg" → "Drug X 10mg (n=150)"
 */
export function formatArmName(name: string, n: number): string {
  return `${name} (n=${n})`;
}

/**
 * Calculate completion rate
 * - (276, 300) → 92.0
 */
export function calculateCompletionRate(completed: number, enrolled: number): number {
  if (enrolled === 0) return 0;
  return (completed / enrolled) * 100;
}

/**
 * Format age range statistics
 * - (64, 12, 28, 89) → "64 ± 12 years (range 28-89)"
 */
export function formatAgeStats(mean: number, sd: number, min: number, max: number): string {
  return `${mean.toFixed(1)} ± ${sd.toFixed(1)} years (range ${min}-${max})`;
}
