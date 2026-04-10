import { read, utils } from 'xlsx'
import type { ParsedSheet } from '../types'

/**
 * Parses an Excel or CSV file using SheetJS with raw:true to preserve
 * phone numbers (prevents leading-zero stripping by SheetJS).
 */
export async function parseFile(file: File): Promise<ParsedSheet> {
  const buffer = await file.arrayBuffer()

  const wb = read(buffer, {
    type: 'array',
    raw: true,          // Preserve raw cell values (don't format numbers)
    cellText: false,    // Don't generate display text
    cellDates: false,   // Don't convert dates
  })

  const sheetNames = wb.SheetNames
  const activeSheet = sheetNames[0]
  const ws = wb.Sheets[activeSheet]

  // Convert to array-of-objects with header detection
  const rows = utils.sheet_to_json<Record<string, unknown>>(ws, {
    raw: true,
    defval: '',    // Empty string for missing cells
    blankrows: false,
  })

  // Extract headers from the first row
  const headers: string[] = rows.length > 0
    ? Object.keys(rows[0])
    : []

  return { headers, rows, sheetNames, activeSheet }
}
