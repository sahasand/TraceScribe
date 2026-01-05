// Data Reconciliation TypeScript Interfaces

export interface EDCRecord {
  PATIENT: string;
  SITE: string;
  VISIT: string;
  LBCAT: string;
  LBDAT: string;
  LBPERF: string;
}

export interface LabRecord {
  USUBJID: string;
  VISIT: string;
  LBCAT: string;
  LBDTC: string;
  LBTESTCD: string;
}

export type MatchStatus = 'MATCHED' | 'EDC_ONLY' | 'LAB_ONLY';
export type DateMatchStatus = 'MATCH' | 'MISMATCH' | 'MISSING' | 'N/A';

export interface ReconciliationResult {
  PATIENT: string;
  VISIT: string;
  LBCAT: string;
  MATCH_STATUS: MatchStatus;
  DATE_MATCH: DateMatchStatus;
  EDC_DATE?: string;
  LAB_DATE?: string;
  DATE_DIFF_DAYS?: number;
  SITE?: string;
}

export interface SubjectGap {
  PATIENT: string;
  GAP_TYPE: 'EDC_ONLY' | 'LAB_ONLY';
  SITE?: string;
  VISIT_COUNT: number;
  CATEGORIES: string[];
}

export interface VisitGap {
  PATIENT: string;
  VISIT: string;
  GAP_TYPE: 'EDC_ONLY' | 'LAB_ONLY';
  SITE?: string;
  CATEGORIES: string[];
}

export interface CategoryGap {
  PATIENT: string;
  VISIT: string;
  LBCAT: string;
  GAP_TYPE: 'EDC_ONLY' | 'LAB_ONLY';
  SITE?: string;
  EDC_DATE?: string;
  LAB_DATE?: string;
}

export interface DateMismatch {
  PATIENT: string;
  VISIT: string;
  LBCAT: string;
  EDC_DATE: string;
  LAB_DATE: string;
  DATE_DIFF_DAYS: number;
  SITE?: string;
}

export interface ReconciliationStats {
  totalRecords: number;
  matched: number;
  edcOnly: number;
  labOnly: number;
  dateMismatches: number;
  perfectMatches: number;
  subjectGaps: {
    edcOnly: number;
    labOnly: number;
  };
}

export type TabType = 'summary' | 'subjects' | 'visits' | 'categories' | 'dates';
