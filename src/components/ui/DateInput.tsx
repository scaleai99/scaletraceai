import { cn } from '../../lib/utils'
import { forwardRef, InputHTMLAttributes } from 'react'

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string
  /** ISO date string YYYY-MM-DD - value for the HTML date input */
  value: string
  onChange: (isoDate: string) => void
  error?: string
  helper?: string
  required?: boolean
}

/**
 * DateInput - a thin wrapper around <input type"date">.
 *
 * The browser renders the native date picker in locale format (DD/MM/YYYY on
 * most Indian systems). The value prop and onChange callback always use the
 * ISO YYYY-MM-DD format so it integrates cleanly with the backend.
 *
 * For display, use formatDate() from lib/utils which renders as DD/MM/YYYY.
 */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ label, value, onChange, error, helper, required, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full rounded-lg border px-3 py-2 text-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
            'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
            error
              ? 'border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400'
              : 'border-gray-300 bg-white hover:border-gray-400',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        {!error && helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
      </div>
    )
  }
)
DateInput.displayName = 'DateInput'
