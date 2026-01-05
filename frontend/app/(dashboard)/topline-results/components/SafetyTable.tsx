'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SafetyTableColumn {
  header: string;
  accessor: string;
  align?: 'left' | 'right' | 'center';
  render?: (value: any, row: any) => React.ReactNode;
}

interface SafetyTableProps {
  title?: string;
  columns: SafetyTableColumn[];
  data: any[];
  searchable?: boolean;
  searchPlaceholder?: string;
  footnotes?: string[];
  emptyMessage?: string;
}

export function SafetyTable({
  title,
  columns,
  data,
  searchable = false,
  searchPlaceholder = 'Search...',
  footnotes,
  emptyMessage = 'No data available',
}: SafetyTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on search term
  const filteredData = searchable
    ? data.filter((row) => {
        const searchString = Object.values(row).join(' ').toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
      })
    : data;

  return (
    <div className="space-y-4">
      {/* Title and Search */}
      {(title || searchable) && (
        <div className="flex items-center justify-between gap-4">
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {searchable && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700">
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`text-${col.align || 'left'} text-xs uppercase font-semibold text-slate-400 py-3 px-4`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                >
                  {columns.map((col, colIndex) => {
                    const value = row[col.accessor];
                    const content = col.render ? col.render(value, row) : value;

                    return (
                      <td
                        key={colIndex}
                        className={`text-${col.align || 'left'} py-3 px-4 text-slate-300`}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footnotes */}
      {footnotes && footnotes.length > 0 && (
        <div className="space-y-1">
          {footnotes.map((note, index) => (
            <p key={index} className="text-xs text-slate-500">
              {note}
            </p>
          ))}
        </div>
      )}

      {/* Result count for searchable tables */}
      {searchable && searchTerm && (
        <p className="text-sm text-slate-500">
          Showing {filteredData.length} of {data.length} results
        </p>
      )}
    </div>
  );
}

// Helper function to format count with percentage for safety tables
export function formatSafetyCount(data: { n: number; pct: number }, colorClass: string = 'text-slate-300') {
  return (
    <span className={`font-mono ${colorClass}`}>
      {data.n} ({data.pct.toFixed(1)}%)
    </span>
  );
}
