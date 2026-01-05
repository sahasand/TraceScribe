import * as XLSX from 'xlsx';
import type { EDCRecord, LabRecord } from '../types';

export interface ParseResult<T> {
  success: boolean;
  data?: T[];
  error?: string;
  recordCount?: number;
  patientCount?: number;
}

// Standardize date from Excel format (DD/MMM/YYYY or Excel serial)
function standardizeDateFromExcel(dateVal: any): string | null {
  if (!dateVal || dateVal === 'ND' || dateVal === 'NOT DONE' || dateVal === '') {
    return null;
  }

  try {
    // If it's already a Date object
    if (dateVal instanceof Date) {
      return dateVal.toISOString().split('T')[0];
    }

    // If it's a string
    if (typeof dateVal === 'string') {
      // Try parsing DD/MMM/YYYY format
      const date = new Date(dateVal);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }

    // If it's an Excel serial number
    if (typeof dateVal === 'number') {
      const date = XLSX.SSF.parse_date_code(dateVal);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
    }
  } catch (e) {
    console.error('Date parsing error:', e);
  }

  return null;
}

// Standardize date from ISO format (YYYY-MM-DDTHH:MM)
function standardizeDateFromISO(dateVal: any): string | null {
  if (!dateVal || dateVal === '') {
    return null;
  }

  try {
    const date = new Date(dateVal);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.error('ISO date parsing error:', e);
  }

  return null;
}

// Standardize visit name for matching
function standardizeVisitName(visit: string | null): string | null {
  if (!visit) return null;

  let standardized = String(visit).trim();

  // Standardize screening visit variations
  if (standardized.toLowerCase().includes('screening')) {
    return 'Screening';
  }

  // Standardize format: (Day-30) → (Day -30)
  standardized = standardized
    .replace(/\(Day-/g, '(Day -')
    .replace(/\(Day\s+/g, '(Day ');

  return standardized;
}

// Parse EDC Metadata Excel file
export async function parseEDCFile(file: File): Promise<ParseResult<EDCRecord>> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        if (!jsonData || jsonData.length === 0) {
          resolve({
            success: false,
            error: 'No data found in Excel file',
          });
          return;
        }

        // Validate required columns
        const firstRow = jsonData[0] as any;
        const requiredColumns = ['PATIENT', 'SITE', 'VISIT', 'LBCAT', 'LBDAT'];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));

        if (missingColumns.length > 0) {
          resolve({
            success: false,
            error: `Missing required columns: ${missingColumns.join(', ')}`,
          });
          return;
        }

        // Parse and standardize records
        const records: EDCRecord[] = jsonData
          .map((row: any) => ({
            PATIENT: String(row.PATIENT || '').trim(),
            SITE: String(row.SITE || '').trim(),
            VISIT: standardizeVisitName(row.VISIT || row.VISITORFORMNAME) || '',
            LBCAT: String(row.LBCAT || '').trim(),
            LBDAT: standardizeDateFromExcel(row.LBDAT) || '',
            LBPERF: String(row.LBPERF || '').toUpperCase(),
          }))
          .filter((record) => record.PATIENT && record.VISIT && record.LBCAT);

        const uniquePatients = new Set(records.map(r => r.PATIENT)).size;

        resolve({
          success: true,
          data: records,
          recordCount: records.length,
          patientCount: uniquePatients,
        });
      } catch (error) {
        console.error('EDC parsing error:', error);
        resolve({
          success: false,
          error: `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read file',
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

// Parse Lab Results CSV file
export async function parseLabFile(file: File): Promise<ParseResult<LabRecord>> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        if (!jsonData || jsonData.length === 0) {
          resolve({
            success: false,
            error: 'No data found in file',
          });
          return;
        }

        // Validate required columns
        const firstRow = jsonData[0] as any;
        const requiredColumns = ['USUBJID', 'VISIT', 'LBCAT', 'LBDTC'];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));

        if (missingColumns.length > 0) {
          resolve({
            success: false,
            error: `Missing required columns: ${missingColumns.join(', ')}`,
          });
          return;
        }

        // Parse and standardize records
        const records: LabRecord[] = jsonData
          .map((row: any) => ({
            USUBJID: String(row.USUBJID || '').trim(),
            VISIT: standardizeVisitName(row.VISIT) || '',
            LBCAT: String(row.LBCAT || '').trim(),
            LBDTC: standardizeDateFromISO(row.LBDTC) || '',
            LBTESTCD: String(row.LBTESTCD || row.LBTEST || '').trim(),
          }))
          .filter((record) => record.USUBJID && record.VISIT && record.LBCAT);

        const uniquePatients = new Set(records.map(r => r.USUBJID)).size;

        resolve({
          success: true,
          data: records,
          recordCount: records.length,
          patientCount: uniquePatients,
        });
      } catch (error) {
        console.error('Lab parsing error:', error);
        resolve({
          success: false,
          error: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read file',
      });
    };

    reader.readAsArrayBuffer(file);
  });
}
