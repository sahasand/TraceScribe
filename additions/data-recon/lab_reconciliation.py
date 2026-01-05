"""
Lab Data Reconciliation Script
Reconciles clinical site metadata (Excel) with central lab results (CSV)

Matching Logic: PATIENT + VISIT + LBCAT (then compare dates)

Input files:
- 177_LB_22-12-2025.xlsx: Site metadata with lab collection tracking
- AT01301_LAB_22Dec2025.csv: Central lab detailed results

Output (timestamped):
- Lab_Reconciliation_Report_YYYYMMDD_HHMMSS.csv: All reconciliation records
- Lab_Reconciliation_Report_YYYYMMDD_HHMMSS.xlsx: 5-tab hierarchical gap analysis
  1. Summary - Overview of all gap types
  2. Subject Gaps - Patients missing from EDC or Lab
  3. Visit Gaps - Visits missing for common patients
  4. Category Gaps - Categories missing for common patient+visit
  5. Date Mismatches - Matched records with different dates
"""

import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# File paths
METADATA_FILE = "177_LB_22-12-2025.xlsx"
LAB_FILE = "AT01301_LAB_22Dec2025.csv"

# Generate timestamped output file names
TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
OUTPUT_FILE = f"Lab_Reconciliation_Report_{TIMESTAMP}.csv"
EXCEL_OUTPUT_FILE = f"Lab_Reconciliation_Report_{TIMESTAMP}.xlsx"


def load_metadata():
    """Load and preprocess metadata Excel file"""
    print("Loading metadata file...")
    df = pd.read_excel(METADATA_FILE)

    # Standardize column names
    df.columns = df.columns.str.strip()

    # Convert date column
    df['LBDAT_ORIG'] = df['LBDAT'].copy()
    df['LBDAT_STD'] = df['LBDAT'].apply(standardize_date_from_excel)

    # Standardize visit names
    df['VISIT_STD'] = df['VISITORFORMNAME'].apply(standardize_visit_name)

    # Handle LBPERF field
    df['LBPERF_FLAG'] = df['LBPERF'].fillna('').astype(str).str.upper()

    print(f"  Loaded {len(df)} records from metadata file")
    print(f"  Unique patients: {df['PATIENT'].nunique()}")

    return df


def load_lab_data():
    """Load and preprocess central lab CSV file"""
    print("Loading central lab data...")

    # Try different encodings
    encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252', 'windows-1252']
    df = None

    for encoding in encodings:
        try:
            df = pd.read_csv(LAB_FILE, encoding=encoding, low_memory=False)
            print(f"  Successfully loaded with {encoding} encoding")
            break
        except UnicodeDecodeError:
            continue

    if df is None:
        raise ValueError(f"Could not read {LAB_FILE} with any common encoding")

    # Filter out administrative records for main reconciliation
    df_main = df[~df['LBCAT'].isin(['Administrative'])].copy()

    # Convert date column
    df_main['LBDTC_STD'] = df_main['LBDTC'].apply(standardize_date_from_iso)

    # Standardize visit names
    df_main['VISIT_STD'] = df_main['VISIT'].apply(standardize_visit_name)

    # Rename USUBJID to PATIENT for consistency
    df_main['PATIENT'] = df_main['USUBJID']

    print(f"  Loaded {len(df_main)} test records from central lab file")
    print(f"  Unique patients: {df_main['PATIENT'].nunique()}")

    return df_main


def standardize_date_from_excel(date_val):
    """Convert Excel date format to YYYY-MM-DD"""
    if pd.isna(date_val):
        return None
    if isinstance(date_val, str):
        if date_val.upper() in ['ND', 'NOT DONE', '']:
            return None
        try:
            # Try parsing DD/MMM/YYYY format
            dt = pd.to_datetime(date_val, format='%d/%b/%Y', errors='coerce')
            if pd.notna(dt):
                return dt.strftime('%Y-%m-%d')
        except:
            pass
    elif isinstance(date_val, datetime):
        return date_val.strftime('%Y-%m-%d')

    return None


def standardize_date_from_iso(date_val):
    """Convert ISO date format to YYYY-MM-DD"""
    if pd.isna(date_val) or date_val == '':
        return None
    try:
        # Parse ISO format YYYY-MM-DDTHH:MM
        dt = pd.to_datetime(date_val, errors='coerce')
        if pd.notna(dt):
            return dt.strftime('%Y-%m-%d')
    except:
        pass
    return None


def standardize_visit_name(visit):
    """Standardize visit names for matching"""
    if pd.isna(visit):
        return None
    visit = str(visit).strip()

    # Standardize screening visit variations
    if 'screening' in visit.lower():
        return 'Screening'

    # For other visits, keep as is but standardize format
    return visit.replace('(Day-', '(Day -').replace('(Day  ', '(Day ')


def aggregate_lab_data(df_lab):
    """Aggregate lab data by patient-visit-category to match metadata granularity"""
    print("Aggregating lab data by patient-visit-category...")

    agg_lab = df_lab.groupby(['PATIENT', 'VISIT_STD', 'LBCAT']).agg({
        'LBTESTCD': 'count',  # Number of tests
        'LBDTC_STD': 'first',  # Collection date (should be same for all tests in category)
        'VISIT': 'first',  # Original visit name
        'LBDTC': 'first',  # Original date/time
        'LBREFID': lambda x: ', '.join(sorted(set(x.dropna().astype(str))))  # Sample IDs
    }).reset_index()

    agg_lab.columns = ['PATIENT', 'VISIT_STD', 'LBCAT', 'NUM_TESTS', 'LAB_DATE_STD',
                        'LAB_VISIT_ORIG', 'LAB_DATETIME_ORIG', 'LAB_SAMPLE_IDS']

    print(f"  Aggregated to {len(agg_lab)} patient-visit-category records")

    return agg_lab


def perform_reconciliation(df_meta, df_lab_agg):
    """Perform the main reconciliation between metadata and lab data

    Matching logic: PATIENT + VISIT + LBCAT (then compare dates)
    This allows proper identification of date mismatches.
    """
    print("Performing reconciliation...")

    # Merge on PATIENT + VISIT + LBCAT
    merged = pd.merge(
        df_meta,
        df_lab_agg,
        left_on=['PATIENT', 'VISIT_STD', 'LBCAT'],
        right_on=['PATIENT', 'VISIT_STD', 'LBCAT'],
        how='outer',
        indicator=True,
        suffixes=('', '_LAB')
    )

    # Create reconciliation status
    merged['MATCH_STATUS'] = merged['_merge'].map({
        'both': 'MATCHED',
        'left_only': 'METADATA_ONLY',
        'right_only': 'LAB_ONLY'
    })

    # Check for date mismatches (only for matched records)
    def check_date_match(row):
        if row['MATCH_STATUS'] != 'MATCHED':
            return 'N/A'
        date_meta = row.get('LBDAT_STD')
        date_lab = row.get('LAB_DATE_STD')
        if pd.isna(date_meta) or pd.isna(date_lab):
            return 'MISSING'
        return 'MATCH' if date_meta == date_lab else 'MISMATCH'

    merged['DATE_MATCH'] = merged.apply(check_date_match, axis=1)

    # Calculate date difference for mismatches
    def calc_date_diff(row):
        if row['DATE_MATCH'] != 'MISMATCH':
            return None
        try:
            d1 = pd.to_datetime(row['LBDAT_STD'])
            d2 = pd.to_datetime(row['LAB_DATE_STD'])
            return (d2 - d1).days
        except:
            return None

    merged['DATE_DIFF_DAYS'] = merged.apply(calc_date_diff, axis=1)

    # Summary stats
    matched = (merged['MATCH_STATUS'] == 'MATCHED').sum()
    date_match = (merged['DATE_MATCH'] == 'MATCH').sum()
    date_mismatch = (merged['DATE_MATCH'] == 'MISMATCH').sum()
    meta_only = (merged['MATCH_STATUS'] == 'METADATA_ONLY').sum()
    lab_only = (merged['MATCH_STATUS'] == 'LAB_ONLY').sum()

    print(f"  Total reconciliation records: {len(merged)}")
    print(f"  Matched (PATIENT+VISIT+LBCAT): {matched}")
    print(f"    - Dates match: {date_match}")
    print(f"    - Dates differ: {date_mismatch}")
    print(f"  Metadata only: {meta_only}")
    print(f"  Lab only: {lab_only}")

    return merged


def create_csv_output(merged_data):
    """Create comprehensive CSV output with all reconciliation results"""
    print("Creating CSV output...")

    output_df = merged_data.copy()

    # Select final columns for output
    final_columns = [
        'PATIENT',
        'SITE',
        'VISIT_STD',
        'LBCAT',
        'MATCH_STATUS',
        'DATE_MATCH',
        'LBDAT_STD',
        'LAB_DATE_STD',
        'DATE_DIFF_DAYS',
        'VISITORFORMNAME',
        'LAB_VISIT_ORIG',
        'LBPERF_FLAG',
        'LBCLSIG',
        'NUM_TESTS',
        'LAB_SAMPLE_IDS',
        'FORMSTATUS',
        'Status'
    ]

    # Only include columns that exist
    available_columns = [col for col in final_columns if col in output_df.columns]
    result = output_df[available_columns].copy()

    # Sort by patient, visit, category
    sort_cols = [c for c in ['PATIENT', 'VISIT_STD', 'LBCAT'] if c in result.columns]
    result = result.sort_values(sort_cols, na_position='last')

    # Rename columns to be more user-friendly
    column_renames = {
        'PATIENT': 'Subject',
        'SITE': 'Site',
        'VISIT_STD': 'Visit',
        'LBCAT': 'Category',
        'MATCH_STATUS': 'Match_Status',
        'DATE_MATCH': 'Date_Match',
        'LBDAT_STD': 'EDC_Date',
        'LAB_DATE_STD': 'Lab_Date',
        'DATE_DIFF_DAYS': 'Date_Diff_Days',
        'VISITORFORMNAME': 'Visit_Original_EDC',
        'LAB_VISIT_ORIG': 'Visit_Original_Lab',
        'LBPERF_FLAG': 'Lab_Performed',
        'LBCLSIG': 'Clinically_Significant',
        'NUM_TESTS': 'Num_Tests',
        'LAB_SAMPLE_IDS': 'Sample_IDs',
        'FORMSTATUS': 'Form_Status',
        'Status': 'Record_Status'
    }

    result = result.rename(columns={k: v for k, v in column_renames.items() if k in result.columns})

    return result


def create_summary_tab(merged_data, df_meta, df_lab):
    """Create summary statistics tab - hierarchical overview of all discrepancies"""
    print("Creating summary tab...")

    patients_meta = set(df_meta['PATIENT'].unique())
    patients_lab = set(df_lab['PATIENT'].unique())
    patients_both = patients_meta & patients_lab

    # Calculate visit gaps (for subjects in both systems)
    meta_visits = set(df_meta[df_meta['PATIENT'].isin(patients_both)][['PATIENT', 'VISIT_STD']].apply(tuple, axis=1))
    lab_visits = set(df_lab[df_lab['PATIENT'].isin(patients_both)][['PATIENT', 'VISIT_STD']].apply(tuple, axis=1))

    # Calculate category gaps from merged data
    cat_in_edc_not_lab = (merged_data['MATCH_STATUS'] == 'METADATA_ONLY').sum()
    cat_in_lab_not_edc = (merged_data['MATCH_STATUS'] == 'LAB_ONLY').sum()

    # Date mismatches
    date_mismatches = (merged_data['DATE_MATCH'] == 'MISMATCH').sum()

    rows = [
        ['SUBJECT GAPS', ''],
        ['Subjects in EDC only (not in Lab)', len(patients_meta - patients_lab)],
        ['Subjects in Lab only (not in EDC)', len(patients_lab - patients_meta)],
        ['Subjects in both systems', len(patients_both)],
        ['', ''],
        ['VISIT GAPS (for subjects in both)', ''],
        ['Visits in EDC only', len(meta_visits - lab_visits)],
        ['Visits in Lab only', len(lab_visits - meta_visits)],
        ['', ''],
        ['CATEGORY GAPS (PATIENT+VISIT+CATEGORY level)', ''],
        ['In EDC, not in Lab', cat_in_edc_not_lab],
        ['In Lab, not in EDC', cat_in_lab_not_edc],
        ['Matched', (merged_data['MATCH_STATUS'] == 'MATCHED').sum()],
        ['', ''],
        ['DATE MISMATCHES (matched records with different dates)', ''],
        ['Date mismatches', date_mismatches],
        ['', ''],
        ['SOURCE DATA', ''],
        ['Total EDC records', len(df_meta)],
        ['Total Lab test records', len(df_lab)],
        ['Unique patients in EDC', len(patients_meta)],
        ['Unique patients in Lab', len(patients_lab)],
    ]

    return pd.DataFrame(rows, columns=['Metric', 'Value'])


def create_subject_gaps_tab(df_meta, df_lab):
    """Create tab showing subjects missing from each system"""
    print("Creating subject gaps tab...")

    patients_meta = set(df_meta['PATIENT'].unique())
    patients_lab = set(df_lab['PATIENT'].unique())

    rows = []

    # Subjects in EDC but not in Lab
    for patient in sorted(patients_meta - patients_lab):
        patient_data = df_meta[df_meta['PATIENT'] == patient]
        rows.append({
            'Subject': patient,
            'Gap Type': 'In EDC, not in Lab',
            'Site': patient_data['SITE'].iloc[0] if 'SITE' in patient_data.columns else '',
            'Visits': len(patient_data['VISIT_STD'].unique()),
            'Categories': ', '.join(sorted(patient_data['LBCAT'].unique())),
            'Records': len(patient_data)
        })

    # Subjects in Lab but not in EDC
    for patient in sorted(patients_lab - patients_meta):
        patient_data = df_lab[df_lab['PATIENT'] == patient]
        rows.append({
            'Subject': patient,
            'Gap Type': 'In Lab, not in EDC',
            'Site': '',
            'Visits': len(patient_data['VISIT_STD'].unique()),
            'Categories': ', '.join(sorted(patient_data['LBCAT'].unique())),
            'Records': len(patient_data)
        })

    if not rows:
        rows.append({'Subject': 'No subject gaps found', 'Gap Type': '', 'Site': '', 'Visits': '', 'Categories': '', 'Records': ''})

    return pd.DataFrame(rows)


def create_visit_gaps_tab(df_meta, df_lab):
    """Create tab showing visit-level gaps for subjects present in both systems"""
    print("Creating visit gaps tab...")

    patients_meta = set(df_meta['PATIENT'].unique())
    patients_lab = set(df_lab['PATIENT'].unique())
    patients_both = patients_meta & patients_lab

    rows = []

    for patient in sorted(patients_both):
        meta_visits = set(df_meta[df_meta['PATIENT'] == patient]['VISIT_STD'].dropna().unique())
        lab_visits = set(df_lab[df_lab['PATIENT'] == patient]['VISIT_STD'].dropna().unique())

        # Visits in EDC but not in Lab
        for visit in sorted(meta_visits - lab_visits):
            visit_data = df_meta[(df_meta['PATIENT'] == patient) & (df_meta['VISIT_STD'] == visit)]
            rows.append({
                'Subject': patient,
                'Visit': visit,
                'Gap Type': 'In EDC, not in Lab',
                'Categories': ', '.join(sorted(visit_data['LBCAT'].unique())),
                'Date': visit_data['LBDAT_STD'].iloc[0] if 'LBDAT_STD' in visit_data.columns else ''
            })

        # Visits in Lab but not in EDC
        for visit in sorted(lab_visits - meta_visits):
            visit_data = df_lab[(df_lab['PATIENT'] == patient) & (df_lab['VISIT_STD'] == visit)]
            rows.append({
                'Subject': patient,
                'Visit': visit,
                'Gap Type': 'In Lab, not in EDC',
                'Categories': ', '.join(sorted(visit_data['LBCAT'].unique())),
                'Date': visit_data['LBDTC_STD'].iloc[0] if 'LBDTC_STD' in visit_data.columns else ''
            })

    if not rows:
        rows.append({'Subject': 'No visit gaps found', 'Visit': '', 'Gap Type': '', 'Categories': '', 'Date': ''})

    result = pd.DataFrame(rows)
    return result.sort_values(['Subject', 'Visit']) if len(result) > 1 else result


def create_category_gaps_tab(merged_data):
    """Create tab showing category-level gaps (subject+visit exists in both but category missing)"""
    print("Creating category gaps tab...")

    rows = []

    # Categories in EDC but not in Lab
    edc_only = merged_data[merged_data['MATCH_STATUS'] == 'METADATA_ONLY'].copy()
    for _, row in edc_only.iterrows():
        rows.append({
            'Subject': row['PATIENT'],
            'Visit': row.get('VISIT_STD', ''),
            'Category': row['LBCAT'],
            'Gap Type': 'In EDC, not in Lab',
            'EDC Date': row.get('LBDAT_STD', ''),
            'Lab Date': ''
        })

    # Categories in Lab but not in EDC
    lab_only = merged_data[merged_data['MATCH_STATUS'] == 'LAB_ONLY'].copy()
    for _, row in lab_only.iterrows():
        rows.append({
            'Subject': row['PATIENT'],
            'Visit': row.get('VISIT_STD', ''),
            'Category': row['LBCAT'],
            'Gap Type': 'In Lab, not in EDC',
            'EDC Date': '',
            'Lab Date': row.get('LAB_DATE_STD', '')
        })

    if not rows:
        rows.append({'Subject': 'No category gaps found', 'Visit': '', 'Category': '', 'Gap Type': '', 'EDC Date': '', 'Lab Date': ''})

    result = pd.DataFrame(rows)
    return result.sort_values(['Subject', 'Visit', 'Category']) if len(result) > 1 else result


def create_date_mismatches_tab(merged_data):
    """Create tab showing date mismatches for matched subject+visit+category"""
    print("Creating date mismatches tab...")

    mismatches = merged_data[merged_data['DATE_MATCH'] == 'MISMATCH'].copy()

    if len(mismatches) == 0:
        return pd.DataFrame([{'Subject': 'No date mismatches found', 'Visit': '', 'Category': '', 'EDC Date': '', 'Lab Date': '', 'Diff (days)': ''}])

    result = mismatches[['PATIENT', 'VISIT_STD', 'LBCAT', 'LBDAT_STD', 'LAB_DATE_STD', 'DATE_DIFF_DAYS']].copy()
    result.columns = ['Subject', 'Visit', 'Category', 'EDC Date', 'Lab Date', 'Diff (days)']
    result = result.sort_values(['Subject', 'Visit', 'Category'])

    return result


def write_excel_output(tabs_data):
    """Write all tabs to Excel with formatting"""
    print(f"Writing output to {EXCEL_OUTPUT_FILE}...")

    with pd.ExcelWriter(EXCEL_OUTPUT_FILE, engine='xlsxwriter') as writer:
        workbook = writer.book

        # Define formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#4472C4',
            'font_color': 'white',
            'border': 1
        })

        warning_format = workbook.add_format({
            'bg_color': '#FCE4D6',
            'border': 1
        })

        for df, sheet_name in tabs_data:
            df.to_excel(writer, sheet_name=sheet_name, index=False)
            worksheet = writer.sheets[sheet_name]

            # Format header row
            for col_num, value in enumerate(df.columns.values):
                worksheet.write(0, col_num, value, header_format)

            # Auto-adjust column widths
            for i, col in enumerate(df.columns):
                max_len = max(
                    df[col].astype(str).apply(len).max() if len(df) > 0 else 0,
                    len(str(col))
                )
                worksheet.set_column(i, i, min(max_len + 2, 50))

    print(f"SUCCESS: Created {EXCEL_OUTPUT_FILE}")


def main():
    """Main reconciliation workflow"""
    print("="*70)
    print("LAB DATA RECONCILIATION")
    print("="*70)
    print()

    # Load data
    df_meta = load_metadata()
    df_lab = load_lab_data()
    print()

    # Aggregate lab data
    df_lab_agg = aggregate_lab_data(df_lab)
    print()

    # Perform reconciliation
    merged = perform_reconciliation(df_meta, df_lab_agg)
    print()

    # Create CSV output
    output_df = create_csv_output(merged)

    # Write CSV file
    output_df.to_csv(OUTPUT_FILE, index=False)
    print(f"SUCCESS: Created {OUTPUT_FILE}")
    print(f"  Total records: {len(output_df)}")
    print()

    # Create Excel output with 5 focused tabs
    print("Creating Excel workbook...")
    tabs = [
        (create_summary_tab(merged, df_meta, df_lab), '1. Summary'),
        (create_subject_gaps_tab(df_meta, df_lab), '2. Subject Gaps'),
        (create_visit_gaps_tab(df_meta, df_lab), '3. Visit Gaps'),
        (create_category_gaps_tab(merged), '4. Category Gaps'),
        (create_date_mismatches_tab(merged), '5. Date Mismatches'),
    ]

    write_excel_output(tabs)
    print()

    print("="*70)
    print("RECONCILIATION COMPLETE")
    print("="*70)
    print()
    print(f"Output files:")
    print(f"  - {OUTPUT_FILE}")
    print(f"  - {EXCEL_OUTPUT_FILE}")
    print()

    # Calculate summary stats
    patients_meta = set(df_meta['PATIENT'].unique())
    patients_lab = set(df_lab['PATIENT'].unique())

    print("Summary:")
    print(f"  Subject gaps:")
    print(f"    - In EDC, not in Lab: {len(patients_meta - patients_lab)}")
    print(f"    - In Lab, not in EDC: {len(patients_lab - patients_meta)}")
    print(f"  Category gaps (PATIENT+VISIT+LBCAT):")
    print(f"    - In EDC, not in Lab: {(merged['MATCH_STATUS'] == 'METADATA_ONLY').sum()}")
    print(f"    - In Lab, not in EDC: {(merged['MATCH_STATUS'] == 'LAB_ONLY').sum()}")
    print(f"    - Matched: {(merged['MATCH_STATUS'] == 'MATCHED').sum()}")
    print(f"  Date mismatches: {(merged['DATE_MATCH'] == 'MISMATCH').sum()}")
    print()


if __name__ == "__main__":
    main()
