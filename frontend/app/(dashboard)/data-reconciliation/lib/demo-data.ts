import {
  EDCRecord,
  LabRecord,
  ReconciliationResult,
  SubjectGap,
  VisitGap,
  CategoryGap,
  DateMismatch,
  ReconciliationStats,
} from '../types';

// Demo EDC Metadata (10 patients)
export const DEMO_EDC_DATA: EDCRecord[] = [
  // PAT-001 - Perfect matches
  { PATIENT: 'PAT-001', SITE: 'Site 001', VISIT: 'Screening', LBCAT: 'Chemistry', LBDAT: '2025-01-15', LBPERF: 'Y' },
  { PATIENT: 'PAT-001', SITE: 'Site 001', VISIT: 'Screening', LBCAT: 'Hematology', LBDAT: '2025-01-15', LBPERF: 'Y' },
  { PATIENT: 'PAT-001', SITE: 'Site 001', VISIT: 'Baseline', LBCAT: 'Chemistry', LBDAT: '2025-01-20', LBPERF: 'Y' },
  { PATIENT: 'PAT-001', SITE: 'Site 001', VISIT: 'Week 4', LBCAT: 'Chemistry', LBDAT: '2025-02-17', LBPERF: 'Y' },

  // PAT-002 - Missing Week 12 in Lab (visit gap)
  { PATIENT: 'PAT-002', SITE: 'Site 002', VISIT: 'Screening', LBCAT: 'Chemistry', LBDAT: '2025-01-16', LBPERF: 'Y' },
  { PATIENT: 'PAT-002', SITE: 'Site 002', VISIT: 'Baseline', LBCAT: 'Chemistry', LBDAT: '2025-01-21', LBPERF: 'Y' },
  { PATIENT: 'PAT-002', SITE: 'Site 002', VISIT: 'Week 12', LBCAT: 'Chemistry', LBDAT: '2025-04-14', LBPERF: 'Y' },

  // PAT-003 - Perfect matches
  { PATIENT: 'PAT-003', SITE: 'Site 001', VISIT: 'Screening', LBCAT: 'Chemistry', LBDAT: '2025-01-17', LBPERF: 'Y' },
  { PATIENT: 'PAT-003', SITE: 'Site 001', VISIT: 'Baseline', LBCAT: 'Hematology', LBDAT: '2025-01-22', LBPERF: 'Y' },

  // PAT-004 - Missing Hematology in Lab (category gap)
  { PATIENT: 'PAT-004', SITE: 'Site 003', VISIT: 'Screening', LBCAT: 'Chemistry', LBDAT: '2025-01-18', LBPERF: 'Y' },
  { PATIENT: 'PAT-004', SITE: 'Site 003', VISIT: 'Screening', LBCAT: 'Hematology', LBDAT: '2025-01-18', LBPERF: 'Y' },
  { PATIENT: 'PAT-004', SITE: 'Site 003', VISIT: 'Baseline', LBCAT: 'Chemistry', LBDAT: '2025-01-23', LBPERF: 'Y' },

  // PAT-005 - Perfect matches
  { PATIENT: 'PAT-005', SITE: 'Site 002', VISIT: 'Screening', LBCAT: 'Urinalysis', LBDAT: '2025-01-19', LBPERF: 'Y' },

  // PAT-006 - Date mismatch (-3 days)
  { PATIENT: 'PAT-006', SITE: 'Site 001', VISIT: 'Screening', LBCAT: 'Chemistry', LBDAT: '2025-01-20', LBPERF: 'Y' },
  { PATIENT: 'PAT-006', SITE: 'Site 001', VISIT: 'Baseline', LBCAT: 'Chemistry', LBDAT: '2025-01-25', LBPERF: 'Y' },

  // PAT-007 - Date mismatch (+2 days)
  { PATIENT: 'PAT-007', SITE: 'Site 003', VISIT: 'Screening', LBCAT: 'Hematology', LBDAT: '2025-01-21', LBPERF: 'Y' },

  // PAT-008 - Date mismatch (-7 days)
  { PATIENT: 'PAT-008', SITE: 'Site 002', VISIT: 'Baseline', LBCAT: 'Chemistry', LBDAT: '2025-01-22', LBPERF: 'Y' },

  // PAT-009 - In EDC only (subject gap)
  { PATIENT: 'PAT-009', SITE: 'Site 001', VISIT: 'Screening', LBCAT: 'Chemistry', LBDAT: '2025-01-23', LBPERF: 'Y' },
  { PATIENT: 'PAT-009', SITE: 'Site 001', VISIT: 'Baseline', LBCAT: 'Chemistry', LBDAT: '2025-01-28', LBPERF: 'Y' },
  { PATIENT: 'PAT-009', SITE: 'Site 001', VISIT: 'Week 4', LBCAT: 'Hematology', LBDAT: '2025-02-25', LBPERF: 'Y' },
];

// Demo Lab Results (10 patients, but PAT-009 missing, PAT-010 extra)
export const DEMO_LAB_DATA: LabRecord[] = [
  // PAT-001 - Perfect matches
  { USUBJID: 'PAT-001', VISIT: 'Screening', LBCAT: 'Chemistry', LBDTC: '2025-01-15', LBTESTCD: 'ALT' },
  { USUBJID: 'PAT-001', VISIT: 'Screening', LBCAT: 'Chemistry', LBDTC: '2025-01-15', LBTESTCD: 'AST' },
  { USUBJID: 'PAT-001', VISIT: 'Screening', LBCAT: 'Hematology', LBDTC: '2025-01-15', LBTESTCD: 'WBC' },
  { USUBJID: 'PAT-001', VISIT: 'Baseline', LBCAT: 'Chemistry', LBDTC: '2025-01-20', LBTESTCD: 'ALT' },
  { USUBJID: 'PAT-001', VISIT: 'Week 4', LBCAT: 'Chemistry', LBDTC: '2025-02-17', LBTESTCD: 'ALT' },

  // PAT-002 - Missing Week 12 (visit gap)
  { USUBJID: 'PAT-002', VISIT: 'Screening', LBCAT: 'Chemistry', LBDTC: '2025-01-16', LBTESTCD: 'ALT' },
  { USUBJID: 'PAT-002', VISIT: 'Baseline', LBCAT: 'Chemistry', LBDTC: '2025-01-21', LBTESTCD: 'ALT' },

  // PAT-003 - Perfect matches
  { USUBJID: 'PAT-003', VISIT: 'Screening', LBCAT: 'Chemistry', LBDTC: '2025-01-17', LBTESTCD: 'ALT' },
  { USUBJID: 'PAT-003', VISIT: 'Baseline', LBCAT: 'Hematology', LBDTC: '2025-01-22', LBTESTCD: 'WBC' },

  // PAT-004 - Missing Hematology at Screening (category gap)
  { USUBJID: 'PAT-004', VISIT: 'Screening', LBCAT: 'Chemistry', LBDTC: '2025-01-18', LBTESTCD: 'ALT' },
  { USUBJID: 'PAT-004', VISIT: 'Baseline', LBCAT: 'Chemistry', LBDTC: '2025-01-23', LBTESTCD: 'ALT' },

  // PAT-005 - Perfect match
  { USUBJID: 'PAT-005', VISIT: 'Screening', LBCAT: 'Urinalysis', LBDTC: '2025-01-19', LBTESTCD: 'PH' },

  // PAT-006 - Date mismatch (-3 days: EDC 01-20, Lab 01-23)
  { USUBJID: 'PAT-006', VISIT: 'Screening', LBCAT: 'Chemistry', LBDTC: '2025-01-23', LBTESTCD: 'ALT' },
  { USUBJID: 'PAT-006', VISIT: 'Baseline', LBCAT: 'Chemistry', LBDTC: '2025-01-25', LBTESTCD: 'ALT' },

  // PAT-007 - Date mismatch (+2 days: EDC 01-21, Lab 01-19)
  { USUBJID: 'PAT-007', VISIT: 'Screening', LBCAT: 'Hematology', LBDTC: '2025-01-19', LBTESTCD: 'WBC' },

  // PAT-008 - Date mismatch (-7 days: EDC 01-22, Lab 01-29)
  { USUBJID: 'PAT-008', VISIT: 'Baseline', LBCAT: 'Chemistry', LBDTC: '2025-01-29', LBTESTCD: 'ALT' },

  // PAT-010 - In Lab only (subject gap) - NOT in EDC
  { USUBJID: 'PAT-010', VISIT: 'Screening', LBCAT: 'Chemistry', LBDTC: '2025-01-24', LBTESTCD: 'ALT' },
  { USUBJID: 'PAT-010', VISIT: 'Baseline', LBCAT: 'Chemistry', LBDTC: '2025-01-29', LBTESTCD: 'ALT' },
];

// Pre-calculated reconciliation results for demo
export const DEMO_RECONCILIATION_RESULTS: ReconciliationResult[] = [
  // PAT-001 - All perfect matches
  { PATIENT: 'PAT-001', VISIT: 'Screening', LBCAT: 'Chemistry', MATCH_STATUS: 'MATCHED', DATE_MATCH: 'MATCH', EDC_DATE: '2025-01-15', LAB_DATE: '2025-01-15', DATE_DIFF_DAYS: 0, SITE: 'Site 001' },
  { PATIENT: 'PAT-001', VISIT: 'Screening', LBCAT: 'Hematology', MATCH_STATUS: 'MATCHED', DATE_MATCH: 'MATCH', EDC_DATE: '2025-01-15', LAB_DATE: '2025-01-15', DATE_DIFF_DAYS: 0, SITE: 'Site 001' },
  { PATIENT: 'PAT-001', VISIT: 'Baseline', LBCAT: 'Chemistry', MATCH_STATUS: 'MATCHED', DATE_MATCH: 'MATCH', EDC_DATE: '2025-01-20', LAB_DATE: '2025-01-20', DATE_DIFF_DAYS: 0, SITE: 'Site 001' },
  { PATIENT: 'PAT-001', VISIT: 'Week 4', LBCAT: 'Chemistry', MATCH_STATUS: 'MATCHED', DATE_MATCH: 'MATCH', EDC_DATE: '2025-02-17', LAB_DATE: '2025-02-17', DATE_DIFF_DAYS: 0, SITE: 'Site 001' },

  // PAT-002 - Visit gap (Week 12 in EDC only)
  { PATIENT: 'PAT-002', VISIT: 'Screening', LBCAT: 'Chemistry', MATCH_STATUS: 'MATCHED', DATE_MATCH: 'MATCH', EDC_DATE: '2025-01-16', LAB_DATE: '2025-01-16', DATE_DIFF_DAYS: 0, SITE: 'Site 002' },
  { PATIENT: 'PAT-002', VISIT: 'Baseline', LBCAT: 'Chemistry', MATCH_STATUS: 'MATCHED', DATE_MATCH: 'MATCH', EDC_DATE: '2025-01-21', LAB_DATE: '2025-01-21', DATE_DIFF_DAYS: 0, SITE: 'Site 002' },
  { PATIENT: 'PAT-002', VISIT: 'Week 12', LBCAT: 'Chemistry', MATCH_STATUS: 'EDC_ONLY', DATE_MATCH: 'N/A', EDC_DATE: '2025-04-14', SITE: 'Site 002' },

  // PAT-003 - Perfect matches
  { PATIENT: 'PAT-003', VISIT: 'Screening', LBCAT: 'Chemistry', MATCH_STATUS: 'MATCHED', DATE_MATCH: 'MATCH', EDC_DATE: '2025-01-17', LAB_DATE: '2025-01-17', DATE_DIFF_DAYS: 0, SITE: 'Site 001' },
  { PATIENT: 'PAT-003', VISIT: 'Baseline', LBCAT: 'Hematology', MATCH_STATUS: 'MATCHED', DATE_MATCH: 'MATCH', EDC_DATE: '2025-01-22', LAB_DATE: '2025-01-22', DATE_DIFF_DAYS: 0, SITE: 'Site 001' },

  // PAT-004 - Category gap (Hematology at Screening in EDC only)
  { PATIENT: 'PAT-004', VISIT: 'Screening', LBCAT: 'Chemistry', MATCH_STATUS: 'MATCHED', DATE_MATCH: 'MATCH', EDC_DATE: '2025-01-18', LAB_DATE: '2025-01-18', DATE_DIFF_DAYS: 0, SITE: 'Site 003' },
  { PATIENT: 'PAT-004', VISIT: 'Screening', LBCAT: 'Hematology', MATCH_STATUS: 'EDC_ONLY', DATE_MATCH: 'N/A', EDC_DATE: '2025-01-18', SITE: 'Site 003' },
  { PATIENT: 'PAT-004', VISIT: 'Baseline', LBCAT: 'Chemistry', MATCH_STATUS: 'MATCHED', DATE_MATCH: 'MATCH', EDC_DATE: '2025-01-23', LAB_DATE: '2025-01-23', DATE_DIFF_DAYS: 0, SITE: 'Site 003' },

  // PAT-005 - Perfect match
  { PATIENT: 'PAT-005', VISIT: 'Screening', LBCAT: 'Urinalysis', MATCH_STATUS: 'MATCHED', DATE_MATCH: 'MATCH', EDC_DATE: '2025-01-19', LAB_DATE: '2025-01-19', DATE_DIFF_DAYS: 0, SITE: 'Site 002' },

  // PAT-006 - Date mismatch (-3 days)
  { PATIENT: 'PAT-006', VISIT: 'Screening', LBCAT: 'Chemistry', MATCH_STATUS: 'MATCHED', DATE_MATCH: 'MISMATCH', EDC_DATE: '2025-01-20', LAB_DATE: '2025-01-23', DATE_DIFF_DAYS: 3, SITE: 'Site 001' },
  { PATIENT: 'PAT-006', VISIT: 'Baseline', LBCAT: 'Chemistry', MATCH_STATUS: 'MATCHED', DATE_MATCH: 'MATCH', EDC_DATE: '2025-01-25', LAB_DATE: '2025-01-25', DATE_DIFF_DAYS: 0, SITE: 'Site 001' },

  // PAT-007 - Date mismatch (+2 days)
  { PATIENT: 'PAT-007', VISIT: 'Screening', LBCAT: 'Hematology', MATCH_STATUS: 'MATCHED', DATE_MATCH: 'MISMATCH', EDC_DATE: '2025-01-21', LAB_DATE: '2025-01-19', DATE_DIFF_DAYS: -2, SITE: 'Site 003' },

  // PAT-008 - Date mismatch (-7 days)
  { PATIENT: 'PAT-008', VISIT: 'Baseline', LBCAT: 'Chemistry', MATCH_STATUS: 'MATCHED', DATE_MATCH: 'MISMATCH', EDC_DATE: '2025-01-22', LAB_DATE: '2025-01-29', DATE_DIFF_DAYS: 7, SITE: 'Site 002' },

  // PAT-009 - EDC only (subject gap)
  { PATIENT: 'PAT-009', VISIT: 'Screening', LBCAT: 'Chemistry', MATCH_STATUS: 'EDC_ONLY', DATE_MATCH: 'N/A', EDC_DATE: '2025-01-23', SITE: 'Site 001' },
  { PATIENT: 'PAT-009', VISIT: 'Baseline', LBCAT: 'Chemistry', MATCH_STATUS: 'EDC_ONLY', DATE_MATCH: 'N/A', EDC_DATE: '2025-01-28', SITE: 'Site 001' },
  { PATIENT: 'PAT-009', VISIT: 'Week 4', LBCAT: 'Hematology', MATCH_STATUS: 'EDC_ONLY', DATE_MATCH: 'N/A', EDC_DATE: '2025-02-25', SITE: 'Site 001' },

  // PAT-010 - Lab only (subject gap)
  { PATIENT: 'PAT-010', VISIT: 'Screening', LBCAT: 'Chemistry', MATCH_STATUS: 'LAB_ONLY', DATE_MATCH: 'N/A', LAB_DATE: '2025-01-24' },
  { PATIENT: 'PAT-010', VISIT: 'Baseline', LBCAT: 'Chemistry', MATCH_STATUS: 'LAB_ONLY', DATE_MATCH: 'N/A', LAB_DATE: '2025-01-29' },
];

// Subject gaps
export const DEMO_SUBJECT_GAPS: SubjectGap[] = [
  { PATIENT: 'PAT-009', GAP_TYPE: 'EDC_ONLY', SITE: 'Site 001', VISIT_COUNT: 3, CATEGORIES: ['Chemistry', 'Hematology'] },
  { PATIENT: 'PAT-010', GAP_TYPE: 'LAB_ONLY', VISIT_COUNT: 2, CATEGORIES: ['Chemistry'] },
];

// Visit gaps
export const DEMO_VISIT_GAPS: VisitGap[] = [
  { PATIENT: 'PAT-002', VISIT: 'Week 12', GAP_TYPE: 'EDC_ONLY', SITE: 'Site 002', CATEGORIES: ['Chemistry'] },
];

// Category gaps
export const DEMO_CATEGORY_GAPS: CategoryGap[] = [
  { PATIENT: 'PAT-004', VISIT: 'Screening', LBCAT: 'Hematology', GAP_TYPE: 'EDC_ONLY', SITE: 'Site 003', EDC_DATE: '2025-01-18' },
];

// Date mismatches
export const DEMO_DATE_MISMATCHES: DateMismatch[] = [
  { PATIENT: 'PAT-006', VISIT: 'Screening', LBCAT: 'Chemistry', EDC_DATE: '2025-01-20', LAB_DATE: '2025-01-23', DATE_DIFF_DAYS: 3, SITE: 'Site 001' },
  { PATIENT: 'PAT-007', VISIT: 'Screening', LBCAT: 'Hematology', EDC_DATE: '2025-01-21', LAB_DATE: '2025-01-19', DATE_DIFF_DAYS: -2, SITE: 'Site 003' },
  { PATIENT: 'PAT-008', VISIT: 'Baseline', LBCAT: 'Chemistry', EDC_DATE: '2025-01-22', LAB_DATE: '2025-01-29', DATE_DIFF_DAYS: 7, SITE: 'Site 002' },
];

// Summary statistics
export const DEMO_STATS: ReconciliationStats = {
  totalRecords: 24, // Total reconciliation results
  matched: 16, // MATCHED status
  edcOnly: 6, // EDC_ONLY status
  labOnly: 2, // LAB_ONLY status
  dateMismatches: 3, // MATCHED with DATE_MATCH = MISMATCH
  perfectMatches: 13, // MATCHED with DATE_MATCH = MATCH
  subjectGaps: {
    edcOnly: 1, // PAT-009
    labOnly: 1, // PAT-010
  },
};
