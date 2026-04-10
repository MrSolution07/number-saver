import { useCallback, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { Upload, FileSpreadsheet, Download, AlertCircle, Loader2 } from 'lucide-react'
import { parseFile } from '../utils/parseExcel'
import { detectColumns } from '../utils/detectColumns'
import { formatPhone, rawToString } from '../utils/phoneUtils'
import { downloadSampleFile } from '../utils/sampleFile'
import type { ContactRow, ParsedSheet } from '../types'

interface Props {
  onComplete: (
    parsedSheet: ParsedSheet,
    contacts: ContactRow[],
    nameColumn: string | null,
    phoneColumn: string | null,
    fileName: string,
  ) => void
}

const ACCEPTED_MIME = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
  'application/csv': ['.csv'],
}

export default function StepUpload({ onComplete }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processFile = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)

    try {
      const parsed = await parseFile(file)

      if (parsed.rows.length === 0) {
        throw new Error('The file appears to be empty. Please upload a file with contact data.')
      }

      const { phoneColumn, nameColumn } = detectColumns(parsed.rows, parsed.headers)

      if (!phoneColumn) {
        toast.warning('Could not auto-detect a phone number column. Please select it manually in the next step.')
      }

      // Build initial contact rows
      const contacts: ContactRow[] = parsed.rows.map((row, index) => {
        const rawPhone = rawToString(row[phoneColumn ?? ''] ?? '')
        const rawName = rawToString(row[nameColumn ?? ''] ?? '')
        const { formatted, valid } = formatPhone(rawPhone, 'ZA')

        return {
          id: `row-${index}`,
          name: rawName,
          phone: formatted || rawPhone,
          isValid: valid,
          selected: true,
          rawName,
          rawPhone,
        }
      }).filter(c => c.phone.trim() !== '')

      if (contacts.length === 0) {
        throw new Error('No phone numbers were found in the file. Please check your column selection.')
      }

      const validCount = contacts.filter(c => c.isValid).length
      toast.success(`Found ${contacts.length} contacts (${validCount} valid phone numbers)`)

      onComplete(parsed, contacts, nameColumn, phoneColumn, file.name)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to parse file.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [onComplete])

  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
    if (rejected.length > 0) {
      const msg = 'Invalid file type. Please upload an .xlsx, .xls, or .csv file.'
      setError(msg)
      toast.error(msg)
      return
    }
    if (accepted.length > 0) {
      processFile(accepted[0])
    }
  }, [processFile])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME,
    maxFiles: 1,
    disabled: loading,
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Hero text */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Upload Your Contact Sheet
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
          Upload an Excel or CSV file containing phone numbers. We'll detect the columns automatically.
        </p>
      </div>

      {/* Dropzone */}
      <motion.div
        animate={{ scale: isDragActive ? 1.02 : 1 }}
        transition={{ duration: 0.15 }}
      >
        <div
          {...getRootProps()}
          className={[
            'relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
            isDragReject
              ? 'border-red-400 bg-red-50 dark:bg-red-950/20'
              : isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
              : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/10',
          ].join(' ')}
          aria-label="Upload file"
        >
          <input {...getInputProps()} />
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-3"
            >
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-slate-600 dark:text-slate-300 font-medium">Parsing your file...</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                animate={{ y: isDragActive ? -6 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isDragReject ? (
                  <AlertCircle className="w-12 h-12 text-red-500" />
                ) : isDragActive ? (
                  <Download className="w-12 h-12 text-blue-500" />
                ) : (
                  <Upload className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                )}
              </motion.div>
              <div>
                <p className="text-slate-700 dark:text-slate-200 font-semibold text-base">
                  {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
                </p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                  or <span className="text-blue-600 dark:text-blue-400 font-medium">click to browse</span>
                </p>
              </div>
              <div className="flex gap-2 mt-1">
                {['.xlsx', '.xls', '.csv'].map(ext => (
                  <span
                    key={ext}
                    className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono text-slate-500 dark:text-slate-400"
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: '🔒', title: 'Private', desc: 'All processing happens in your browser. No data leaves your device.' },
          { icon: '⚡', title: 'Instant', desc: 'Contacts are detected and formatted automatically in seconds.' },
          { icon: '📱', title: 'Compatible', desc: 'Output is a verified Google Contacts CSV ready to import.' },
        ].map(card => (
          <div
            key={card.title}
            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-1.5"
          >
            <div className="text-2xl">{card.icon}</div>
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{card.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Sample file download */}
      <div className="text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Not sure about the format?{' '}
          <button
            onClick={downloadSampleFile}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download a sample Excel file
          </button>
        </p>
      </div>
    </div>
  )
}
