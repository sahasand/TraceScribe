// Pre-extracted demo data from Query Status Report
// Source: Sample EDC export data

import type {
  QueryRecord,
  QueryStats,
  SiteMetrics,
  AgeBin,
  StatusDistribution,
  FormMetrics,
} from '../types';

export const DEMO_QUERIES: QueryRecord[] = [
  {
    Site: "02 - Site Beta",
    Subject: "01-001",
    Form: "Visit 1 (Day 1)",
    QueryID: "111",
    QueryText: "Please clarify. Source indicates the Day 1 visit date was 17JAN2025, please review and clarify.",
    Age: 0,
    Status: "Closed"
  },
  {
    Site: "03 - Site Gamma",
    Subject: "01-001",
    Form: "SoT Diagnostic Evaluation",
    QueryID: "121",
    QueryText: "Please clarify. Please enter date to complete page.",
    Age: 26,
    Status: "Open"
  },
  {
    Site: "04 - Site Delta",
    Subject: "01-001",
    Form: "Visit 1 (Day 1)",
    QueryID: "130",
    QueryText: "Please clarify. Per comment for the Screening Vitals EDC Page, Screening and Day 1 done on same day",
    Age: 42,
    Status: "Closed"
  },
  {
    Site: "05 - Site Epsilon",
    Subject: "01-001",
    Form: "Screening (Day -30)-Symptoms or Reason for Suspicion of Cardiac Amyloidosis",
    QueryID: "145",
    QueryText: "Source indicates Echo also performed on 1/3/25. Please review and clarify",
    Age: 7,
    Status: "Closed"
  },
  {
    Site: "06 - Site Zeta",
    Subject: "01-001",
    Form: "Screening (Day -30)-Symptoms or Reason for Suspicion of Cardiac Amyloidosis",
    QueryID: "146",
    QueryText: "Source indicates history of stroke. Please review and add to EDC as appropriate.",
    Age: 5,
    Status: "Closed"
  },
  {
    Site: "02 - Site Beta",
    Subject: "01-001",
    Form: "Screening (Day -30)-NYHA Classification",
    QueryID: "147",
    QueryText: "Please review and update data entry",
    Age: 15,
    Status: "Closed"
  },
  {
    Site: "03 - Site Gamma",
    Subject: "01-001",
    Form: "Medical History-Medical History",
    QueryID: "154",
    QueryText: "Please confirm if the response entered is correct. If correct, month/year for this condition can be",
    Age: 16,
    Status: "Closed"
  },
  {
    Site: "04 - Site Delta",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "155",
    QueryText: "Please confirm if the response entered is correct. If correct, month/year for this condition can be",
    Age: 7,
    Status: "Closed"
  },
  {
    Site: "05 - Site Epsilon",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "156",
    QueryText: "Please confirm if the entered indication is correct. Please ensure to enter the actual medication co",
    Age: 7,
    Status: "Open"
  },
  {
    Site: "06 - Site Zeta",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "157",
    QueryText: "Please confirm if the entered indication is correct. Please ensure to enter the actual medication co",
    Age: 7,
    Status: "Open"
  },
  {
    Site: "02 - Site Beta",
    Subject: "01-001",
    Form: "Screening (Day -30)-12-Lead ECG",
    QueryID: "158",
    QueryText: "Please confirm if the Date of ECG Assessment entered is correct as the date entered is not same as t",
    Age: 7,
    Status: "Closed"
  },
  {
    Site: "03 - Site Gamma",
    Subject: "01-001",
    Form: "Screening (Day -30)-Clinical Laboratory Sample Collection",
    QueryID: "159",
    QueryText: "Please confirm if the Collection Date of Hematology entered is correct as the date entered is not sa",
    Age: 7,
    Status: "Open"
  },
  {
    Site: "04 - Site Delta",
    Subject: "01-001",
    Form: "KCCQ-23-KCCQ",
    QueryID: "163",
    QueryText: "Please confirm if the \"Date of Assessment\" entered is correct as the date entered is not same as the",
    Age: 7,
    Status: "Open"
  },
  {
    Site: "05 - Site Epsilon",
    Subject: "01-001",
    Form: "Screening (Day -30)-NYHA Classification",
    QueryID: "164",
    QueryText: "Please confirm if the Date of Assessment entered is correct as the date entered is not same as the d",
    Age: 7,
    Status: "Closed"
  },
  {
    Site: "06 - Site Zeta",
    Subject: "01-001",
    Form: "Screening (Day -30)-Visit Details",
    QueryID: "166",
    QueryText: "As per note entered \"This date should be 01/15/2025 for screening\", please update the Date of the Sc",
    Age: 7,
    Status: "Open"
  },
  {
    Site: "02 - Site Beta",
    Subject: "01-001",
    Form: "Screening (Day -30)-Eligibility",
    QueryID: "167",
    QueryText: "Please confirm if the date of eligibility criteria assessment was performed is correct. Thank you",
    Age: 48,
    Status: "Open"
  },
  {
    Site: "03 - Site Gamma",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "168",
    QueryText: "Please confirm if the entered indication is correct. Please ensure to enter the actual medication co",
    Age: 56,
    Status: "Closed"
  },
  {
    Site: "04 - Site Delta",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "169",
    QueryText: "Please confirm if the entered indication is correct. Please ensure to enter the actual medication co",
    Age: 29,
    Status: "Closed"
  },
  {
    Site: "05 - Site Epsilon",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "170",
    QueryText: "Please confirm if the entered indication is correct. Please ensure to enter the actual medication co",
    Age: 7,
    Status: "Open"
  },
  {
    Site: "06 - Site Zeta",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "171",
    QueryText: "Please confirm if the entered indication is correct. Please ensure to enter the actual medication co",
    Age: 7,
    Status: "Closed"
  },
  {
    Site: "02 - Site Beta",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "172",
    QueryText: "Please verify the response and confirm if the condition \"Hyperlipidemia\" should be added under Medic",
    Age: 29,
    Status: "Open"
  },
  {
    Site: "03 - Site Gamma",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "173",
    QueryText: "Please verify the response and confirm if the condition \"Atrial fibrillation\" should be added under",
    Age: 29,
    Status: "Open"
  },
  {
    Site: "04 - Site Delta",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "174",
    QueryText: "Please verify the response and confirm if the condition \"Amyloidosis\" should be added under Medical",
    Age: 29,
    Status: "Closed"
  },
  {
    Site: "05 - Site Epsilon",
    Subject: "01-001",
    Form: "Screening (Day -30)",
    QueryID: "180",
    QueryText: "Please clarify. Please complete data entry for page for samples collected and were any abnormal labs",
    Age: 9,
    Status: "Closed"
  },
  {
    Site: "06 - Site Zeta",
    Subject: "01-001",
    Form: "Medical History-Medical History",
    QueryID: "187",
    QueryText: "Coding Query: Please provide the location of Edema and update accordingly, Thank you",
    Age: 5,
    Status: "Closed"
  },
  {
    Site: "02 - Site Beta",
    Subject: "01-001",
    Form: "Medical History-Medical History",
    QueryID: "192",
    QueryText: "As per Query ID:154, please update the ongoing field as applicable. Thank you",
    Age: 11,
    Status: "Closed"
  },
  {
    Site: "03 - Site Gamma",
    Subject: "01-001",
    Form: "Screening (Day -30)",
    QueryID: "194",
    QueryText: "Please enter Vital Signs Collected at Screening on this page as they are needed here along with Heig",
    Age: 0,
    Status: "Closed"
  },
  {
    Site: "04 - Site Delta",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "195",
    QueryText: "Please verify. EMR indicates Atorvastatin 80 mg ended on 1/15/25 and 40 mg started on 1/15/24. Plea",
    Age: 20,
    Status: "Closed"
  },
  {
    Site: "05 - Site Epsilon",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "197",
    QueryText: "EMR indicates Two tablets twice daily. Pls review and make update as needed.",
    Age: 11,
    Status: "Closed"
  },
  {
    Site: "06 - Site Zeta",
    Subject: "01-001",
    Form: "Visit 3 (Day 30)",
    QueryID: "205",
    QueryText: "Please clarify. Please complete Lab collected and clinical significance to complete page data entry.",
    Age: 8,
    Status: "Closed"
  },
  {
    Site: "02 - Site Beta",
    Subject: "01-001",
    Form: "Visit 1 (Day 1)",
    QueryID: "206",
    QueryText: "Please clarify dose amount for KI taken prior to study IP administration (130 mg).",
    Age: 14,
    Status: "Closed"
  },
  {
    Site: "03 - Site Gamma",
    Subject: "01-001",
    Form: "Visit 1 (Day 1)",
    QueryID: "212",
    QueryText: "Please change to 'No' for Pre-Dose vitals as Screening and Day 1 completed on the same day and Vital",
    Age: 8,
    Status: "Closed"
  },
  {
    Site: "04 - Site Delta",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "220",
    QueryText: "Pls review and consider adding AFib to medical history as subject is taking meds for it. Pt had sur",
    Age: 139,
    Status: "Closed"
  },
  {
    Site: "05 - Site Epsilon",
    Subject: "01-001",
    Form: "Screening (Day -30)-Symptoms or Reason for Suspicion of Cardiac Amyloidosis",
    QueryID: "226",
    QueryText: "Please confirm if the Symptom or Reason entered is a duplicate entry as there is another Symptom or",
    Age: 46,
    Status: "Closed"
  },
  {
    Site: "06 - Site Zeta",
    Subject: "01-001",
    Form: "Visit 3 (Day 30)-Subject Checks",
    QueryID: "227",
    QueryText: "Please confirm the response entered is correct, as there is no concomitant Medication form entered f",
    Age: 19,
    Status: "Open"
  },
  {
    Site: "02 - Site Beta",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "259",
    QueryText: "Please confirm if the response entered is correct. If correct, month/year for this condition can be",
    Age: 8,
    Status: "Open"
  },
  {
    Site: "03 - Site Gamma",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "260",
    QueryText: "Please confirm if the response entered is correct. If correct, month/year for this condition can be",
    Age: 8,
    Status: "Closed"
  },
  {
    Site: "04 - Site Delta",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "261",
    QueryText: "Please confirm if the response entered is correct. If correct, month/year for this condition can be",
    Age: 8,
    Status: "Open"
  },
  {
    Site: "05 - Site Epsilon",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "262",
    QueryText: "Please confirm if the response entered is correct. If correct, month/year for this condition can be",
    Age: 7,
    Status: "Closed"
  },
  {
    Site: "06 - Site Zeta",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "263",
    QueryText: "Please confirm if the response entered is correct. If correct, month/year for this condition can be",
    Age: 7,
    Status: "Closed"
  },
  {
    Site: "02 - Site Beta",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "264",
    QueryText: "Pls enter end date",
    Age: 2,
    Status: "Closed"
  },
  {
    Site: "03 - Site Gamma",
    Subject: "01-001",
    Form: "Medical History-Medical History",
    QueryID: "266",
    QueryText: "Please confirm if all Concomitant Medication forms are entered for this medical history. Concomitant",
    Age: 6,
    Status: "Closed"
  },
  {
    Site: "04 - Site Delta",
    Subject: "01-001",
    Form: "Screening (Day -30)-Symptoms or Reason for Suspicion of Cardiac Amyloidosis",
    QueryID: "290",
    QueryText: "As per Query ID: 226, please delete the duplicate reason entered for \"Echocardiogram suggestive of A",
    Age: 14,
    Status: "Closed"
  },
  {
    Site: "05 - Site Epsilon",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "291",
    QueryText: "As Query ID: 265, please proceed to delete MH - Amyloidosis. Thank you",
    Age: 14,
    Status: "Open"
  },
  {
    Site: "06 - Site Zeta",
    Subject: "01-001",
    Form: "Concomitant Procedures-Concomitant Procedures",
    QueryID: "292",
    QueryText: "Please confirm if the \"Indication\" entered is correct. Thank you",
    Age: 28,
    Status: "Closed"
  },
  {
    Site: "02 - Site Beta",
    Subject: "01-001",
    Form: "Medical History-Medical History",
    QueryID: "300",
    QueryText: "As per Query ID: 292, please ADD the procedure for this condition. Thank you",
    Age: 49,
    Status: "Closed"
  },
  {
    Site: "03 - Site Gamma",
    Subject: "01-001",
    Form: "Concomitant Procedures-Concomitant Procedures",
    QueryID: "317",
    QueryText: "Please clarify. As condition occurred prior to study entry, please remove and add to Medical History",
    Age: 42,
    Status: "Closed"
  },
  {
    Site: "04 - Site Delta",
    Subject: "01-001",
    Form: "Medical History-Medical History",
    QueryID: "383",
    QueryText: "As per Query ID: 300, the procedure for this condition has been added; however, the field 'Procedure",
    Age: 14,
    Status: "Closed"
  },
  {
    Site: "05 - Site Epsilon",
    Subject: "01-001",
    Form: "Screening (Day -30)-12-Lead ECG",
    QueryID: "395",
    QueryText: "Please clarify as ECG report lists 1st degree AV block and right bundle branch block.",
    Age: 60,
    Status: "Pending"
  },
  {
    Site: "06 - Site Zeta",
    Subject: "01-001",
    Form: "Visit 1 (Day 1)-PET/CT Scan",
    QueryID: "397",
    QueryText: "Please clarify as this is not documented in the source.",
    Age: 34,
    Status: "Open"
  },
  {
    Site: "02 - Site Beta",
    Subject: "01-001",
    Form: "Medical History-Medical History",
    QueryID: "398",
    QueryText: "Please clarify as Medical History source page lists Start Date of 9/2022.",
    Age: 34,
    Status: "Open"
  },
  {
    Site: "03 - Site Gamma",
    Subject: "01-001",
    Form: "Medical History-Medical History",
    QueryID: "401",
    QueryText: "Please clarify as source Clinical Data Form indicates Edema resolved in 2024.",
    Age: 34,
    Status: "Closed"
  },
  {
    Site: "04 - Site Delta",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "403",
    QueryText: "Please clarify as ConMed source log indicates the dose was 100 mcg.",
    Age: 34,
    Status: "Closed"
  },
  {
    Site: "05 - Site Epsilon",
    Subject: "01-001",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "405",
    QueryText: "Please clarify as medication not listed on Conmed log.",
    Age: 34,
    Status: "Open"
  },
  {
    Site: "06 - Site Zeta",
    Subject: "01-001",
    Form: "Visit 1 (Day 1)-Clinical Laboratory Sample Collection",
    QueryID: "406",
    QueryText: "Please clarify as 'ND\" as labs are entered under Screening.",
    Age: 34,
    Status: "Closed"
  },
  {
    Site: "02 - Site Beta",
    Subject: "01-001",
    Form: "Visit 1 (Day 1)-PET/CT Scan",
    QueryID: "508",
    QueryText: "Please confirm if the response entered is correct. If so, kindly add the Site Image Reader form. Tha",
    Age: 28,
    Status: "Open"
  },
  {
    Site: "03 - Site Gamma",
    Subject: "01-001",
    Form: "Visit 1 (Day 1)-Study Drug Administration",
    QueryID: "549",
    QueryText: "Please clarify as the pre-dose activity is documented as 1.095mCi in the source.",
    Age: 26,
    Status: "Pending"
  },
  {
    Site: "04 - Site Delta",
    Subject: "01-001",
    Form: "Visit 1 (Day 1)-Study Drug Administration",
    QueryID: "551",
    QueryText: "Please clarify as source indicates Dose Volume was 3.11 mL.",
    Age: 26,
    Status: "Pending"
  },
  {
    Site: "05 - Site Epsilon",
    Subject: "01-001",
    Form: "Screening (Day -30)-Clinical Laboratory Sample Collection",
    QueryID: "831",
    QueryText: "Please update this field to NA if Serum ADA results are not provided to your site. Thank you",
    Age: 3,
    Status: "Open"
  },
  {
    Site: "06 - Site Zeta",
    Subject: "01-001",
    Form: "Visit 3 (Day 30)-Clinical Laboratory Sample Collection",
    QueryID: "853",
    QueryText: "Please update this field to NA if Serum ADA results are not provided to your site. Thank you",
    Age: 3,
    Status: "Open"
  },
  {
    Site: "02 - Site Beta",
    Subject: "01-001",
    Form: "SoT Diagnostic Evaluation-PYP/HMDP SPECT Scan",
    QueryID: "913",
    QueryText: "Please confirm that the entered date is correct. Thank you.",
    Age: 3,
    Status: "New"
  },
  {
    Site: "03 - Site Gamma",
    Subject: "01-001",
    Form: "SoT Diagnostic Evaluation-Transthoracic Echocardiogram",
    QueryID: "914",
    QueryText: "Please confirm that the entered date is correct. Thank you.",
    Age: 3,
    Status: "New"
  },
  {
    Site: "04 - Site Delta",
    Subject: "01-001",
    Form: "SoT Diagnostic Evaluation-Cardiac MRI",
    QueryID: "915",
    QueryText: "Please confirm that the entered date is correct. Thank you.",
    Age: 3,
    Status: "New"
  },
  {
    Site: "05 - Site Epsilon",
    Subject: "01-001",
    Form: "SoT Diagnostic Evaluation-Amyloidosis Genetic testing",
    QueryID: "916",
    QueryText: "Please confirm that the entered date is correct. Thank you.",
    Age: 3,
    Status: "New"
  },
  {
    Site: "06 - Site Zeta",
    Subject: "01-002",
    Form: "SoT Diagnostic Evaluation",
    QueryID: "122",
    QueryText: "Please clarify. Please clarify date of cardiac MRI if 06NOV2024 and complete data field.",
    Age: 35,
    Status: "Open"
  },
  {
    Site: "02 - Site Beta",
    Subject: "01-002",
    Form: "Visit 1 (Day 1)",
    QueryID: "129",
    QueryText: "Please clarify. Per comment for the Screening Vitals EDC Page, Screening and Day 1 done on same day",
    Age: 35,
    Status: "Closed"
  },
  {
    Site: "03 - Site Gamma",
    Subject: "01-002",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "175",
    QueryText: "Please confirm if the entered indication is correct. Please ensure to enter the actual medication co",
    Age: 56,
    Status: "Closed"
  },
  {
    Site: "04 - Site Delta",
    Subject: "01-002",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "176",
    QueryText: "Please confirm if the entered indication is correct. Please ensure to enter the actual medication co",
    Age: 29,
    Status: "Open"
  },
  {
    Site: "05 - Site Epsilon",
    Subject: "01-002",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "177",
    QueryText: "Please confirm if the entered indication is correct. Please ensure to enter the actual medication co",
    Age: 29,
    Status: "Open"
  },
  {
    Site: "06 - Site Zeta",
    Subject: "01-002",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "178",
    QueryText: "Please confirm if the entered indication is correct. Please ensure to enter the actual medication co",
    Age: 48,
    Status: "Closed"
  },
  {
    Site: "02 - Site Beta",
    Subject: "01-002",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "179",
    QueryText: "Please confirm if the entered indication is correct. Please ensure to enter the actual medication co",
    Age: 8,
    Status: "Closed"
  },
  {
    Site: "03 - Site Gamma",
    Subject: "01-002",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "180",
    QueryText: "Please confirm if the entered indication is correct. Please ensure to enter the actual medication co",
    Age: 7,
    Status: "Open"
  },
  {
    Site: "01 - Site Alpha",
    Subject: "01-002",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "181",
    QueryText: "Please confirm if the response entered is correct. If correct, month/year for this condition can be",
    Age: 7,
    Status: "Closed"
  },
  {
    Site: "01 - Site Alpha",
    Subject: "01-002",
    Form: "Screening (Day -30)",
    QueryID: "181",
    QueryText: "Please clarify. Please enter remaining data to complete page.",
    Age: 1,
    Status: "Closed"
  },
  {
    Site: "01 - Site Alpha",
    Subject: "01-002",
    Form: "KCCQ-23-KCCQ",
    QueryID: "190",
    QueryText: "Please confirm if the Visit entered is correct. Thank you",
    Age: 40,
    Status: "Closed"
  },
  {
    Site: "01 - Site Alpha",
    Subject: "01-002",
    Form: "Visit 1 (Day 1)",
    QueryID: "195",
    QueryText: "Please clarify dose of 130 mg of KI was administered pre-dose.",
    Age: 8,
    Status: "Closed"
  },
  {
    Site: "01 - Site Alpha",
    Subject: "01-002",
    Form: "Visit 1 (Day 1)",
    QueryID: "196",
    QueryText: "Please clarify if pre-injection does was 1.068 mCi as per source.",
    Age: 0,
    Status: "Open"
  },
  {
    Site: "01 - Site Alpha",
    Subject: "01-002",
    Form: "Screening (Day -30)-12-Lead ECG",
    QueryID: "196",
    QueryText: "Please clarify. ECG report indicates the rate was 64, please review and clarify.",
    Age: 20,
    Status: "Open"
  },
  {
    Site: "01 - Site Alpha",
    Subject: "01-002",
    Form: "SoT Diagnostic Evaluation",
    QueryID: "197",
    QueryText: "Please clarify as EMR indicates the date of the biopsy occurred on 16OCT2024.",
    Age: 14,
    Status: "Closed"
  },
  {
    Site: "01 - Site Alpha",
    Subject: "01-002",
    Form: "SoT Diagnostic Evaluation",
    QueryID: "198",
    QueryText: "Please clarify as EMR indicates in note from MRI the addendum from Mayo was dated 16DEC2024.",
    Age: 14,
    Status: "Closed"
  },
  {
    Site: "01 - Site Alpha",
    Subject: "01-002",
    Form: "SoT Diagnostic Evaluation",
    QueryID: "199",
    QueryText: "Please have PI clarify LV native T1 result as there are multiple measurements depending on location",
    Age: 74,
    Status: "Open"
  },
  {
    Site: "01 - Site Alpha",
    Subject: "01-002",
    Form: "SoT Diagnostic Evaluation",
    QueryID: "200",
    QueryText: "Please clarify this was performed as unable to locate in MRI report this result.",
    Age: 29,
    Status: "Open"
  },
  {
    Site: "01 - Site Alpha",
    Subject: "01-002",
    Form: "Visit 1 (Day 1)",
    QueryID: "210",
    QueryText: "Please clarify as the IP label indicates the dose (activity) was 1 mCi.",
    Age: 8,
    Status: "Closed"
  },
  {
    Site: "01 - Site Alpha",
    Subject: "01-002",
    Form: "Visit 1 (Day 1)",
    QueryID: "211",
    QueryText: "Please change to 'No' as Screening and Day 1 completed the same day.",
    Age: 8,
    Status: "Open"
  },
  {
    Site: "01 - Site Alpha",
    Subject: "01-002",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "241",
    QueryText: "Please confirm if the Indication entered is a \"Medical History\" or an \"Adverse Event\" and add the fo",
    Age: 8,
    Status: "Closed"
  },
  {
    Site: "01 - Site Alpha",
    Subject: "01-002",
    Form: "Prior & Concomitant Medications-Prior and Concomitant Medications",
    QueryID: "242",
    QueryText: "Please confirm if the Indication entered is a \"Medical History\" or an \"Adverse Event\" and add the fo",
    Age: 8,
    Status: "Open"
  },
  {
    Site: "01 - Site Alpha",
    Subject: "01-002",
    Form: "Visit 1 (Day 1)",
    QueryID: "257",
    QueryText: "Please clarify as done same day as Screening, enter as 'ND'.",
    Age: 15,
    Status: "Open"
  },
];

// Pre-calculated statistics
export const DEMO_STATS: QueryStats = {
  totalQueries: 87,
  openQueries: 38,     // 31 Open + 3 Pending + 4 New = 38
  closedQueries: 49,   // 49 Closed
  avgAge: 18,          // Average age across all queries
  openRate: 44,        // 38/87 * 100 ≈ 9%
  closedRate: 56,      // 49/87 * 100 ≈ 91%
};

// Pre-calculated site metrics (6 sites in demo data, ~14-15 queries each)
export const DEMO_SITE_METRICS: SiteMetrics[] = [
  {
    site: "01 - Site Alpha",
    open: 6,
    closed: 9,
    total: 15,
  },
  {
    site: "02 - Site Beta",
    open: 7,
    closed: 7,
    total: 14,
  },
  {
    site: "03 - Site Gamma",
    open: 6,
    closed: 8,
    total: 14,
  },
  {
    site: "04 - Site Delta",
    open: 7,
    closed: 8,
    total: 15,
  },
  {
    site: "05 - Site Epsilon",
    open: 6,
    closed: 8,
    total: 14,
  },
  {
    site: "06 - Site Zeta",
    open: 6,
    closed: 9,
    total: 15,
  },
];

// Pre-calculated status distribution
export const DEMO_STATUS_DISTRIBUTION: StatusDistribution[] = [
  { status: "Closed", count: 49 },
  { status: "Pending", count: 3 },
  { status: "New", count: 4 },
  { status: "Open", count: 31 },
];

// Pre-calculated age bins (based on open queries only: 8 open queries)
export const DEMO_AGE_BINS: AgeBin[] = [
  { range: "0-7 days", count: 2 },      // 3 days (2 New queries)
  { range: "8-14 days", count: 0 },
  { range: "15-30 days", count: 3 },    // 26, 26, 26 days (Pending queries)
  { range: "31-60 days", count: 2 },    // 34, 60 days
  { range: "61-90 days", count: 1 },    // 74 days (1 Open query)
  { range: "90+ days", count: 0 },
];

// Pre-calculated top forms (top 8 by frequency)
export const DEMO_TOP_FORMS: FormMetrics[] = [
  { form: "Prior & Concomitant Medications-Prior and Concomitant Medications", count: 35 },
  { form: "Medical History-Medical History", count: 8 },
  { form: "Visit 1 (Day 1)", count: 11 },
  { form: "Screening (Day -30)", count: 3 },
  { form: "SoT Diagnostic Evaluation", count: 9 },
  { form: "Screening (Day -30)-Symptoms or Reason for Suspicion of Cardiac Amyloidosis", count: 3 },
  { form: "Screening (Day -30)-12-Lead ECG", count: 3 },
  { form: "Visit 3 (Day 30)", count: 2 },
];
