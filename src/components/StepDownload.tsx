import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import {
  Download,
  CheckCircle,
  ChevronLeft,
  ExternalLink,
  RefreshCw,
  FileDown,
  Users,
  Files,
} from 'lucide-react'
import { downloadContacts } from '../utils/generateCsv'
import { MAX_CONTACTS_PER_FILE } from '../utils/constants'
import type { ContactRow } from '../types'

interface Props {
  contacts: ContactRow[]
  onBack: () => void
  onReset: () => void
}

const IMPORT_STEPS = [
  { num: 1, text: 'Go to', link: 'https://contacts.google.com', linkText: 'contacts.google.com' },
  { num: 2, text: 'Click "Import" on the left sidebar (or ☰ Menu → Import on mobile)' },
  { num: 3, text: 'Click "Select file" and choose your downloaded CSV file' },
  { num: 4, text: 'Click "Import" — your contacts will appear immediately' },
]

type DownloadState = 'idle' | 'loading' | 'done'

export default function StepDownload({ contacts, onBack, onReset }: Props) {
  const [dlState, setDlState] = useState<DownloadState>('idle')
  const [result, setResult] = useState<{ fileCount: number; contactCount: number } | null>(null)

  const selected = contacts.filter(c => c.selected && c.phone.trim())
  const validCount = selected.filter(c => c.isValid).length
  const fileCount = Math.ceil(selected.length / MAX_CONTACTS_PER_FILE)

  const handleDownload = async () => {
    setDlState('loading')
    try {
      const res = await downloadContacts(contacts)
      setResult(res)
      setDlState('done')

      if (res.fileCount > 1) {
        toast.success(
          `${res.contactCount} contacts split into ${res.fileCount} files — downloaded as ZIP`,
        )
      } else {
        toast.success(`${res.contactCount} contacts exported to google-contacts-import.csv`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Download failed.'
      toast.error(msg)
      setDlState('idle')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Summary card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Export Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{selected.length}</p>
            <div className="flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Users className="w-3.5 h-3.5" /> Contacts
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{validCount}</p>
            <div className="flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle className="w-3.5 h-3.5" /> Validated
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-3xl font-bold text-slate-700 dark:text-slate-200">{fileCount}</p>
            <div className="flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Files className="w-3.5 h-3.5" /> {fileCount > 1 ? 'CSV Files (ZIP)' : 'CSV File'}
            </div>
          </div>
        </div>
      </div>

      {/* Download button */}
      <div className="text-center">
        <AnimatePresence mode="wait">
          {dlState === 'done' ? (
            <motion.div
              key="done"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="inline-flex flex-col items-center gap-3"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-green-500" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-1"
              >
                <p className="font-bold text-lg text-slate-900 dark:text-white">
                  {result?.fileCount === 1
                    ? 'google-contacts-import.csv downloaded!'
                    : `google-contacts-import.zip downloaded!`}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Now follow the steps below to import into Google Contacts
                </p>
              </motion.div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mt-1"
              >
                <FileDown className="w-4 h-4" /> Download again
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="download-btn"
              onClick={handleDownload}
              disabled={dlState === 'loading' || selected.length === 0}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-3 px-8 py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-2xl shadow-lg shadow-blue-200 dark:shadow-blue-900 transition-colors"
            >
              {dlState === 'loading' ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  >
                    <Download className="w-5 h-5" />
                  </motion.div>
                  Generating CSV...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download {selected.length} Contact{selected.length !== 1 ? 's' : ''}
                  {fileCount > 1 ? ` (${fileCount} files)` : ''}
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* How to import section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-white">
            What's Next: Import into Google Contacts
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Follow these steps after downloading your CSV
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-700">
          {/* Steps */}
          <div className="p-5 space-y-3">
            {IMPORT_STEPS.map(s => (
              <div key={s.num} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                  {s.num}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {s.text}{' '}
                  {s.link && (
                    <a
                      href={s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 font-medium"
                    >
                      {s.linkText}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Embedded YouTube video */}
          <div className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
              Video tutorial
            </p>
            <div className="relative w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700" style={{ paddingTop: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/oiBRc3HvCao?rel=0"
                title="How to import contacts into Google Contacts"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Review
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Convert another file
        </button>
      </div>
    </div>
  )
}
