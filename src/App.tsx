import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Toaster, toast } from 'sonner'
import Header from './components/Header'
import Footer from './components/Footer'
import StepUpload from './components/StepUpload'
import StepReview from './components/StepReview'
import StepDownload from './components/StepDownload'
import type { AppStep, AppState, ContactRow, ParsedSheet } from './types'

const SESSION_KEY = 'gns_session'

const INITIAL_STATE: AppState = {
  step: 1,
  parsedSheet: null,
  contacts: [],
  nameColumn: null,
  phoneColumn: null,
  countryCode: 'ZA',
  fileName: '',
}

function detectDefaultCountry(): string {
  try {
    const locale = navigator.language || 'en-ZA'
    const region = locale.split('-')[1]?.toUpperCase()
    const supported = ['ZA','US','GB','NG','KE','GH','ZW','ZM','BW','MZ','TZ','UG','IN','AU','CA','DE','FR','BR']
    if (region && supported.includes(region)) return region
  } catch { /* ignore */ }
  return 'ZA'
}

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
}

export default function App() {
  const [state, setState] = useState<AppState>(() => ({
    ...INITIAL_STATE,
    countryCode: detectDefaultCountry(),
  }))
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('gns_dark')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [direction, setDirection] = useState(1)
  const [sessionRestored, setSessionRestored] = useState(false)

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('gns_dark', String(darkMode))
  }, [darkMode])

  // Offer to restore session on load
  useEffect(() => {
    if (sessionRestored) return
    setSessionRestored(true)
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as AppState
      if (saved.contacts.length > 0 && saved.step > 1) {
        toast(
          `You have a previous session with ${saved.contacts.length} contacts.`,
          {
            duration: 8000,
            action: {
              label: 'Resume',
              onClick: () => setState(saved),
            },
          }
        )
      }
    } catch { /* ignore corrupt session */ }
  }, [sessionRestored])

  // Persist session to sessionStorage on state change
  useEffect(() => {
    if (state.step > 1 && state.contacts.length > 0) {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(state))
      } catch { /* quota exceeded, ignore */ }
    }
  }, [state])

  const goToStep = useCallback((nextStep: AppStep) => {
    setDirection(nextStep > state.step ? 1 : -1)
    setState(prev => ({ ...prev, step: nextStep }))
  }, [state.step])

  const handleUploadComplete = useCallback((
    parsedSheet: ParsedSheet,
    contacts: ContactRow[],
    nameColumn: string | null,
    phoneColumn: string | null,
    fileName: string,
  ) => {
    setDirection(1)
    setState(prev => ({
      ...prev,
      parsedSheet,
      contacts,
      nameColumn,
      phoneColumn,
      fileName,
      step: 2,
    }))
  }, [])

  const handleReset = useCallback(() => {
    setDirection(-1)
    setState(prev => ({ ...INITIAL_STATE, countryCode: prev.countryCode }))
    sessionStorage.removeItem(SESSION_KEY)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{ duration: 4000 }}
      />

      <Header
        step={state.step}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          {state.step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <StepUpload onComplete={handleUploadComplete} />
            </motion.div>
          )}

          {state.step === 2 && state.parsedSheet && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <StepReview
                parsedSheet={state.parsedSheet}
                contacts={state.contacts}
                nameColumn={state.nameColumn}
                phoneColumn={state.phoneColumn}
                countryCode={state.countryCode}
                fileName={state.fileName}
                onContactsChange={contacts => setState(prev => ({ ...prev, contacts }))}
                onCountryChange={countryCode => setState(prev => ({ ...prev, countryCode }))}
                onColumnChange={(nameColumn, phoneColumn) =>
                  setState(prev => ({ ...prev, nameColumn, phoneColumn }))
                }
                onBack={() => goToStep(1)}
                onNext={() => goToStep(3)}
              />
            </motion.div>
          )}

          {state.step === 3 && (
            <motion.div
              key="step-3"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <StepDownload
                contacts={state.contacts}
                onBack={() => goToStep(2)}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  )
}
