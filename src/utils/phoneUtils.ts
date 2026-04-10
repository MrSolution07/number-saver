import {
  parsePhoneNumber,
  isValidPhoneNumber,
  type CountryCode,
} from 'libphonenumber-js'

/**
 * Attempts to parse and format a raw phone value to E.164 international format.
 * Handles Excel's numeric storage (which strips leading zeros).
 */
export function formatPhone(raw: unknown, countryCode: string): { formatted: string; valid: boolean } {
  const str = rawToString(raw)
  if (!str) return { formatted: '', valid: false }

  const country = countryCode as CountryCode

  try {
    // First try parsing as-is
    const phone = parsePhoneNumber(str, country)
    if (phone && isValidPhoneNumber(str, country)) {
      return { formatted: phone.format('E.164'), valid: true }
    }

    // Try with leading zero restoration for countries that use local formats
    const restored = restoreLeadingZero(str, country)
    if (restored !== str) {
      const phone2 = parsePhoneNumber(restored, country)
      if (phone2 && isValidPhoneNumber(restored, country)) {
        return { formatted: phone2.format('E.164'), valid: true }
      }
    }

    // Parse but mark as potentially invalid (might be international without +)
    const phone3 = parsePhoneNumber(str, country)
    if (phone3) {
      return { formatted: phone3.format('E.164'), valid: false }
    }
  } catch {
    // Fall through
  }

  return { formatted: str, valid: false }
}

/**
 * Excel stores phone numbers as numbers, stripping leading zeros.
 * e.g., "0831234567" stored as 831234567.
 * We detect this case by checking if adding a leading zero makes it valid.
 */
function restoreLeadingZero(str: string, country: CountryCode): string {
  // Only applies if the string contains only digits (no +, spaces, dashes)
  if (!/^\d+$/.test(str)) return str

  // Countries known to use leading-zero local format
  const zeroPrefix = ['ZA', 'GB', 'AU', 'NG', 'KE', 'GH', 'ZW', 'ZM', 'BW', 'MZ', 'TZ', 'UG', 'DE', 'FR']
  if (!zeroPrefix.includes(country)) return str

  const withZero = '0' + str
  try {
    if (isValidPhoneNumber(withZero, country)) return withZero
  } catch {
    // ignore
  }
  return str
}

/**
 * Converts any cell value (number, string, etc.) to a clean phone string.
 * Handles scientific notation Excel sometimes uses for long numbers.
 */
export function rawToString(raw: unknown): string {
  if (raw === null || raw === undefined) return ''
  if (typeof raw === 'number') {
    // Handle scientific notation (e.g., 8.31234567e8)
    return raw.toFixed(0)
  }
  return String(raw).trim()
}

/**
 * Heuristic score for how likely a cell value is a phone number.
 * Returns 0-1.
 */
export function phoneScore(raw: unknown): number {
  const str = rawToString(raw)
  if (!str) return 0

  // Strip common phone separators
  const digits = str.replace(/[\s\-().+]/g, '')

  // Must be mostly digits
  if (!/^\d+$/.test(digits)) return 0

  const len = digits.length

  // Valid phone length: 7-15 digits (E.164 standard)
  if (len < 7 || len > 15) return 0

  // Strong signals
  if (str.startsWith('+')) return 0.95
  if (str.startsWith('00')) return 0.9

  // Common local formats
  if (len >= 9 && len <= 11) return 0.8
  if (len >= 7 && len <= 8) return 0.6

  return 0.4
}

/**
 * Check if a string looks like a name (not a phone number or number).
 */
export function nameScore(raw: unknown): number {
  const str = rawToString(raw)
  if (!str) return 0

  // Names have letters
  const letterRatio = (str.match(/[a-zA-Z]/g) || []).length / str.length
  if (letterRatio < 0.5) return 0

  // Names are typically short
  if (str.length > 60) return 0.2
  if (str.length >= 2 && str.length <= 40) return 0.9

  return 0.5
}
