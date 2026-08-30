import { useState, FocusEvent } from 'react'
import { Input } from './Input'
import { Button } from './Button'
import { validateGSTIN } from '../../lib/utils'

interface GSTINInputProps {
  label?: string
  value: string
  onChange: (v: string) => void
  /** If provided, a "Lookup" button is shown. Called with the valid GSTIN. */
  onLookup?: (gstin: string) => Promise<void>
  /** External error (e.g. from API) - shown below the input */
  error?: string
  required?: boolean
  disabled?: boolean
}

/**
 * GSTINInput - validated GSTIN field with optional GSTN portal lookup.
 *
 * Property 3: validates against ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$
 * Format error is shown on blur. Lookup button is disabled if format is invalid.
 */
export function GSTINInput({
  label = 'GSTIN',
  value,
  onChange,
  onLookup,
  error,
  required,
  disabled,
}: GSTINInputProps) {
  const [lookupLoading, setLookupLoading] = useState(false)
  const [formatError, setFormatError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Uppercase and strip spaces - GSTIN is always uppercase
    onChange(e.target.value.toUpperCase().trim())
    // Clear format error while user types
    if (formatError) setFormatError(null)
  }

  const handleBlur = (_e: FocusEvent<HTMLInputElement>) => {
    if (value && !validateGSTIN(value)) {
      setFormatError('Invalid GSTIN - expected format: 22AAAAA0000A1Z5')
    } else {
      setFormatError(null)
    }
  }

  const handleLookup = async () => {
    if (!validateGSTIN(value)) {
      setFormatError('Invalid GSTIN - expected format: 22AAAAA0000A1Z5')
      return
    }
    setLookupLoading(true)
    try {
      await onLookup!(value)
    } finally {
      setLookupLoading(false)
    }
  }

  const displayError = formatError ?? error

  return (
    <div className="w-full">
      <div className="flex gap-2 items-end">
        <div className="flex-1 min-w-0">
          <Input
            label={label}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            error={displayError ?? undefined}
            maxLength={15}
            placeholder="22AAAAA0000A1Z5"
            required={required}
            disabled={disabled}
            // Monospace makes the pattern legible
            className="font-mono tracking-wider"
          />
        </div>
        {onLookup && (
          <Button
            variant="secondary"
            size="md"
            type="button"
            onClick={handleLookup}
            loading={lookupLoading}
            disabled={disabled || !value || !validateGSTIN(value)}
            className="shrink-0 mb-[1px]"
          >
            Lookup
          </Button>
        )}
      </div>
    </div>
  )
}
