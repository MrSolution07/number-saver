export interface ContactRow {
  id: string
  name: string
  phone: string
  isValid: boolean
  selected: boolean
  rawName: string
  rawPhone: string
}

export interface ParsedSheet {
  headers: string[]
  rows: Record<string, unknown>[]
  sheetNames: string[]
  activeSheet: string
}

export type AppStep = 1 | 2 | 3

export interface AppState {
  step: AppStep
  parsedSheet: ParsedSheet | null
  contacts: ContactRow[]
  nameColumn: string | null
  phoneColumn: string | null
  countryCode: string
  fileName: string
}
