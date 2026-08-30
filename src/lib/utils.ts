import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind class names, resolving conflicts via tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a numeric value as an INR currency string using Indian grouping.
 * e.g. 100000 -> "1,00,000.00"
 *
 * Indian grouping: last group is 3 digits, all subsequent groups are 2 digits.
 * Property 5: parse(format(V)) == V must hold.
 */
export function formatINR(value: number): string {
  if (!isFinite(value)) return '0.00'

  // Format using Intl.NumberFormat with en-IN locale - this handles Indian grouping natively
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

  return `${formatted}`
}

/**
 * Parse an INR-formatted string back to a number.
 * Strips  symbol, commas and whitespace, then parses as float.
 */
export function parseINR(value: string): number {
  const cleaned = value.replace(/[,\s]/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

/**
 * Validate a GSTIN string against the official format:
 * ^[0-9]{2}[A-Z]{5}[A-Z0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$
 *
 * Property 3: validator SHALL accept if and only if the string matches this regex.
 */
export function validateGSTIN(gstin: string): boolean {
  const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[A-Z0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
  return GSTIN_REGEX.test(gstin)
}

/**
 * Format a timestamp as DD/MM/YYYY for display per requirements.
 * Accepts ISO string, Date object, or epoch number.
 */
export function formatDate(value: string | Date | number | null | undefined): string {
  if (value == null) return '-'
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Format a timestamp as DD/MM/YYYY HH:mm for datetime display.
 */
export function formatDateTime(value: string | Date | number | null | undefined): string {
  if (value == null) return '-'
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Indian Financial Year date range utilities (Req 33.5, 27.2).
 *
 * The Indian FY runs from April 1 to March 31.
 * For a date between April 1 and December 31, the FY start year equals that year.
 * For a date between January 1 and March 31, the FY start year equals year - 1.
 */

export interface DateRange {
  from: Date
  to: Date
}

/**
 * Return the Indian FY that contains the given date.
 *
 * @param d - Reference date (defaults to today)
 * @returns { from: Date, to: Date } spanning April 1 - March 31 of the FY
 *
 * @example
 * // Called on 2025-07-15
 * getIndianFYForDate(new Date('2025-07-15'))
 * // â†’ { from: 2025-04-01, to: 2026-03-31 }
 *
 * // Called on 2025-02-20
 * getIndianFYForDate(new Date('2025-02-20'))
 * // â†’ { from: 2024-04-01, to: 2025-03-31 }
 */
export function getIndianFYForDate(d: Date = new Date()): DateRange {
  const month = d.getMonth() + 1 // JS months are 0-indexed
  const year = d.getFullYear()
  const fyStartYear = month >= 4 ? year : year - 1
  return {
    from: new Date(fyStartYear, 3, 1),         // April 1 (month index 3)
    to: new Date(fyStartYear + 1, 2, 31),      // March 31 (month index 2)
  }
}

/**
 * Return the **current** Indian Financial Year date range.
 *
 * @returns { from: Date, to: Date } for the FY containing today
 */
export function getIndianFYRange(): DateRange {
  return getIndianFYForDate(new Date())
}

/**
 * Return the **previous** Indian Financial Year date range.
 *
 * @returns { from: Date, to: Date } for the FY before the current one
 */
export function getPreviousIndianFYRange(): DateRange {
  const { from: currentStart } = getIndianFYRange()
  const prevFYStartYear = currentStart.getFullYear() - 1
  return {
    from: new Date(prevFYStartYear, 3, 1),     // April 1
    to: new Date(prevFYStartYear + 1, 2, 31),  // March 31
  }
}

/**
 * Format a Date as YYYY-MM-DD for API query parameters.
 *
 * @param d - The date to format
 * @returns ISO date string in YYYY-MM-DD format
 */
export function toISODateString(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
