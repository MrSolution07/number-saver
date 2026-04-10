import { utils, write } from 'xlsx'

/**
 * Generates and downloads a sample .xlsx file showing the expected format.
 */
export function downloadSampleFile(): void {
  const data = [
    ['Name', 'Phone Number'],
    ['John Doe', '+27831234567'],
    ['Jane Smith', '0821234567'],
    ['Bob Johnson', '27731234567'],
    ['Alice Brown', '+1 555 123 4567'],
    ['Carlos Mendez', '0711234567'],
  ]

  const ws = utils.aoa_to_sheet(data)

  // Set column widths
  ws['!cols'] = [{ wch: 20 }, { wch: 20 }]

  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Contacts')

  const buf = write(wb, { type: 'array', bookType: 'xlsx' })
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sample-contacts.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
