/**
 * E.164 International Phone Number Normalization & Validation Utility
 * Complies with ITU-T E.164 recommendation.
 */

export interface NormalizedPhone {
  raw: string
  e164: string        // e.g. "+919876543210"
  nationalNumber: string // e.g. "9876543210"
  countryCode: string    // e.g. "91"
  isValid: boolean
}

// Leading country code mapping for common prefixes
const KNOWN_COUNTRY_CODES = [
  '1',   // US/Canada
  '7',   // Russia/Kazakhstan
  '20',  // Egypt
  '27',  // South Africa
  '30',  // Greece
  '31',  // Netherlands
  '32',  // Belgium
  '33',  // France
  '34',  // Spain
  '39',  // Italy
  '44',  // UK
  '49',  // Germany
  '52',  // Mexico
  '55',  // Brazil
  '61',  // Australia
  '62',  // Indonesia
  '65',  // Singapore
  '81',  // Japan
  '82',  // South Korea
  '86',  // China
  '90',  // Turkey
  '91',  // India
  '92',  // Pakistan
  '971', // UAE
  '972', // Israel
  '966', // Saudi Arabia
]

/**
 * Normalizes any phone input into strict E.164 standard (+[country][number]).
 * Strips whitespace, hyphens, brackets, dots, and handles leading 0s.
 */
export function normalizePhoneNumber(raw: string, defaultCountryCode = '91'): NormalizedPhone {
  if (!raw || typeof raw !== 'string') {
    return { raw: '', e164: '', nationalNumber: '', countryCode: '', isValid: false }
  }

  // 1. Strip all non-digit characters except leading plus
  let cleaned = raw.trim().replace(/[^\d+]/g, '')

  // 2. Handle double zero prefix "0091..." -> "+91..."
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2)
  }

  let e164 = ''
  let countryCode = ''
  let nationalNumber = ''

  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1)
    // Find matching country code from known list (longest match first)
    const match = KNOWN_COUNTRY_CODES
      .filter((cc) => digits.startsWith(cc))
      .sort((a, b) => b.length - a.length)[0]

    if (match) {
      countryCode = match
      nationalNumber = digits.slice(match.length).replace(/^0+/, '')
      e164 = `+${countryCode}${nationalNumber}`
    } else {
      // Fallback: 1-3 digits country code
      countryCode = digits.slice(0, 3)
      nationalNumber = digits.slice(3)
      e164 = `+${digits}`
    }
  } else {
    // No leading plus: strip leading zeros (local national format e.g. 09876543210 -> 9876543210)
    let digits = cleaned.replace(/^0+/, '')

    // Check if user already typed country code without plus (e.g. 919876543210)
    const match = KNOWN_COUNTRY_CODES
      .filter((cc) => digits.startsWith(cc) && digits.length > cc.length + 6)
      .sort((a, b) => b.length - a.length)[0]

    if (match) {
      countryCode = match
      nationalNumber = digits.slice(match.length)
      e164 = `+${countryCode}${nationalNumber}`
    } else {
      countryCode = defaultCountryCode
      nationalNumber = digits
      e164 = `+${countryCode}${nationalNumber}`
    }
  }

  // E.164 validity check: starts with +, has 8-15 digits total
  const digitCount = e164.replace(/[^\d]/g, '').length
  const isValid = /^\+[1-9]\d{7,14}$/.test(e164) && digitCount >= 8 && digitCount <= 15

  return {
    raw,
    e164,
    nationalNumber,
    countryCode,
    isValid,
  }
}

/**
 * Compares two phone numbers for equality regardless of formatting variations.
 * Example: "+91 98765-43210" matches "919876543210" and "09876543210" (in India).
 */
export function arePhonesEqual(phoneA: string, phoneB: string, defaultCountry = '91'): boolean {
  const normA = normalizePhoneNumber(phoneA, defaultCountry)
  const normB = normalizePhoneNumber(phoneB, defaultCountry)

  if (!normA.isValid || !normB.isValid) return false
  return normA.e164 === normB.e164
}

/**
 * Formats a phone number for clear, recognizable UI display.
 * Example: "+919207293021" -> "+91 92072 93021"
 * Separates country code from national number so users who didn't type "91" can instantly spot the number.
 */
export function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return ''
  const trimmed = phone.trim()
  const cleanDigits = trimmed.replace(/[^\d]/g, '')

  // Indian numbers: +91 followed by 10 digits
  if (cleanDigits.startsWith('91') && cleanDigits.length === 12) {
    const nat = cleanDigits.slice(2)
    return `+91 ${nat.slice(0, 5)} ${nat.slice(5)}`
  }

  // 10-digit national number
  if (cleanDigits.length === 10) {
    return `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`
  }

  // If already starts with + and formatting, keep or add space after country code
  if (trimmed.startsWith('+')) {
    return trimmed
  }

  return trimmed
}

