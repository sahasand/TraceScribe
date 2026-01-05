// SheetJS parser for Query Status Report Excel files

import * as XLSX from 'xlsx';
import type { QueryRecord, ParseResult } from '../types';

export async function parseQueryFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          raw: false,
        }) as any[][];

        const queries: QueryRecord[] = [];
        const siteSet = new Set<string>();

        for (let i = 0; i < rawRows.length; i++) {
          const row = rawRows[i];

          // Skip short/empty rows (headers)
          if (!row || row.length < 15) continue;

          const col1 = String(row[1] || '').trim();

          // Find status in last non-empty column
          let statusVal = '';
          for (let k = row.length - 1; k >= 0; k--) {
            if (row[k] && String(row[k]).trim() !== '') {
              statusVal = String(row[k]).trim();
              break;
            }
          }

          // Pattern matching: Site format "21 - Cook County" + Status keyword
          const isSite = /\d+\s-\s/.test(col1);
          const statusLower = statusVal.toLowerCase();
          const isStatus = ['open', 'closed', 'new', 'pending', 'answered'].some(
            (s) => statusLower.includes(s)
          );

          if (isSite && isStatus) {
            const query: QueryRecord = {
              Site: row[1],
              Subject: row[2],
              Form: row[3],
              QueryID: String(row[6] || '').replace('.0', ''),
              QueryText: row[17] || row[16] || row[18] || 'Query text',
              Age: parseInt(String(row[11] || '0').replace('.0', '')) || 0,
              Status: normalizeStatus(statusVal),
            };

            queries.push(query);
            siteSet.add(query.Site);
          }
        }

        resolve({
          success: true,
          data: queries,
          queryCount: queries.length,
          siteCount: siteSet.size,
        });
      } catch (error) {
        console.error('Parser error:', error);
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

function normalizeStatus(raw: string): QueryRecord['Status'] {
  const lower = raw.toLowerCase();
  if (lower.includes('closed')) return 'Closed';
  if (lower.includes('open')) return 'Open';
  if (lower.includes('new')) return 'New';
  if (lower.includes('pending')) return 'Pending';
  if (lower.includes('answered')) return 'Answered';
  return 'Open';
}
