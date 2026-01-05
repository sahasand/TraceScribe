/**
 * TypeScript interfaces for Top-line Results Dashboard
 * Clinical trial Phase 3 data structures
 */

// ============================================================================
// Study Metadata
// ============================================================================

export interface StudyInfo {
  studyTitle: string;
  indication: string;
  phase: string;
  sponsor: string;
  studyDuration: string;
  primaryEndpoint: string;
  databaseLockDate: string;
  enrollmentPeriod: string;
  treatmentArms: TreatmentArm[];
}

export interface TreatmentArm {
  name: string;           // "Drug X 10mg" | "Placebo"
  n: number;              // 150
  color: string;          // "#14b8a6" (teal) | "#f97316" (orange)
}

// ============================================================================
// Demographics
// ============================================================================

export interface DemographicsData {
  baseline: BaselineCharacteristics;
}

export interface BaselineCharacteristics {
  age: AgeStatistics;
  ageGroups: AgeGroup[];
  sex: SexDistribution;
  race: RaceDistribution[];
  ethnicity: EthnicityDistribution[];
  weight: WeightStatistics;
  bmi: BMIStatistics;
  baselineDisease: BaselineDiseaseCharacteristics;
}

export interface AgeStatistics {
  mean: { drugX: number; placebo: number };
  sd: { drugX: number; placebo: number };
  median: { drugX: number; placebo: number };
  min: number;
  max: number;
}

export interface AgeGroup {
  range: string;          // "18-44" | "45-64" | "65-74" | "75+"
  drugX: number;
  drugXPct: number;
  placebo: number;
  placeboPct: number;
}

export interface SexDistribution {
  male: { drugX: number; drugXPct: number; placebo: number; placeboPct: number };
  female: { drugX: number; drugXPct: number; placebo: number; placeboPct: number };
}

export interface RaceDistribution {
  category: string;       // "White" | "Black" | "Asian" | "Other"
  drugX: number;
  drugXPct: number;
  placebo: number;
  placeboPct: number;
}

export interface EthnicityDistribution {
  category: string;       // "Hispanic or Latino" | "Not Hispanic or Latino" | "Unknown"
  drugX: number;
  drugXPct: number;
  placebo: number;
  placeboPct: number;
}

export interface WeightStatistics {
  mean: { drugX: number; placebo: number };
  sd: { drugX: number; placebo: number };
}

export interface BMIStatistics {
  mean: { drugX: number; placebo: number };
  sd: { drugX: number; placebo: number };
}

export interface BaselineDiseaseCharacteristics {
  nyhaClass: NYHADistribution[];
  ejectionFraction: EjectionFractionStatistics;
  ntProBNP: NTProBNPStatistics;
}

export interface NYHADistribution {
  class: string;          // "II" | "III" | "IV"
  drugX: number;
  drugXPct: number;
  placebo: number;
  placeboPct: number;
}

export interface EjectionFractionStatistics {
  mean: { drugX: number; placebo: number };
  sd: { drugX: number; placebo: number };
}

export interface NTProBNPStatistics {
  median: { drugX: number; placebo: number };
  q1: { drugX: number; placebo: number };
  q3: { drugX: number; placebo: number };
}

// ============================================================================
// Efficacy
// ============================================================================

export interface EfficacyData {
  primaryEndpoint: EndpointResult;
  secondaryEndpoints: EndpointResult[];
  forestPlotData: ForestPlotData[];
}

export interface EndpointResult {
  endpoint: string;
  endpointType: 'primary' | 'secondary';
  description: string;
  drugXResult: string;
  placeboResult: string;
  effectSize: string;
  ci95: string;
  pValue: number;
  significant: boolean;
}

export interface ForestPlotData {
  endpoint: string;
  endpointType: 'primary' | 'secondary';
  effectType: 'HR' | 'OR' | 'MD' | 'RR' | 'PCT';  // Hazard Ratio | Odds Ratio | Mean Difference | Risk Ratio | Percent Change
  effectSize: number;
  ci95Lower: number;
  ci95Upper: number;
  pValue: number;
  favors: 'drug' | 'placebo';
  significant: boolean;
}

// ============================================================================
// Safety - Overall Structure
// ============================================================================

export interface SafetyData {
  overallSummary: AESummaryData[];
  commonAEs: CommonAE[];
  saesBySOC: SAEBySOC[];
  aeDiscontinuation: AEDiscontinuation[];
  deaths: DeathData[];
  grade34AEs: Grade34AE[];
  aesi: AESI[];
  labAbnormalities: LabAbnormality[];
  vitalSignChanges: VitalSignChange[];
  ecgFindings: ECGFinding[];
}

// ============================================================================
// Safety - Table 1: Overall AE Summary
// ============================================================================

export interface AESummaryData {
  category: string;       // "Any TEAE" | "Treatment-related TEAE" | "Serious AE" | "Death" | "AE leading to D/C"
  drugX: { n: number; pct: number };
  placebo: { n: number; pct: number };
}

// ============================================================================
// Safety - Table 2: Most Common AEs (≥5% in any arm)
// ============================================================================

export interface CommonAE {
  rank: number;
  preferredTerm: string;
  soc: string;            // System Organ Class
  drugX: { n: number; pct: number };
  placebo: { n: number; pct: number };
}

// ============================================================================
// Safety - Table 3: SAEs by SOC
// ============================================================================

export interface SAEBySOC {
  soc: string;            // System Organ Class
  drugX: { n: number; pct: number };
  placebo: { n: number; pct: number };
}

// ============================================================================
// Safety - Table 4: AEs Leading to Discontinuation
// ============================================================================

export interface AEDiscontinuation {
  preferredTerm: string;
  soc: string;
  drugX: { n: number; pct: number };
  placebo: { n: number; pct: number };
}

// ============================================================================
// Safety - Table 5: Deaths (On-treatment + 30-day Follow-up)
// ============================================================================

export interface DeathData {
  category: string;       // "On-treatment deaths" | "Deaths within 30 days" | "Primary cause: CV" | etc.
  drugX: { n: number; pct: number };
  placebo: { n: number; pct: number };
}

// ============================================================================
// Safety - Table 6: Grade 3-4 AEs
// ============================================================================

export interface Grade34AE {
  preferredTerm: string;
  soc: string;
  grade: '3' | '4';
  drugX: { n: number; pct: number };
  placebo: { n: number; pct: number };
}

// ============================================================================
// Safety - Table 7: Adverse Events of Special Interest (AESI)
// ============================================================================

export interface AESI {
  category: string;       // "Hypotension events" | "Renal dysfunction" | "Hyperkalemia" | "Angioedema"
  drugX: { n: number; pct: number };
  placebo: { n: number; pct: number };
}

// ============================================================================
// Safety - Table 8: Laboratory Abnormalities
// ============================================================================

export interface LabAbnormality {
  parameter: string;      // "Creatinine >2x ULN" | "Potassium >5.5 mEq/L" | "Hemoglobin <10 g/dL" | etc.
  drugX: { n: number; pct: number };
  placebo: { n: number; pct: number };
}

// ============================================================================
// Safety - Table 9: Vital Sign Changes from Baseline
// ============================================================================

export interface VitalSignChange {
  parameter: string;      // "SBP decrease >20 mmHg" | "HR increase >15 bpm" | etc.
  drugX: { n: number; pct: number };
  placebo: { n: number; pct: number };
}

// ============================================================================
// Safety - Table 10: Cardiac Safety / ECG Findings
// ============================================================================

export interface ECGFinding {
  finding: string;        // "QTcF >500 ms" | "QTcF increase >60 ms" | "New LBBB" | "AF/Flutter"
  drugX: { n: number; pct: number };
  placebo: { n: number; pct: number };
}

// ============================================================================
// UI State Types
// ============================================================================

export type AppMode = 'initial' | 'demo-loading' | 'demo';

export type SafetyTab = 'overall' | 'common' | 'saes' | 'discontinuation' | 'deaths' | 'grade34' | 'aesi' | 'labs' | 'vitals' | 'ecg';

export interface LoadingStep {
  step: number;
  label: string;
  detail: string;
  delay: number;
}
