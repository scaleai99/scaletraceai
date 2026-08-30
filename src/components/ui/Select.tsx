import { cn } from '../../lib/utils'
import { SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
  helper?: string
  placeholder?: string
  required?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helper, placeholder, required, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              'w-full appearance-none rounded-lg border px-3 py-2 pr-8 text-sm bg-white transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
              error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 hover:border-gray-400',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        {!error && helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

/**
 * MultiSelect - controlled multi-select using native <select multiple>.
 * value: string[] of selected option values.
 */
interface MultiSelectProps {
  label?: string
  options: SelectOption[]
  value: string[]
  onChange: (values: string[]) => void
  error?: string
  helper?: string
  required?: boolean
  className?: string
  id?: string
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  error,
  helper,
  required,
  className,
  id,
}: MultiSelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={inputId}
        multiple
        value={value}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions).map((o) => o.value)
          onChange(selected)
        }}
        className={cn(
          'w-full rounded-lg border px-3 py-1 text-sm bg-white transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
          error ? 'border-red-400' : 'border-gray-300',
          className
        )}
        size={Math.min(options.length, 5)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {!error && helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  )
}
