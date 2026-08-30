import { Upload, X, FileText } from 'lucide-react'
import { useRef, useState, DragEvent, ChangeEvent } from 'react'
import { cn } from '../../lib/utils'

interface FileUploadProps {
  /** File type filter for the input. e.g. ".pdf", ".pdf,.zip" */
  accept?: string
  /** Maximum file size in MB. Default 50. */
  maxSizeMB?: number
  /** Called when a valid file is chosen */
  onFile: (file: File) => void
  /** Field label */
  label?: string
  /** Controlled: currently selected file */
  value?: File | null
  /** Called when the user removes the selected file */
  onClear?: () => void
  /** Additional wrapper className */
  className?: string
  /** Whether the field is disabled */
  disabled?: boolean
}

export function FileUpload({
  accept = '.pdf',
  maxSizeMB = 50,
  onFile,
  label,
  value,
  onClear,
  className,
  disabled = false,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validate = (file: File): string | null => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the ${maxSizeMB} MB limit`
    }
    return null
  }

  const handleFile = (file: File) => {
    const err = validate(file)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    onFile(file)
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so the same file can be re-selected after clearing
    e.target.value = ''
  }

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      )}

      {value ? (
        // File selected - show filename chip
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
          <FileText size={20} className="text-amber-600 shrink-0" />
          <span className="text-sm text-gray-700 flex-1 truncate" title={value.name}>
            {value.name}
          </span>
          <span className="text-xs text-gray-400 shrink-0">
            {(value.size / 1024 / 1024).toFixed(1)} MB
          </span>
          {onClear && !disabled && (
            <button
              type="button"
              onClick={onClear}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
              aria-label="Remove file"
            >
              <X size={15} />
            </button>
          )}
        </div>
      ) : (
        // Drop zone
        <div
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => { if (!disabled) inputRef.current?.click() }}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
          aria-label={`Upload file. ${label ?? ''}`}
          className={cn(
            'border-2 border-dashed rounded-lg px-6 py-8 text-center transition-colors',
            disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
              : dragOver
                ? 'border-amber-400 bg-amber-50 cursor-copy'
                : 'border-gray-300 hover:border-amber-400 hover:bg-gray-50 cursor-pointer'
          )}
        >
          <Upload
            size={24}
            className={cn('mx-auto mb-2', dragOver ? 'text-amber-500' : 'text-gray-400')}
          />
          <p className="text-sm text-gray-600">
            Drop file here or{' '}
            <span className="text-amber-600 font-medium">browse</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Max {maxSizeMB} MB  {accept}
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onInputChange}
        disabled={disabled}
        aria-hidden="true"
      />

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
