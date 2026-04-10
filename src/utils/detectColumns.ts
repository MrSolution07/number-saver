import { phoneScore, nameScore } from './phoneUtils'

/**
 * Scores each column in the dataset to auto-detect the phone and name columns.
 * Returns the best-guess column keys.
 */
export function detectColumns(
  rows: Record<string, unknown>[],
  headers: string[]
): { phoneColumn: string | null; nameColumn: string | null } {
  if (rows.length === 0 || headers.length === 0) {
    return { phoneColumn: null, nameColumn: null }
  }

  // Sample up to 30 rows for scoring
  const sample = rows.slice(0, 30)

  const scores: Record<string, { phone: number; name: number }> = {}

  for (const header of headers) {
    let totalPhone = 0
    let totalName = 0
    let count = 0

    for (const row of sample) {
      const val = row[header]
      if (val === '' || val === null || val === undefined) continue
      totalPhone += phoneScore(val)
      totalName += nameScore(val)
      count++
    }

    scores[header] = {
      phone: count > 0 ? totalPhone / count : 0,
      name: count > 0 ? totalName / count : 0,
    }
  }

  // Pick best phone column (must have score > 0.3)
  let phoneColumn: string | null = null
  let bestPhoneScore = 0.3

  for (const [header, score] of Object.entries(scores)) {
    if (score.phone > bestPhoneScore) {
      bestPhoneScore = score.phone
      phoneColumn = header
    }
  }

  // Pick best name column (different from phone column, score > 0.4)
  let nameColumn: string | null = null
  let bestNameScore = 0.4

  for (const [header, score] of Object.entries(scores)) {
    if (header === phoneColumn) continue
    if (score.name > bestNameScore) {
      bestNameScore = score.name
      nameColumn = header
    }
  }

  return { phoneColumn, nameColumn }
}
