// TypeScript interfaces for Query Status Dashboard

export interface QueryRecord {
  Site: string;               // "21 - Cook County Health"
  Subject: string;            // "STUDY-001-001"
  Form: string;               // "Adverse Events", "Demographics"
  QueryID: string;            // "Q12345"
  QueryText: string;          // Question text
  Age: number;                // Days since query opened
  Status: 'Open' | 'Closed' | 'New' | 'Pending' | 'Answered';
  DateOpened?: string;        // ISO date
  DateClosed?: string;        // ISO date
}

export interface QueryStats {
  totalQueries: number;
  openQueries: number;
  closedQueries: number;
  avgAge: number;
  openRate: number;           // Percentage
  closedRate: number;         // Percentage
}

export interface SiteMetrics {
  site: string;
  open: number;
  closed: number;
  total: number;
}

export interface AgeBin {
  range: string;              // "0-7 days", "8-14 days", etc.
  count: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface FormMetrics {
  form: string;
  count: number;
}

export type AppMode = 'initial' | 'demo-loading' | 'demo' | 'live';
export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

export interface ParseResult {
  success: boolean;
  data?: QueryRecord[];
  error?: string;
  queryCount?: number;
  siteCount?: number;
}
