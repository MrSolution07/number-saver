/**
 * Exact Google Contacts CSV export header row.
 * Case-sensitive, order matches a real Google Contacts export.
 * Do NOT add a BOM - Google import requires plain UTF-8.
 */
export const GOOGLE_CSV_HEADERS = [
  'Name',
  'Given Name',
  'Additional Name',
  'Family Name',
  'Yomi Name',
  'Given Name Yomi',
  'Additional Name Yomi',
  'Family Name Yomi',
  'Name Prefix',
  'Name Suffix',
  'Initials',
  'Nickname',
  'Short Name',
  'Maiden Name',
  'Birthday',
  'Gender',
  'Location',
  'Billing Information',
  'Directory Server',
  'Mileage',
  'Occupation',
  'Hobby',
  'Sensitivity',
  'Priority',
  'Subject',
  'Notes',
  'Language',
  'Photo',
  'Group Membership',
  'E-mail 1 - Type',
  'E-mail 1 - Value',
  'Phone 1 - Type',
  'Phone 1 - Value',
] as const

export const GOOGLE_CSV_HEADER_COUNT = GOOGLE_CSV_HEADERS.length // 33

// Column index map for fast lookups
export const COL = {
  NAME: 0,
  GIVEN_NAME: 1,
  FAMILY_NAME: 3,
  GROUP_MEMBERSHIP: 28,
  PHONE_TYPE: 31,
  PHONE_VALUE: 32,
} as const

// Required: the * prefix makes Google assign to the group, not treat as a note
export const GROUP_MEMBERSHIP_VALUE = '* myContacts'
export const PHONE_TYPE_VALUE = 'Mobile'

// Google Contacts import limit per CSV file
export const MAX_CONTACTS_PER_FILE = 3000

// Supported country codes with names and flags for the selector
export const SUPPORTED_COUNTRIES: { code: string; name: string; flag: string; dialCode: string }[] = [
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', dialCode: '+263' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', dialCode: '+260' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼', dialCode: '+267' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', dialCode: '+258' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', dialCode: '+255' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', dialCode: '+256' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55' },
]
