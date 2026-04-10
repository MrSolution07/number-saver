import { Heart, ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 text-center sm:text-left">
          <span>© 2026 Daniel & Carmelle Wedding • Made with</span>
          <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
          <span>by SolutionIncorporate for your special day</span>
        </div>
        <a
          href="https://solutionincorporate.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          solutionincorporate.com
        </a>
      </div>
    </footer>
  )
}
