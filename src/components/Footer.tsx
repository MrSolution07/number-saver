import { Heart, ExternalLink, Moon, Sun } from 'lucide-react'

interface Props {
  darkMode: boolean
  onToggleDark: () => void
}

export default function Footer({ darkMode, onToggleDark }: Props) {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 text-center sm:text-left">
          <span>© 2026 Google Number Saver • Made with</span>
          <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
          <span>
            by{' '}
            <a
              href="https://solutionincorporate.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              SolutionIncorporate
            </a>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDark}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {darkMode ? 'Light mode' : 'Dark mode'}
          </button>
          <a
            href="https://solutionincorporate.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Visit solutionincorporate.com
          </a>
        </div>
      </div>
    </footer>
  )
}
