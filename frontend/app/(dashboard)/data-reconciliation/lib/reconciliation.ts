import type {
  EDCRecord,
  LabRecord,
  ReconciliationResult,
  SubjectGap,
  VisitGap,
  CategoryGap,
  DateMismatch,
  ReconciliationStats,
} from '../types';

// Aggregate lab data by patient-visit-category
interface AggregatedLabRecord extends LabRecord {
  testCount: number;
}

function aggregateLabData(labRecords: LabRecord[]): Map<string, AggregatedLabRecord> {
  const aggregated = new Map<string, AggregatedLabRecord>();

  labRecords.forEach((record) => {
    const key = `${record.USUBJID}|${record.VISIT}|${record.LBCAT}`;

    if (!aggregated.has(key)) {
      aggregated.set(key, {
        ...record,
        testCount: 1,
      });
    } else {
      const existing = aggregated.get(key)!;
      existing.testCount++;
    }
  });

  return aggregated;
}

// Compare dates and return match status
function compareDates(edcDate: string | null, labDate: string | null): {
  status: 'MATCH' | 'MISMATCH' | 'MISSING';
  diffDays: number | null;
} {
  if (!edcDate || !labDate) {
    return { status: 'MISSING', diffDays: null };
  }

  if (edcDate === labDate) {
    return { status: 'MATCH', diffDays: 0 };
  }

  // Calculate date difference
  const d1 = new Date(edcDate);
  const d2 = new Date(labDate);
  const diffMs = d2.getTime() - d1.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return { status: 'MISMATCH', diffDays };
}

// Main reconciliation function
export function performReconciliation(
  edcRecords: EDCRecord[],
  labRecords: LabRecord[]
): ReconciliationResult[] {
  const results: ReconciliationResult[] = [];

  // Aggregate lab data
  const labAggregated = aggregateLabData(labRecords);

  // Create EDC map for lookups
  const edcMap = new Map<string, EDCRecord>();
  edcRecords.forEach((record) => {
    const key = `${record.PATIENT}|${record.VISIT}|${record.LBCAT}`;
    edcMap.set(key, record);
  });

  // Process EDC records - find matches and EDC-only
  edcRecords.forEach((edcRecord) => {
    const key = `${edcRecord.PATIENT}|${edcRecord.VISIT}|${edcRecord.LBCAT}`;
    const labRecord = labAggregated.get(key);

    if (labRecord) {
      // MATCHED - compare dates
      const dateComparison = compareDates(edcRecord.LBDAT, labRecord.LBDTC);

      results.push({
        PATIENT: edcRecord.PATIENT,
        VISIT: edcRecord.VISIT,
        LBCAT: edcRecord.LBCAT,
        MATCH_STATUS: 'MATCHED',
        DATE_MATCH: dateComparison.status,
        EDC_DATE: edcRecord.LBDAT,
        LAB_DATE: labRecord.LBDTC,
        DATE_DIFF_DAYS: dateComparison.diffDays || undefined,
        SITE: edcRecord.SITE,
      });

      // Mark as processed
      labAggregated.delete(key);
    } else {
      // EDC_ONLY
      results.push({
        PATIENT: edcRecord.PATIENT,
        VISIT: edcRecord.VISIT,
        LBCAT: edcRecord.LBCAT,
        MATCH_STATUS: 'EDC_ONLY',
        DATE_MATCH: 'N/A',
        EDC_DATE: edcRecord.LBDAT,
        SITE: edcRecord.SITE,
      });
    }
  });

  // Remaining lab records are LAB_ONLY
  labAggregated.forEach((labRecord) => {
    results.push({
      PATIENT: labRecord.USUBJID,
      VISIT: labRecord.VISIT,
      LBCAT: labRecord.LBCAT,
      MATCH_STATUS: 'LAB_ONLY',
      DATE_MATCH: 'N/A',
      LAB_DATE: labRecord.LBDTC,
    });
  });

  return results;
}

// Generate subject gaps
export function generateSubjectGaps(results: ReconciliationResult[]): SubjectGap[] {
  const edcPatients = new Map<string, { site?: string; visits: Set<string>; categories: Set<string> }>();
  const labPatients = new Map<string, { visits: Set<string>; categories: Set<string> }>();

  results.forEach((result) => {
    // Track EDC patients
    if (result.MATCH_STATUS === 'MATCHED' || result.MATCH_STATUS === 'EDC_ONLY') {
      if (!edcPatients.has(result.PATIENT)) {
        edcPatients.set(result.PATIENT, {
          site: result.SITE,
          visits: new Set(),
          categories: new Set(),
        });
      }
      const patient = edcPatients.get(result.PATIENT)!;
      patient.visits.add(result.VISIT);
      patient.categories.add(result.LBCAT);
    }

    // Track Lab patients
    if (result.MATCH_STATUS === 'MATCHED' || result.MATCH_STATUS === 'LAB_ONLY') {
      if (!labPatients.has(result.PATIENT)) {
        labPatients.set(result.PATIENT, {
          visits: new Set(),
          categories: new Set(),
        });
      }
      const patient = labPatients.get(result.PATIENT)!;
      patient.visits.add(result.VISIT);
      patient.categories.add(result.LBCAT);
    }
  });

  const gaps: SubjectGap[] = [];

  // EDC-only patients
  edcPatients.forEach((data, patient) => {
    if (!labPatients.has(patient)) {
      gaps.push({
        PATIENT: patient,
        GAP_TYPE: 'EDC_ONLY',
        SITE: data.site,
        VISIT_COUNT: data.visits.size,
        CATEGORIES: Array.from(data.categories),
      });
    }
  });

  // Lab-only patients
  labPatients.forEach((data, patient) => {
    if (!edcPatients.has(patient)) {
      gaps.push({
        PATIENT: patient,
        GAP_TYPE: 'LAB_ONLY',
        VISIT_COUNT: data.visits.size,
        CATEGORIES: Array.from(data.categories),
      });
    }
  });

  return gaps;
}

// Generate visit gaps
export function generateVisitGaps(results: ReconciliationResult[]): VisitGap[] {
  const patientVisits = new Map<string, {
    edcVisits: Map<string, { site?: string; categories: Set<string> }>;
    labVisits: Map<string, { categories: Set<string> }>;
  }>();

  results.forEach((result) => {
    if (!patientVisits.has(result.PATIENT)) {
      patientVisits.set(result.PATIENT, {
        edcVisits: new Map(),
        labVisits: new Map(),
      });
    }

    const patient = patientVisits.get(result.PATIENT)!;

    if (result.MATCH_STATUS === 'MATCHED' || result.MATCH_STATUS === 'EDC_ONLY') {
      if (!patient.edcVisits.has(result.VISIT)) {
        patient.edcVisits.set(result.VISIT, { site: result.SITE, categories: new Set() });
      }
      patient.edcVisits.get(result.VISIT)!.categories.add(result.LBCAT);
    }

    if (result.MATCH_STATUS === 'MATCHED' || result.MATCH_STATUS === 'LAB_ONLY') {
      if (!patient.labVisits.has(result.VISIT)) {
        patient.labVisits.set(result.VISIT, { categories: new Set() });
      }
      patient.labVisits.get(result.VISIT)!.categories.add(result.LBCAT);
    }
  });

  const gaps: VisitGap[] = [];

  patientVisits.forEach((visits, patient) => {
    // EDC-only visits
    visits.edcVisits.forEach((data, visit) => {
      if (!visits.labVisits.has(visit)) {
        gaps.push({
          PATIENT: patient,
          VISIT: visit,
          GAP_TYPE: 'EDC_ONLY',
          SITE: data.site,
          CATEGORIES: Array.from(data.categories),
        });
      }
    });

    // Lab-only visits
    visits.labVisits.forEach((data, visit) => {
      if (!visits.edcVisits.has(visit)) {
        gaps.push({
          PATIENT: patient,
          VISIT: visit,
          GAP_TYPE: 'LAB_ONLY',
          CATEGORIES: Array.from(data.categories),
        });
      }
    });
  });

  return gaps;
}

// Generate category gaps
export function generateCategoryGaps(results: ReconciliationResult[]): CategoryGap[] {
  return results
    .filter((result) => result.MATCH_STATUS === 'EDC_ONLY' || result.MATCH_STATUS === 'LAB_ONLY')
    .map((result) => ({
      PATIENT: result.PATIENT,
      VISIT: result.VISIT,
      LBCAT: result.LBCAT,
      GAP_TYPE: result.MATCH_STATUS as 'EDC_ONLY' | 'LAB_ONLY',
      SITE: result.SITE,
      EDC_DATE: result.EDC_DATE,
      LAB_DATE: result.LAB_DATE,
    }));
}

// Generate date mismatches
export function generateDateMismatches(results: ReconciliationResult[]): DateMismatch[] {
  return results
    .filter((result) => result.MATCH_STATUS === 'MATCHED' && result.DATE_MATCH === 'MISMATCH')
    .map((result) => ({
      PATIENT: result.PATIENT,
      VISIT: result.VISIT,
      LBCAT: result.LBCAT,
      EDC_DATE: result.EDC_DATE!,
      LAB_DATE: result.LAB_DATE!,
      DATE_DIFF_DAYS: result.DATE_DIFF_DAYS!,
      SITE: result.SITE,
    }));
}

// Calculate summary statistics
export function calculateStats(results: ReconciliationResult[]): ReconciliationStats {
  const matched = results.filter((r) => r.MATCH_STATUS === 'MATCHED').length;
  const edcOnly = results.filter((r) => r.MATCH_STATUS === 'EDC_ONLY').length;
  const labOnly = results.filter((r) => r.MATCH_STATUS === 'LAB_ONLY').length;
  const dateMismatches = results.filter(
    (r) => r.MATCH_STATUS === 'MATCHED' && r.DATE_MATCH === 'MISMATCH'
  ).length;
  const perfectMatches = results.filter(
    (r) => r.MATCH_STATUS === 'MATCHED' && r.DATE_MATCH === 'MATCH'
  ).length;

  const subjectGaps = generateSubjectGaps(results);

  return {
    totalRecords: results.length,
    matched,
    edcOnly,
    labOnly,
    dateMismatches,
    perfectMatches,
    subjectGaps: {
      edcOnly: subjectGaps.filter((g) => g.GAP_TYPE === 'EDC_ONLY').length,
      labOnly: subjectGaps.filter((g) => g.GAP_TYPE === 'LAB_ONLY').length,
    },
  };
}
