// Analytics calculation functions for Query Status Dashboard

import type {
  QueryRecord,
  QueryStats,
  SiteMetrics,
  AgeBin,
  StatusDistribution,
  FormMetrics
} from '../types';

/**
 * Calculate overall query statistics
 */
export function calculateStats(queries: QueryRecord[]): QueryStats {
  if (queries.length === 0) {
    return {
      totalQueries: 0,
      openQueries: 0,
      closedQueries: 0,
      avgAge: 0,
      openRate: 0,
      closedRate: 0,
    };
  }

  const closedQueries = queries.filter(q => q.Status === 'Closed').length;
  const openQueries = queries.length - closedQueries;

  // Calculate average age (only for open queries)
  const openQueriesData = queries.filter(q => q.Status !== 'Closed');
  const avgAge = openQueriesData.length > 0
    ? Math.round(openQueriesData.reduce((sum, q) => sum + q.Age, 0) / openQueriesData.length)
    : 0;

  return {
    totalQueries: queries.length,
    openQueries,
    closedQueries,
    avgAge,
    openRate: Math.round((openQueries / queries.length) * 100),
    closedRate: Math.round((closedQueries / queries.length) * 100),
  };
}

/**
 * Generate site performance metrics
 * Returns top sites by total query volume
 */
export function generateSiteMetrics(queries: QueryRecord[], limit = 10): SiteMetrics[] {
  if (queries.length === 0) return [];

  const siteMap = new Map<string, { open: number; closed: number }>();

  queries.forEach(q => {
    if (!siteMap.has(q.Site)) {
      siteMap.set(q.Site, { open: 0, closed: 0 });
    }

    const metrics = siteMap.get(q.Site)!;
    if (q.Status === 'Closed') {
      metrics.closed++;
    } else {
      metrics.open++;
    }
  });

  const siteMetrics: SiteMetrics[] = Array.from(siteMap.entries()).map(([site, metrics]) => ({
    site,
    open: metrics.open,
    closed: metrics.closed,
    total: metrics.open + metrics.closed,
  }));

  // Sort by total volume (descending) and limit
  return siteMetrics
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/**
 * Generate age distribution bins for open queries
 * Bins: 0-7, 8-14, 15-30, 31-60, 61-90, 90+ days
 */
export function generateAgeBins(queries: QueryRecord[]): AgeBin[] {
  const openQueries = queries.filter(q => q.Status !== 'Closed');

  const bins = [
    { range: '0-7 days', count: 0 },
    { range: '8-14 days', count: 0 },
    { range: '15-30 days', count: 0 },
    { range: '31-60 days', count: 0 },
    { range: '61-90 days', count: 0 },
    { range: '90+ days', count: 0 },
  ];

  openQueries.forEach(q => {
    if (q.Age <= 7) bins[0].count++;
    else if (q.Age <= 14) bins[1].count++;
    else if (q.Age <= 30) bins[2].count++;
    else if (q.Age <= 60) bins[3].count++;
    else if (q.Age <= 90) bins[4].count++;
    else bins[5].count++;
  });

  return bins;
}

/**
 * Generate status distribution
 */
export function generateStatusDistribution(queries: QueryRecord[]): StatusDistribution[] {
  if (queries.length === 0) return [];

  const statusMap = new Map<string, number>();

  queries.forEach(q => {
    statusMap.set(q.Status, (statusMap.get(q.Status) || 0) + 1);
  });

  const distribution: StatusDistribution[] = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  // Sort by count descending
  return distribution.sort((a, b) => b.count - a.count);
}

/**
 * Generate top forms by query frequency
 */
export function generateTopForms(queries: QueryRecord[], limit = 8): FormMetrics[] {
  if (queries.length === 0) return [];

  const formMap = new Map<string, number>();

  queries.forEach(q => {
    formMap.set(q.Form, (formMap.get(q.Form) || 0) + 1);
  });

  const formMetrics: FormMetrics[] = Array.from(formMap.entries()).map(([form, count]) => ({
    form,
    count,
  }));

  // Sort by count descending and limit
  return formMetrics
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
