import { Moon, Sun, FileSpreadsheet } from 'lucide-react'
import type { AppStep } from '../types'

const STEPS: { id: AppStep; label: string }[] = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Review' },
  { id: 3, label: 'Download' },
]

interface Props {
  step: AppStep
  darkMode: boolean
  onToggleDark: () => void
}

export default function Header({ step, darkMode, onToggleDark }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo + Title */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base hidden sm:block">
            Google Number Saver
          </span>
        </div>

        {/* Stepper */}
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Progress">
          {STEPS.map((s, i) => {
            const isComplete = step > s.id
            const isActive = step === s.id
            return (
              <div key={s.id} className="flex items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className={[
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300',
                      isComplete
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-blue-600 text-white ring-2 ring-blue-200 dark:ring-blue-900'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
                    ].join(' ')}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    {isComplete ? '✓' : s.id}
                  </div>
                  <span
                    className={[
                      'text-xs sm:text-sm font-medium hidden sm:block',
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : isComplete
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-slate-400 dark:text-slate-500',
                    ].join(' ')}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={[
                      'w-6 sm:w-10 h-0.5 transition-colors duration-500',
                      step > s.id
                        ? 'bg-green-400'
                        : 'bg-slate-200 dark:bg-slate-700',
                    ].join(' ')}
                  />
                )}
              </div>
            )
          })}
        </nav>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  )
}
