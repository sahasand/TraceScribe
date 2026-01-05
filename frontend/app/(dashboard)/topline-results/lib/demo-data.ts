/**
 * Pre-calculated demo data for Top-line Results Dashboard
 * Phase 3 RCT: Drug X 10mg vs Placebo in Heart Failure with Reduced Ejection Fraction (HFrEF)
 * N=300 (150 per arm), 24-week study, Jan-Jun 2025
 */

import type {
  StudyInfo,
  DemographicsData,
  EfficacyData,
  SafetyData,
  LoadingStep,
  AgeGroup,
  RaceDistribution,
  EthnicityDistribution,
  NYHADistribution,
  ForestPlotData,
  EndpointResult,
  AESummaryData,
  CommonAE,
  SAEBySOC,
  DeathData,
  Grade34AE,
  AESI,
  LabAbnormality,
  VitalSignChange,
  ECGFinding,
  AEDiscontinuation,
} from '../types';

// ============================================================================
// Study Metadata
// ============================================================================

export const DEMO_STUDY_INFO: StudyInfo = {
  studyTitle: "TRS-HF-301: A Phase 3, Randomized, Double-Blind, Placebo-Controlled Study of Drug X in Heart Failure",
  indication: "Heart Failure with Reduced Ejection Fraction (HFrEF)",
  phase: "Phase 3",
  sponsor: "TraceScribe Therapeutics",
  studyDuration: "24 weeks",
  primaryEndpoint: "Change from baseline in 6-Minute Walk Test (6MWT) distance at Week 24",
  databaseLockDate: "June 30, 2025",
  enrollmentPeriod: "January 2025 - June 2025",
  treatmentArms: [
    { name: "Drug X 10mg", n: 150, color: "#14b8a6" },
    { name: "Placebo", n: 150, color: "#f97316" },
  ],
};

// ============================================================================
// Demographics - Baseline Characteristics
// ============================================================================

const AGE_GROUPS: AgeGroup[] = [
  { range: "18-44", drugX: 22, drugXPct: 14.7, placebo: 23, placeboPct: 15.3 },
  { range: "45-64", drugX: 64, drugXPct: 42.7, placebo: 62, placeboPct: 41.3 },
  { range: "65-74", drugX: 44, drugXPct: 29.3, placebo: 46, placeboPct: 30.7 },
  { range: "75+", drugX: 20, drugXPct: 13.3, placebo: 19, placeboPct: 12.7 },
];

const RACE_DISTRIBUTION: RaceDistribution[] = [
  { category: "White", drugX: 109, drugXPct: 72.7, placebo: 107, placeboPct: 71.3 },
  { category: "Black or African American", drugX: 26, drugXPct: 17.3, placebo: 28, placeboPct: 18.7 },
  { category: "Asian", drugX: 12, drugXPct: 8.0, placebo: 11, placeboPct: 7.3 },
  { category: "Other", drugX: 3, drugXPct: 2.0, placebo: 4, placeboPct: 2.7 },
];

const ETHNICITY_DISTRIBUTION: EthnicityDistribution[] = [
  { category: "Hispanic or Latino", drugX: 18, drugXPct: 12.0, placebo: 21, placeboPct: 14.0 },
  { category: "Not Hispanic or Latino", drugX: 130, drugXPct: 86.7, placebo: 127, placeboPct: 84.7 },
  { category: "Unknown", drugX: 2, drugXPct: 1.3, placebo: 2, placeboPct: 1.3 },
];

const NYHA_CLASS_DISTRIBUTION: NYHADistribution[] = [
  { class: "II", drugX: 68, drugXPct: 45.3, placebo: 67, placeboPct: 44.7 },
  { class: "III", drugX: 74, drugXPct: 49.3, placebo: 76, placeboPct: 50.7 },
  { class: "IV", drugX: 8, drugXPct: 5.3, placebo: 7, placeboPct: 4.7 },
];

export const DEMO_DEMOGRAPHICS: DemographicsData = {
  baseline: {
    age: {
      mean: { drugX: 63.8, placebo: 64.2 },
      sd: { drugX: 11.8, placebo: 12.1 },
      median: { drugX: 65.0, placebo: 66.0 },
      min: 28,
      max: 89,
    },
    ageGroups: AGE_GROUPS,
    sex: {
      male: { drugX: 98, drugXPct: 65.3, placebo: 97, placeboPct: 64.7 },
      female: { drugX: 52, drugXPct: 34.7, placebo: 53, placeboPct: 35.3 },
    },
    race: RACE_DISTRIBUTION,
    ethnicity: ETHNICITY_DISTRIBUTION,
    weight: {
      mean: { drugX: 82.4, placebo: 83.1 },
      sd: { drugX: 16.2, placebo: 15.8 },
    },
    bmi: {
      mean: { drugX: 28.7, placebo: 29.1 },
      sd: { drugX: 5.4, placebo: 5.6 },
    },
    baselineDisease: {
      nyhaClass: NYHA_CLASS_DISTRIBUTION,
      ejectionFraction: {
        mean: { drugX: 27.8, placebo: 28.2 },
        sd: { drugX: 6.1, placebo: 6.3 },
      },
      ntProBNP: {
        median: { drugX: 1820, placebo: 1880 },
        q1: { drugX: 1180, placebo: 1220 },
        q3: { drugX: 2790, placebo: 2850 },
      },
    },
  },
};

// ============================================================================
// Efficacy Results
// ============================================================================

const PRIMARY_ENDPOINT: EndpointResult = {
  endpoint: "Primary: 6MWT Change from Baseline",
  endpointType: 'primary',
  description: "Change in 6-Minute Walk Test distance (meters) at Week 24",
  drugXResult: "+45.2m (SD 38.1)",
  placeboResult: "+18.5m (SD 35.7)",
  effectSize: "MD +26.7m",
  ci95: "(20.1, 33.3)",
  pValue: 0.0001,
  significant: true,
};

const SECONDARY_ENDPOINTS: EndpointResult[] = [
  {
    endpoint: "NYHA Class Improvement",
    endpointType: 'secondary',
    description: "≥1 class improvement from baseline at Week 24",
    drugXResult: "68/150 (45.3%)",
    placeboResult: "38/150 (25.3%)",
    effectSize: "OR 2.15",
    ci95: "(1.35, 3.42)",
    pValue: 0.001,
    significant: true,
  },
  {
    endpoint: "CV Death or HF Hospitalization",
    endpointType: 'secondary',
    description: "Time to first event (24-week period)",
    drugXResult: "14/150 (9.3%)",
    placeboResult: "22/150 (14.7%)",
    effectSize: "HR 0.62",
    ci95: "(0.35, 1.10)",
    pValue: 0.098,
    significant: false,
  },
  {
    endpoint: "KCCQ Total Symptom Score Change",
    endpointType: 'secondary',
    description: "Kansas City Cardiomyopathy Questionnaire change from baseline",
    drugXResult: "+12.8 (SD 15.2)",
    placeboResult: "+6.3 (SD 14.8)",
    effectSize: "MD +6.5",
    ci95: "(3.1, 9.9)",
    pValue: 0.0002,
    significant: true,
  },
  {
    endpoint: "NT-proBNP Percent Change",
    endpointType: 'secondary',
    description: "Percent change from baseline in NT-proBNP at Week 24",
    drugXResult: "-28.3% (SD 24.5)",
    placeboResult: "-12.1% (SD 22.8)",
    effectSize: "-16.2% difference",
    ci95: "(-21.3, -11.1)",
    pValue: 0.002,
    significant: true,
  },
];

export const DEMO_FOREST_PLOT_DATA: ForestPlotData[] = [
  {
    endpoint: "6MWT Change",
    endpointType: 'primary',
    effectType: 'MD',
    effectSize: 26.7,
    ci95Lower: 20.1,
    ci95Upper: 33.3,
    pValue: 0.0001,
    favors: 'drug',
    significant: true,
  },
  {
    endpoint: "NYHA Improvement",
    endpointType: 'secondary',
    effectType: 'OR',
    effectSize: 2.15,
    ci95Lower: 1.35,
    ci95Upper: 3.42,
    pValue: 0.001,
    favors: 'drug',
    significant: true,
  },
  {
    endpoint: "CV Death/HF Hosp",
    endpointType: 'secondary',
    effectType: 'HR',
    effectSize: 0.62,
    ci95Lower: 0.35,
    ci95Upper: 1.10,
    pValue: 0.098,
    favors: 'drug',
    significant: false,
  },
  {
    endpoint: "KCCQ Change",
    endpointType: 'secondary',
    effectType: 'MD',
    effectSize: 6.5,
    ci95Lower: 3.1,
    ci95Upper: 9.9,
    pValue: 0.0002,
    favors: 'drug',
    significant: true,
  },
  {
    endpoint: "NT-proBNP % Change",
    endpointType: 'secondary',
    effectType: 'PCT',
    effectSize: -16.2,
    ci95Lower: -21.3,
    ci95Upper: -11.1,
    pValue: 0.002,
    favors: 'drug',
    significant: true,
  },
];

export const DEMO_EFFICACY: EfficacyData = {
  primaryEndpoint: PRIMARY_ENDPOINT,
  secondaryEndpoints: SECONDARY_ENDPOINTS,
  forestPlotData: DEMO_FOREST_PLOT_DATA,
};

// ============================================================================
// Safety - Table 1: Overall AE Summary
// ============================================================================

const OVERALL_AE_SUMMARY: AESummaryData[] = [
  {
    category: "Any TEAE",
    drugX: { n: 117, pct: 78.0 },
    placebo: { n: 107, pct: 71.3 },
  },
  {
    category: "Treatment-related TEAE",
    drugX: { n: 63, pct: 42.0 },
    placebo: { n: 42, pct: 28.0 },
  },
  {
    category: "Serious AE",
    drugX: { n: 23, pct: 15.3 },
    placebo: { n: 29, pct: 19.3 },
  },
  {
    category: "Death",
    drugX: { n: 3, pct: 2.0 },
    placebo: { n: 4, pct: 2.7 },
  },
  {
    category: "AE leading to discontinuation",
    drugX: { n: 12, pct: 8.0 },
    placebo: { n: 9, pct: 6.0 },
  },
];

// ============================================================================
// Safety - Table 2: Most Common AEs (≥5% in any arm)
// ============================================================================

const COMMON_AES: CommonAE[] = [
  {
    rank: 1,
    preferredTerm: "Headache",
    soc: "Nervous system disorders",
    drugX: { n: 27, pct: 18.0 },
    placebo: { n: 18, pct: 12.0 },
  },
  {
    rank: 2,
    preferredTerm: "Dizziness",
    soc: "Nervous system disorders",
    drugX: { n: 21, pct: 14.0 },
    placebo: { n: 14, pct: 9.3 },
  },
  {
    rank: 3,
    preferredTerm: "Nausea",
    soc: "Gastrointestinal disorders",
    drugX: { n: 18, pct: 12.0 },
    placebo: { n: 12, pct: 8.0 },
  },
  {
    rank: 4,
    preferredTerm: "Fatigue",
    soc: "General disorders",
    drugX: { n: 17, pct: 11.3 },
    placebo: { n: 15, pct: 10.0 },
  },
  {
    rank: 5,
    preferredTerm: "Diarrhea",
    soc: "Gastrointestinal disorders",
    drugX: { n: 14, pct: 9.3 },
    placebo: { n: 11, pct: 7.3 },
  },
  {
    rank: 6,
    preferredTerm: "Upper respiratory tract infection",
    soc: "Infections and infestations",
    drugX: { n: 12, pct: 8.0 },
    placebo: { n: 13, pct: 8.7 },
  },
  {
    rank: 7,
    preferredTerm: "Hypotension",
    soc: "Vascular disorders",
    drugX: { n: 11, pct: 7.3 },
    placebo: { n: 6, pct: 4.0 },
  },
  {
    rank: 8,
    preferredTerm: "Cough",
    soc: "Respiratory disorders",
    drugX: { n: 9, pct: 6.0 },
    placebo: { n: 8, pct: 5.3 },
  },
  {
    rank: 9,
    preferredTerm: "Peripheral edema",
    soc: "General disorders",
    drugX: { n: 8, pct: 5.3 },
    placebo: { n: 9, pct: 6.0 },
  },
  {
    rank: 10,
    preferredTerm: "Back pain",
    soc: "Musculoskeletal disorders",
    drugX: { n: 7, pct: 4.7 },
    placebo: { n: 6, pct: 4.0 },
  },
];

// ============================================================================
// Safety - Table 3: SAEs by SOC
// ============================================================================

const SAES_BY_SOC: SAEBySOC[] = [
  {
    soc: "Cardiac disorders",
    drugX: { n: 12, pct: 8.0 },
    placebo: { n: 16, pct: 10.7 },
  },
  {
    soc: "Infections and infestations",
    drugX: { n: 5, pct: 3.3 },
    placebo: { n: 7, pct: 4.7 },
  },
  {
    soc: "Respiratory disorders",
    drugX: { n: 3, pct: 2.0 },
    placebo: { n: 4, pct: 2.7 },
  },
  {
    soc: "Vascular disorders",
    drugX: { n: 2, pct: 1.3 },
    placebo: { n: 1, pct: 0.7 },
  },
  {
    soc: "Renal and urinary disorders",
    drugX: { n: 1, pct: 0.7 },
    placebo: { n: 1, pct: 0.7 },
  },
];

// ============================================================================
// Safety - Table 4: AEs Leading to Discontinuation
// ============================================================================

const AE_DISCONTINUATION: AEDiscontinuation[] = [
  {
    preferredTerm: "Hypotension",
    soc: "Vascular disorders",
    drugX: { n: 4, pct: 2.7 },
    placebo: { n: 2, pct: 1.3 },
  },
  {
    preferredTerm: "Dizziness",
    soc: "Nervous system disorders",
    drugX: { n: 3, pct: 2.0 },
    placebo: { n: 1, pct: 0.7 },
  },
  {
    preferredTerm: "Worsening heart failure",
    soc: "Cardiac disorders",
    drugX: { n: 2, pct: 1.3 },
    placebo: { n: 3, pct: 2.0 },
  },
  {
    preferredTerm: "Renal impairment",
    soc: "Renal and urinary disorders",
    drugX: { n: 2, pct: 1.3 },
    placebo: { n: 1, pct: 0.7 },
  },
  {
    preferredTerm: "Nausea",
    soc: "Gastrointestinal disorders",
    drugX: { n: 1, pct: 0.7 },
    placebo: { n: 2, pct: 1.3 },
  },
];

// ============================================================================
// Safety - Table 5: Deaths
// ============================================================================

const DEATHS: DeathData[] = [
  {
    category: "On-treatment deaths",
    drugX: { n: 2, pct: 1.3 },
    placebo: { n: 3, pct: 2.0 },
  },
  {
    category: "Deaths within 30 days of last dose",
    drugX: { n: 3, pct: 2.0 },
    placebo: { n: 4, pct: 2.7 },
  },
  {
    category: "Primary cause: Cardiovascular",
    drugX: { n: 2, pct: 1.3 },
    placebo: { n: 3, pct: 2.0 },
  },
  {
    category: "Primary cause: Sudden cardiac death",
    drugX: { n: 1, pct: 0.7 },
    placebo: { n: 2, pct: 1.3 },
  },
  {
    category: "Primary cause: Heart failure",
    drugX: { n: 0, pct: 0.0 },
    placebo: { n: 1, pct: 0.7 },
  },
  {
    category: "Primary cause: Infection",
    drugX: { n: 0, pct: 0.0 },
    placebo: { n: 1, pct: 0.7 },
  },
  {
    category: "Primary cause: Other",
    drugX: { n: 1, pct: 0.7 },
    placebo: { n: 0, pct: 0.0 },
  },
];

// ============================================================================
// Safety - Table 6: Grade 3-4 AEs
// ============================================================================

const GRADE_34_AES: Grade34AE[] = [
  {
    preferredTerm: "Hypotension",
    soc: "Vascular disorders",
    grade: '3',
    drugX: { n: 5, pct: 3.3 },
    placebo: { n: 2, pct: 1.3 },
  },
  {
    preferredTerm: "Hyperkalemia",
    soc: "Metabolism disorders",
    grade: '3',
    drugX: { n: 3, pct: 2.0 },
    placebo: { n: 1, pct: 0.7 },
  },
  {
    preferredTerm: "Acute kidney injury",
    soc: "Renal and urinary disorders",
    grade: '3',
    drugX: { n: 2, pct: 1.3 },
    placebo: { n: 3, pct: 2.0 },
  },
  {
    preferredTerm: "Syncope",
    soc: "Nervous system disorders",
    grade: '3',
    drugX: { n: 2, pct: 1.3 },
    placebo: { n: 1, pct: 0.7 },
  },
];

// ============================================================================
// Safety - Table 7: Adverse Events of Special Interest (AESI)
// ============================================================================

const AESI: AESI[] = [
  {
    category: "Hypotension events (SBP <90 mmHg)",
    drugX: { n: 18, pct: 12.0 },
    placebo: { n: 9, pct: 6.0 },
  },
  {
    category: "Renal dysfunction (Cr increase ≥0.5 mg/dL)",
    drugX: { n: 14, pct: 9.3 },
    placebo: { n: 12, pct: 8.0 },
  },
  {
    category: "Hyperkalemia (K+ >5.5 mEq/L)",
    drugX: { n: 11, pct: 7.3 },
    placebo: { n: 6, pct: 4.0 },
  },
  {
    category: "Angioedema",
    drugX: { n: 1, pct: 0.7 },
    placebo: { n: 0, pct: 0.0 },
  },
];

// ============================================================================
// Safety - Table 8: Laboratory Abnormalities
// ============================================================================

const LAB_ABNORMALITIES: LabAbnormality[] = [
  {
    parameter: "Creatinine >2× ULN",
    drugX: { n: 8, pct: 5.3 },
    placebo: { n: 7, pct: 4.7 },
  },
  {
    parameter: "Potassium >5.5 mEq/L",
    drugX: { n: 11, pct: 7.3 },
    placebo: { n: 6, pct: 4.0 },
  },
  {
    parameter: "Hemoglobin <10 g/dL",
    drugX: { n: 6, pct: 4.0 },
    placebo: { n: 8, pct: 5.3 },
  },
  {
    parameter: "ALT >3× ULN",
    drugX: { n: 3, pct: 2.0 },
    placebo: { n: 2, pct: 1.3 },
  },
  {
    parameter: "Total bilirubin >2× ULN",
    drugX: { n: 2, pct: 1.3 },
    placebo: { n: 1, pct: 0.7 },
  },
];

// ============================================================================
// Safety - Table 9: Vital Sign Changes from Baseline
// ============================================================================

const VITAL_SIGN_CHANGES: VitalSignChange[] = [
  {
    parameter: "SBP decrease >20 mmHg",
    drugX: { n: 24, pct: 16.0 },
    placebo: { n: 12, pct: 8.0 },
  },
  {
    parameter: "DBP decrease >10 mmHg",
    drugX: { n: 19, pct: 12.7 },
    placebo: { n: 11, pct: 7.3 },
  },
  {
    parameter: "HR increase >15 bpm",
    drugX: { n: 8, pct: 5.3 },
    placebo: { n: 7, pct: 4.7 },
  },
  {
    parameter: "Weight gain >3 kg",
    drugX: { n: 6, pct: 4.0 },
    placebo: { n: 9, pct: 6.0 },
  },
];

// ============================================================================
// Safety - Table 10: Cardiac Safety / ECG Findings
// ============================================================================

const ECG_FINDINGS: ECGFinding[] = [
  {
    finding: "QTcF >500 ms",
    drugX: { n: 3, pct: 2.0 },
    placebo: { n: 2, pct: 1.3 },
  },
  {
    finding: "QTcF increase >60 ms from baseline",
    drugX: { n: 5, pct: 3.3 },
    placebo: { n: 4, pct: 2.7 },
  },
  {
    finding: "New left bundle branch block",
    drugX: { n: 2, pct: 1.3 },
    placebo: { n: 1, pct: 0.7 },
  },
  {
    finding: "Atrial fibrillation/flutter",
    drugX: { n: 7, pct: 4.7 },
    placebo: { n: 8, pct: 5.3 },
  },
];

// ============================================================================
// Complete Safety Data Structure
// ============================================================================

export const DEMO_SAFETY: SafetyData = {
  overallSummary: OVERALL_AE_SUMMARY,
  commonAEs: COMMON_AES,
  saesBySOC: SAES_BY_SOC,
  deaths: DEATHS,
  grade34AEs: GRADE_34_AES,
  aesi: AESI,
  labAbnormalities: LAB_ABNORMALITIES,
  vitalSignChanges: VITAL_SIGN_CHANGES,
  ecgFindings: ECG_FINDINGS,
  aeDiscontinuation: AE_DISCONTINUATION,
};

// ============================================================================
// Loading Animation Steps
// ============================================================================

export const LOADING_STEPS: LoadingStep[] = [
  {
    step: 1,
    label: "Loading study metadata...",
    detail: "Phase 3 RCT • 300 patients • 24 weeks",
    delay: 300,
  },
  {
    step: 2,
    label: "Analyzing baseline demographics...",
    detail: "Age, sex, race, disease characteristics",
    delay: 500,
  },
  {
    step: 3,
    label: "Calculating efficacy endpoints...",
    detail: "Primary + 4 secondary endpoints",
    delay: 800,
  },
  {
    step: 4,
    label: "Processing safety data...",
    detail: "10 key safety tables • 1,200+ AEs coded",
    delay: 600,
  },
  {
    step: 5,
    label: "Complete!",
    detail: "Ready to view top-line results",
    delay: 300,
  },
];

// ============================================================================
// KPI Summary Data (for cards)
// ============================================================================

export const KPI_DATA = {
  totalEnrolled: { value: "300", subtext: "150 per arm", icon: "Users", color: "teal" },
  completionRate: { value: "92%", subtext: "276/300", icon: "CheckCircle2", color: "emerald" },
  studyDuration: { value: "24 weeks", subtext: "Jan-Jun 2025", icon: "Calendar", color: "amber" },
  primaryEndpoint: { value: "p<0.001", subtext: "+26.7m 6MWT", icon: "TrendingUp", color: "teal" },
  anyTEAE: { value: "78%", subtext: "vs 71% placebo", icon: "Activity", color: "orange" },
  seriousAEs: { value: "15%", subtext: "vs 19% (favorable)", icon: "AlertCircle", color: "emerald" },
};
