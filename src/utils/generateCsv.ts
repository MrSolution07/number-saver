import type { ContactRow } from '../types'
import {
  GOOGLE_CSV_HEADERS,
  GOOGLE_CSV_HEADER_COUNT,
  COL,
  GROUP_MEMBERSHIP_VALUE,
  PHONE_TYPE_VALUE,
  MAX_CONTACTS_PER_FILE,
} from './constants'

/**
 * Escapes a CSV field value: wraps in double quotes if it contains
 * commas, double quotes, or newlines. Escapes internal double quotes as "".
 */
function escapeField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Builds a single data row for the Google Contacts CSV.
 * The row has exactly GOOGLE_CSV_HEADER_COUNT fields.
 * Counter is 1-based (1 = A00001).
 */
function buildRow(contact: ContactRow, counter: number): string {
  const sequentialId = `A${String(counter).padStart(5, '0')}`
  const displayName = contact.name.trim()
    ? `${sequentialId}--${contact.name.trim()}`
    : sequentialId

  // Build the empty row array
  const row = new Array<string>(GOOGLE_CSV_HEADER_COUNT).fill('')

  row[COL.NAME] = displayName
  row[COL.GIVEN_NAME] = contact.name.trim()
  row[COL.GROUP_MEMBERSHIP] = GROUP_MEMBERSHIP_VALUE
  row[COL.PHONE_TYPE] = PHONE_TYPE_VALUE
  row[COL.PHONE_VALUE] = contact.phone.trim()

  return row.map(escapeField).join(',')
}

/**
 * Generates the full Google Contacts CSV string from a list of contacts.
 * Plain UTF-8, NO BOM.
 */
export function buildCsvContent(contacts: ContactRow[]): string {
  const headerRow = GOOGLE_CSV_HEADERS.join(',')
  const dataRows = contacts
    .filter(c => c.selected && c.phone.trim())
    .map((contact, index) => buildRow(contact, index + 1))

  return [headerRow, ...dataRows].join('\r\n')
}

/**
 * Triggers a browser download of a text file.
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/csv;charset=utf-8'): void {
  // Plain UTF-8, NO BOM
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Downloads contacts as one or more CSV files.
 * If > MAX_CONTACTS_PER_FILE, splits and downloads as a ZIP.
 * Returns the number of files generated.
 */
export async function downloadContacts(contacts: ContactRow[]): Promise<{ fileCount: number; contactCount: number }> {
  const selected = contacts.filter(c => c.selected && c.phone.trim())

  if (selected.length === 0) {
    throw new Error('No valid contacts selected for export.')
  }

  if (selected.length <= MAX_CONTACTS_PER_FILE) {
    const csv = buildCsvContent(selected.map(c => ({ ...c, selected: true })))
    downloadFile(csv, 'google-contacts-import.csv')
    return { fileCount: 1, contactCount: selected.length }
  }

  // Split into chunks and zip
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()

  const chunks: ContactRow[][] = []
  for (let i = 0; i < selected.length; i += MAX_CONTACTS_PER_FILE) {
    chunks.push(selected.slice(i, i + MAX_CONTACTS_PER_FILE))
  }

  chunks.forEach((chunk, index) => {
    // Re-number contacts per chunk starting from where the previous chunk left off
    const offset = index * MAX_CONTACTS_PER_FILE
    const headerRow = GOOGLE_CSV_HEADERS.join(',')
    const dataRows = chunk.map((contact, i) => buildRow(contact, offset + i + 1))
    const csv = [headerRow, ...dataRows].join('\r\n')
    zip.file(`google-contacts-part${index + 1}.csv`, csv)
  })

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'google-contacts-import.zip'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return { fileCount: chunks.length, contactCount: selected.length }
}
