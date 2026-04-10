import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import {
  ChevronRight,
  ChevronLeft,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Users,
  Phone,
  User,
  Globe,
  Edit3,
  Check,
  X,
} from 'lucide-react'
import { formatPhone, rawToString } from '../utils/phoneUtils'
import { SUPPORTED_COUNTRIES, MAX_CONTACTS_PER_FILE } from '../utils/constants'
import type { ContactRow, ParsedSheet } from '../types'

interface Props {
  parsedSheet: ParsedSheet
  contacts: ContactRow[]
  nameColumn: string | null
  phoneColumn: string | null
  countryCode: string
  fileName: string
  onContactsChange: (contacts: ContactRow[]) => void
  onCountryChange: (code: string) => void
  onColumnChange: (nameCol: string | null, phoneCol: string | null) => void
  onBack: () => void
  onNext: (contacts: ContactRow[]) => void
}

function EditableCell({
  value,
  onSave,
  isPhone,
  isValid,
}: {
  value: string
  onSave: (v: string) => void
  isPhone?: boolean
  isValid?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const commit = () => {
    onSave(draft)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') cancel()
          }}
          className="flex-1 text-xs px-2 py-1 border border-blue-500 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none w-full min-w-0"
        />
        <button onClick={commit} className="text-green-600 hover:text-green-700 shrink-0" aria-label="Save">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={cancel} className="text-slate-400 hover:text-red-500 shrink-0" aria-label="Cancel">
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      className="group flex items-center gap-1 cursor-pointer"
      onClick={() => { setDraft(value); setEditing(true) }}
    >
      {isPhone && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isValid ? 'bg-green-500' : 'bg-amber-400'}`} />
      )}
      <span className="text-xs text-slate-700 dark:text-slate-200 truncate">{value || '—'}</span>
      <Edit3 className="w-3 h-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 shrink-0" />
    </div>
  )
}

const PAGE_SIZE = 50

export default function StepReview({
  parsedSheet,
  contacts,
  nameColumn,
  phoneColumn,
  countryCode,
  fileName,
  onContactsChange,
  onCountryChange,
  onColumnChange,
  onBack,
  onNext,
}: Props) {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')

  const validCount = useMemo(() => contacts.filter(c => c.isValid).length, [contacts])
  const selectedCount = useMemo(() => contacts.filter(c => c.selected).length, [contacts])
  const invalidCount = useMemo(() => contacts.filter(c => !c.isValid).length, [contacts])

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts
    const q = search.toLowerCase()
    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) || c.phone.includes(q)
    )
  }, [contacts, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const allSelected = filtered.every(c => c.selected)
  const someSelected = filtered.some(c => c.selected)

  const updateContact = useCallback((id: string, patch: Partial<ContactRow>) => {
    onContactsChange(contacts.map(c => c.id === id ? { ...c, ...patch } : c))
  }, [contacts, onContactsChange])

  const deleteContact = useCallback((id: string) => {
    onContactsChange(contacts.filter(c => c.id !== id))
  }, [contacts, onContactsChange])

  const toggleAll = useCallback(() => {
    const next = !allSelected
    if (search.trim()) {
      const filteredIds = new Set(filtered.map(c => c.id))
      onContactsChange(contacts.map(c => filteredIds.has(c.id) ? { ...c, selected: next } : c))
    } else {
      onContactsChange(contacts.map(c => ({ ...c, selected: next })))
    }
  }, [allSelected, search, filtered, contacts, onContactsChange])

  const handleCountryChange = (code: string) => {
    onCountryChange(code)
    // Re-format all phone numbers with new country
    const updated = contacts.map(c => {
      const { formatted, valid } = formatPhone(rawToString(c.rawPhone || c.phone), code)
      return { ...c, phone: formatted || c.rawPhone || c.phone, isValid: valid }
    })
    onContactsChange(updated)
    toast.info(`Phone numbers re-formatted for ${SUPPORTED_COUNTRIES.find(c => c.code === code)?.name}`)
  }

  const handleColumnChange = (type: 'name' | 'phone', col: string) => {
    const newNameCol = type === 'name' ? (col || null) : nameColumn
    const newPhoneCol = type === 'phone' ? (col || null) : phoneColumn
    onColumnChange(newNameCol, newPhoneCol)

    // Rebuild contacts from raw data with new column mapping
    const updated = parsedSheet.rows.map((row, index) => {
      const rawPhone = rawToString(row[newPhoneCol ?? ''] ?? '')
      const rawName = rawToString(row[newNameCol ?? ''] ?? '')
      const { formatted, valid } = formatPhone(rawPhone, countryCode)
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

    onContactsChange(updated)
    toast.success('Columns updated, contacts refreshed')
  }

  const handleNext = () => {
    if (selectedCount === 0) {
      toast.error('Please select at least one contact to export.')
      return
    }
    onNext(contacts)
  }

  const fileCount = Math.ceil(selectedCount / MAX_CONTACTS_PER_FILE)

  return (
    <div className="space-y-5">
      {/* Column & country controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
        <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          Column Mapping
          <span className="text-xs font-normal text-slate-400 ml-1">({fileName})</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Phone column */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Phone Column
            </label>
            <select
              value={phoneColumn ?? ''}
              onChange={e => handleColumnChange('phone', e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— None —</option>
              {parsedSheet.headers.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          {/* Name column */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Name Column (optional)
            </label>
            <select
              value={nameColumn ?? ''}
              onChange={e => handleColumnChange('name', e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— None —</option>
              {parsedSheet.headers.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          {/* Country */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Country / Region
            </label>
            <select
              value={countryCode}
              onChange={e => handleCountryChange(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SUPPORTED_COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.dialCode})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: contacts.length, color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-100 dark:bg-slate-800' },
          { label: 'Selected', value: selectedCount, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Valid', value: validCount, color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-950/30' },
          { label: 'Needs Review', value: invalidCount, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/30' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Warnings */}
      <AnimatePresence>
        {invalidCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-400"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              <strong>{invalidCount} number{invalidCount > 1 ? 's' : ''}</strong> could not be validated for the selected country.
              They'll still be exported — you can edit them inline or deselect them.
            </p>
          </motion.div>
        )}
        {selectedCount > MAX_CONTACTS_PER_FILE && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-400"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              {selectedCount} contacts exceed Google's 3,000-per-import limit.
              We'll automatically split into <strong>{fileCount} CSV files</strong> and download them as a ZIP.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Table toolbar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex-wrap">
          <input
            type="search"
            placeholder="Search contacts..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} · Page {page + 1}/{Math.max(totalPages, 1)}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Contact preview">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                <th className="px-4 py-2.5 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = !allSelected && someSelected }}
                    onChange={toggleAll}
                    className="rounded accent-blue-600"
                    aria-label="Select all"
                  />
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 w-8">#</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Name</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Phone Number</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Will be saved as</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {pageData.map((contact, i) => {
                  const globalIndex = contacts.findIndex(c => c.id === contact.id)
                  const seqNum = globalIndex + 1
                  const savedAs = contact.name.trim()
                    ? `A${String(seqNum).padStart(5, '0')}--${contact.name.trim()}`
                    : `A${String(seqNum).padStart(5, '0')}`

                  return (
                    <motion.tr
                      key={contact.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
                      className={[
                        'border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors',
                        !contact.selected ? 'opacity-40' : '',
                      ].join(' ')}
                    >
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={contact.selected}
                          onChange={e => updateContact(contact.id, { selected: e.target.checked })}
                          className="rounded accent-blue-600"
                        />
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 font-mono">
                        {seqNum}
                      </td>
                      <td className="px-3 py-2 max-w-[140px]">
                        <EditableCell
                          value={contact.name}
                          onSave={v => updateContact(contact.id, { name: v })}
                        />
                      </td>
                      <td className="px-3 py-2 max-w-[160px]">
                        <EditableCell
                          value={contact.phone}
                          onSave={v => {
                            const { formatted, valid } = formatPhone(v, countryCode)
                            updateContact(contact.id, {
                              phone: formatted || v,
                              isValid: valid,
                              rawPhone: v,
                            })
                          }}
                          isPhone
                          isValid={contact.isValid}
                        />
                      </td>
                      <td className="px-3 py-2 max-w-[180px]">
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate block">
                          {savedAs}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => deleteContact(contact.id)}
                          className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors"
                          aria-label={`Delete ${contact.name || contact.phone}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <motion.button
          onClick={handleNext}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-200 dark:shadow-blue-900"
        >
          Export {selectedCount} Contact{selectedCount !== 1 ? 's' : ''}
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  )
}
