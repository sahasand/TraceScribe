# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a lab data reconciliation tool for clinical trial AT01-301. It reconciles clinical site metadata (what labs sites reported collecting) with central laboratory test results (what the lab actually received and analyzed) to identify discrepancies at multiple levels: subject, visit, category, and date.

## Running the Reconciliation

**Primary Command:**
```bash
python lab_reconciliation.py
```

This processes both input files and generates timestamped output files:
- `Lab_Reconciliation_Report_YYYYMMDD_HHMMSS.csv` - Comprehensive CSV with all reconciliation results
- `Lab_Reconciliation_Report_YYYYMMDD_HHMMSS.xlsx` - 5-tab Excel workbook with hierarchical gap analysis

**Requirements:**
```bash
pip install pandas openpyxl xlsxwriter
```

## Input Data Files

The script expects two files in the same directory:

1. **`177_LB_22-12-2025.xlsx`** - Site metadata (2,071 records, 195 patients)
   - What sites reported they collected
   - Key fields: PATIENT, SITE, VISITORFORMNAME, LBDAT, LBCAT, LBPERF (Lab Performed Y/N), LBCLSIG (Clinically Significant)

2. **`AT01301_LAB_22Dec2025.csv`** - Central lab results (15,559 test records, 158 patients)
   - Actual test results from Q2 Solutions central laboratory
   - CDISC SDTM LB domain format
   - Key fields: USUBJID, VISIT, LBDTC, LBCAT, LBTESTCD, LBTEST, LBORRES, LBNRIND

## Architecture

### Core Processing Pipeline

1. **Load & Standardize** (`load_metadata()`, `load_lab_data()`)
   - Handle multiple file encodings (UTF-8, Latin-1, CP1252, etc.)
   - Standardize dates: Excel (DD/MMM/YYYY) and ISO (YYYY-MM-DDTHH:MM) → YYYY-MM-DD
   - Normalize visit names ("Screening (Day -30)" vs "Screening (Day-30)")

2. **Aggregate** (`aggregate_lab_data()`)
   - Reduce 15,559 individual lab tests to patient-visit-category level
   - Groups by: PATIENT + VISIT_STD + LBCAT

3. **Reconcile** (`perform_reconciliation()`)
   - **Outer merge on PATIENT + VISIT + LBCAT** (visit-based matching)
   - Flag MATCH_STATUS: "MATCHED", "METADATA_ONLY", "LAB_ONLY"
   - For matched records, compare dates → DATE_MATCH: "MATCH"/"MISMATCH"/"MISSING"
   - Calculate DATE_DIFF_DAYS for date mismatches

4. **Generate Outputs**
   - CSV: All reconciliation records with match status and date comparison
   - Excel: 5-tab hierarchical analysis (Subject → Visit → Category → Date gaps)

### Key Reconciliation Logic

**Matching Key:** `PATIENT + VISIT + LBCAT`

**Why Visit-Based Matching:**
- Allows proper identification of date discrepancies (same visit, different dates)
- Hierarchical gap analysis: subjects → visits → categories → dates
- More intuitive for clinical review

**Date Comparison (Post-Match):**
- For matched records, compares dates from both sources
- DATE_MATCH = "MATCH": Dates are identical
- DATE_MATCH = "MISMATCH": Dates differ (DATE_DIFF_DAYS shows difference)
- DATE_MATCH = "MISSING": One or both dates missing
- DATE_MATCH = "N/A": Record didn't match (METADATA_ONLY or LAB_ONLY)

**Gap Hierarchy:**
1. **Subject Gaps** - Patients entirely missing from one system
2. **Visit Gaps** - For common patients, visits missing from one system
3. **Category Gaps** - For common patient+visit, categories missing from one system
4. **Date Mismatches** - For matched patient+visit+category, dates differ

## Output Report Structure

### CSV Output
**`Lab_Reconciliation_Report_YYYYMMDD_HHMMSS.csv`** - All reconciliation records (2,518 records)

**Key Columns:**
| Column | Description |
|--------|-------------|
| Subject | Patient identifier |
| Site | Clinical site number |
| Visit | Standardized visit name |
| Category | Lab category (Chemistry, Hematology, etc.) |
| Match_Status | MATCHED / METADATA_ONLY / LAB_ONLY |
| Date_Match | MATCH / MISMATCH / MISSING / N/A |
| EDC_Date | Collection date from EDC |
| Lab_Date | Collection date from Lab |
| Date_Diff_Days | Days difference (for mismatches) |

### Excel Output (5 Tabs)
**`Lab_Reconciliation_Report_YYYYMMDD_HHMMSS.xlsx`**

| Tab | Purpose | Current Count |
|-----|---------|---------------|
| **1. Summary** | Overview of all gap types | - |
| **2. Subject Gaps** | Patients missing from EDC or Lab | 39 in EDC only, 2 in Lab only |
| **3. Visit Gaps** | Visits missing for common patients | varies |
| **4. Category Gaps** | Categories missing for common patient+visit | 1,185 EDC only, 447 Lab only |
| **5. Date Mismatches** | Matched records with different dates | 3 |

### Result Summary (Current Data)

```
Subject gaps:
  - In EDC, not in Lab: 39
  - In Lab, not in EDC: 2

Category gaps (PATIENT+VISIT+LBCAT):
  - In EDC, not in Lab: 1,185
  - In Lab, not in EDC: 447
  - Matched: 886

Date mismatches: 3
```

### Using the Output for Analysis

**Filter by Match_Status:**
```
Match_Status = 'MATCHED' AND Date_Match = 'MISMATCH' → Date discrepancies (3)
Match_Status = 'METADATA_ONLY' → In EDC but not in Lab (1,185)
Match_Status = 'LAB_ONLY' → In Lab but not in EDC (447)
```

**Excel tabs answer specific questions:**
- Tab 2: Which patients are completely missing?
- Tab 3: For patients in both, which visits are missing?
- Tab 4: For common patient+visit, which categories are missing?
- Tab 5: For fully matched records, do the dates agree?

## Important Conventions

### Column Naming
- **Internal columns:** Suffix with `_STD` (standardized), `_LAB`, `_ORIG`
- **Output columns:** Underscore-separated (Subject, Match_Status, Date_Match)
- **CDISC columns:** Uppercase (LBDAT, LBCAT, LBPERF, USUBJID, LBDTC)

### Data Categories (LBCAT)
- **Chemistry, Hematology, Urinalysis** - Standard lab panels appearing in both datasets
- **Serum ADA** - Appears primarily in metadata
- **Special Chemistry** - Advanced tests appearing primarily in lab data

### Clinical Trial Context
- Study: AT01-301 (Attralus cardiovascular trial)
- Data flows: Site EDC → Metadata file, Physical samples → Central lab → Lab file
- Reconciliation identifies data quality issues for regulatory compliance

## Modifying the Script

### Changing Matching Logic
Modify `perform_reconciliation()`:
- Current merge key: `left_on=['PATIENT', 'VISIT_STD', 'LBCAT']`
- Change merge keys to adjust matching criteria

### Adding New Output Columns
Modify `create_csv_output()`:
- Add new columns to `final_columns` list
- Add corresponding rename mapping in `column_renames` dictionary

### Handling New Date Formats
Add parsing logic to `standardize_date_from_excel()` or `standardize_date_from_iso()`

### Adding File Encoding Support
Add encoding to list in `load_lab_data()`:
```python
encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252', 'windows-1252']
```

## Common Issues

**Unicode Encoding Errors:**
- The script tries 5 encodings automatically
- Current data uses `latin-1` encoding

**Date Format Mismatches:**
- Metadata uses DD/MMM/YYYY (e.g., "15/JAN/2025")
- Lab uses ISO 8601 (e.g., "2025-01-15T10:35")
- Both standardized to YYYY-MM-DD for comparison

**Visit Name Variations:**
- Script standardizes "Screening (Day -30)" vs "Screening (Day-30)" → "Screening"
- Add new patterns to `standardize_visit_name()` if sites use different formats

## File Paths

Input and output files are defined at top of script:
```python
METADATA_FILE = "177_LB_22-12-2025.xlsx"
LAB_FILE = "AT01301_LAB_22Dec2025.csv"

# Output files are auto-timestamped
TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
OUTPUT_FILE = f"Lab_Reconciliation_Report_{TIMESTAMP}.csv"
EXCEL_OUTPUT_FILE = f"Lab_Reconciliation_Report_{TIMESTAMP}.xlsx"
```

Change METADATA_FILE and LAB_FILE constants to process different data files.
