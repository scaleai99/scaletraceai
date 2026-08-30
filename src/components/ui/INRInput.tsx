import { InputHTMLAttributes, useState, FocusEvent } from 'react'
import { cn } from '../../lib/utils'
import { formatINR } from '../../lib/utils'

interface INRInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  label?: string
  /** Controlled numeric value. null represents an empty / unset field. */
  value: number | null
  onChange: (value: number | null) => void
  error?: string
  helper?: string
  required?: boolean
}

/**
 * INRInput - controlled numeric input with Indian Rupee formatting.
 *
 * - While focused: shows the raw number for easy editing.
 * - On blur: formats to "1,00,000.00" using Indian grouping (Intl.NumberFormat en-IN).
 * - Stores raw number; null represents empty/unset.
 *
 * Property 5 - parse(format(V)) == V must hold.
 */
export function INRInput({
  label,
  value,
  onChange,
  error,
  helper,
  required,
  className,
  onBlur,
  onFocus,
  id,
  ...props
}: INRInputProps) {
  const [focused, setFocused] = useState(false)
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  // While focused show the raw number; when blurred show the formatted string
  const displayValue: string = focused
    ? (value != null ? String(value) : '')
    : (value != null ? formatINR(value) : '')

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setFocused(true)
    onFocus?.(e)
  }

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setFocused(false)
    onBlur?.(e)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '' || raw === '-') {
      onChange(null)
      return
    }
    const n = parseFloat(raw)
    onChange(isNaN(n) ? null : n)
  }

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={focused ? 'number' : 'text'}
        inputMode="decimal"
        value={displayValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        className={cn(
          'w-full rounded-lg border px-3 py-2 text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
          'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
          error
            ? 'border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400'
            : 'border-gray-300 bg-white hover:border-gray-400',
          // Right-align currency values
          'text-right',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {!error && helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  )
}
