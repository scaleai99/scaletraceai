/**
 * AiExtractionPanel - Module 05 / 06 frontend wiring
 *
 * Responsibilities:
 *  - Shows a FileUpload when no PDF is selected.
 *  - On file selection: immediately POSTs to /api/v1/drawings/extract.
 *  - Shows a loading spinner while extraction runs.
 *  - On result: renders a field table with ConfidenceBadge per field.
 *  - Below the extraction table: renders a Specification Detection table.
 *  - Shows a ZIP batch-upload button that calls batch-upload and tracks progress.
 */

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Loader2, Package, Upload, CheckCircle2, AlertTriangle } from 'lucide-react'

import { FileUpload } from './FileUpload'
import { ConfidenceBadge } from './ConfidenceBadge'
import { Badge } from './Badge'

import type {
  ExtractionResult,
  SpecDetection,
  BatchUploadResponse,
  BatchJobStatus,
} from '../../types/extraction'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AiExtractionPanelProps {
  /** Controlled PDF file - parent may pre-supply a file */
  pdfFile?: File | null
  /** Called when extraction completes */
  onResult?: (result: ExtractionResult) => void
  /** Called when spec detection completes (after extraction) */
  onSpecsDetected?: (specs: SpecDetection[]) => void
  /** RFQ id for batch upload endpoint */
  rfqId?: string
  className?: string
}

// ---------------------------------------------------------------------------
// Field display label mapping
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
  part_number: 'Part Number',
  drawing_number: 'Drawing Number',
  revision: 'Revision',
  part_name: 'Part Name',
  material_spec: 'Material Specification',
  dimensions: 'Dimensions',
  special_processes: 'Special Processes',
  surface_treatment: 'Surface Treatment',
  bom_items: 'BOM Items',
}

const EXTRACTION_FIELDS = Object.keys(FIELD_LABELS)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function valueToDisplay(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === 'object' && item !== null
          ? Object.values(item).join('  ')
          : String(item)
      )
      .join(', ')
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join('  ')
  }
  return String(value)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AiExtractionPanel({
  pdfFile: pdfFileProp,
  onResult,
  onSpecsDetected,
  rfqId,
  className,
}: AiExtractionPanelProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(pdfFileProp ?? null)
  const [extracting, setExtracting] = useState(false)
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null)
  const [specs, setSpecs] = useState<SpecDetection[]>([])
  const [extractError, setExtractError] = useState<string | null>(null)

  // Batch upload state
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [batchUploading, setBatchUploading] = useState(false)
  const [batchJob, setBatchJob] = useState<BatchJobStatus | null>(null)
  const [batchError, setBatchError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Pending result pattern (React 18 concurrent mode safe)
  const [pendingResult, setPendingResult] = useState<ExtractionResult | null>(null)
  const [pendingSpecs, setPendingSpecs] = useState<SpecDetection[] | null>(null)

  // Sync prop changes
  useEffect(() => {
    if (pdfFileProp !== undefined) setPdfFile(pdfFileProp)
  }, [pdfFileProp])

  // Apply pending result outside render
  useEffect(() => {
    if (pendingResult) {
      setExtractionResult(pendingResult)
      onResult?.(pendingResult)
      setPendingResult(null)
    }
  }, [pendingResult, onResult])

  useEffect(() => {
    if (pendingSpecs) {
      setSpecs(pendingSpecs)
      onSpecsDetected?.(pendingSpecs)
      setPendingSpecs(null)
    }
  }, [pendingSpecs, onSpecsDetected])

  // ---------------------------------------------------------------------------
  // Auto-extract on file selection
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!pdfFile) return
    void handleExtract(pdfFile)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfFile])

  const handleExtract = async (file: File) => {
    setExtracting(true)
    setExtractError(null)
    setExtractionResult(null)
    setSpecs([])

    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data: result } = await axios.post<ExtractionResult>(
        '/api/v1/drawings/extract',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      setPendingResult(result)

      // Auto-run spec detection using drawing_number + raw text
      if (result._db_id) {
        try {
          // Collect raw text from extraction result for spec detection
          const rawText = Object.entries(result)
            .filter(([k]) => !k.startsWith('_'))
            .map(([, v]) => {
              if (typeof v === 'object' && v !== null && 'value' in v) {
                return valueToDisplay((v as { value: unknown }).value)
              }
              return ''
            })
            .join(' ')

          const { data: detectedSpecs } = await axios.post<SpecDetection[]>(
            '/api/v1/ai/detect-specs',
            {
              text: rawText,
              drawing_extraction_id: result._db_id,
            }
          )
          setPendingSpecs(detectedSpecs)
        } catch {
          // Spec detection failure is non-fatal
        }
      }
    } catch (err) {
      const msg =
        axios.isAxiosError(err)
          ? (err.response?.data?.detail ?? err.message)
          : 'Extraction failed'
      setExtractError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setExtracting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Batch ZIP upload
  // ---------------------------------------------------------------------------

  const handleBatchUpload = async () => {
    if (!zipFile || !rfqId) return
    setBatchUploading(true)
    setBatchError(null)
    setBatchJob(null)

    try {
      const formData = new FormData()
      formData.append('file', zipFile)

      const { data: jobResp } = await axios.post<BatchUploadResponse>(
        `/api/v1/rfqs/${rfqId}/batch-upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      // Start polling for status
      setBatchJob({
        job_id: jobResp.job_id,
        total: jobResp.total,
        processed: 0,
        failed: [],
        completed: [],
        status: 'processing',
      })

      pollRef.current = setInterval(async () => {
        try {
          const { data: status } = await axios.get<BatchJobStatus>(
            `/api/v1/rfqs/batch-status/${jobResp.job_id}`
          )
          setBatchJob(status)
          if (status.status === 'completed') {
            clearInterval(pollRef.current!)
            setBatchUploading(false)
          }
        } catch {
          clearInterval(pollRef.current!)
          setBatchUploading(false)
        }
      }, 1500)
    } catch (err) {
      const msg =
        axios.isAxiosError(err)
          ? (err.response?.data?.detail ?? err.message)
          : 'Batch upload failed'
      setBatchError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      setBatchUploading(false)
    }
  }

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={`space-y-6 ${className ?? ''}`}>
      {/* -- PDF file selector --------------------------------------- */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <Package size={16} className="text-amber-600" />
          AI Drawing Extraction
        </h3>
        <FileUpload
          accept=".pdf"
          maxSizeMB={50}
          label="Upload Engineering Drawing (PDF)"
          value={pdfFile}
          onFile={(f) => setPdfFile(f)}
          onClear={() => {
            setPdfFile(null)
            setExtractionResult(null)
            setSpecs([])
            setExtractError(null)
          }}
        />
      </div>

      {/* -- Loading spinner ----------------------------------------- */}
      {extracting && (
        <div className="flex items-center gap-3 py-4 text-amber-600">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Extracting drawing data...</span>
        </div>
      )}

      {/* -- Extraction error ---------------------------------------- */}
      {extractError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{extractError}</span>
        </div>
      )}

      {/* -- Extraction result table --------------------------------- */}
      {extractionResult && !extracting && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700">Extraction Results</h4>
            <span className="text-xs text-gray-400">
              Model: {extractionResult._meta?.model_used ?? '-'} {' '}
              {extractionResult._meta?.processing_ms ?? 0} ms
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Field
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Value
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {EXTRACTION_FIELDS.map((fieldKey) => {
                  const resultAny = extractionResult as unknown as Record<string, { value: unknown; confidence: number }>
                  const field = resultAny[fieldKey]
                  const value = field?.value
                  const confidence = field?.confidence ?? null

                  return (
                    <tr
                      key={fieldKey}
                      className={
                        confidence !== null && confidence < 0.6
                          ? 'bg-red-50'
                          : confidence !== null && confidence < 0.85
                          ? 'bg-amber-50'
                          : ''
                      }
                    >
                      <td className="px-4 py-2 text-gray-600 font-medium whitespace-nowrap">
                        {FIELD_LABELS[fieldKey]}
                      </td>
                      <td className="px-4 py-2 text-gray-900">
                        {value !== null && value !== undefined ? (
                          <span className="font-mono text-xs">{valueToDisplay(value)}</span>
                        ) : (
                          <span className="text-gray-400 text-xs">Not found</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <ConfidenceBadge score={value !== null ? confidence : null} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -- Specification Detection table --------------------------- */}
      {specs.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Specification Detections ({specs.length})
          </h4>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Specification
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Family
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Qualified
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {specs.map((spec) => (
                  <tr key={spec.spec_number}>
                    <td className="px-4 py-2 font-mono text-xs text-gray-900 whitespace-nowrap">
                      {spec.spec_number}
                    </td>
                    <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                      {spec.family.replace('_', '-')}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {spec.process_category ?? '-'}
                    </td>
                    <td className="px-4 py-2">
                      {spec.scale_qualified ? (
                        <span className="inline-flex items-center gap-1 text-green-700 text-xs">
                          <CheckCircle2 size={12} /> Yes
                          {spec.qualification_expiry && (
                            <span className="text-gray-400 ml-1">
                              (exp. {spec.qualification_expiry})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-red-600 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {spec.is_unknown ? (
                        <Badge variant="warning">Unknown - add to master</Badge>
                      ) : (
                        <Badge variant="success">Found</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -- Batch ZIP upload ---------------------------------------- */}
      {rfqId && (
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Upload size={15} className="text-amber-600" />
            Batch ZIP Upload (up to 150 drawings)
          </h4>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <FileUpload
                accept=".zip"
                maxSizeMB={500}
                label="ZIP Archive"
                value={zipFile}
                onFile={(f) => setZipFile(f)}
                onClear={() => {
                  setZipFile(null)
                  setBatchJob(null)
                  setBatchError(null)
                }}
                disabled={batchUploading}
              />
            </div>
            <button
              type="button"
              disabled={!zipFile || batchUploading}
              onClick={handleBatchUpload}
              className="mb-0 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {batchUploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload ZIP'
              )}
            </button>
          </div>

          {/* Batch error */}
          {batchError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {batchError}
            </div>
          )}

          {/* Batch progress */}
          {batchJob && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  {batchJob.processed} / {batchJob.total} processed
                  {batchJob.failed.length > 0 && (
                    <span className="text-red-600 ml-2">
                       {batchJob.failed.length} failed
                    </span>
                  )}
                </span>
                <span className={batchJob.status === 'completed' ? 'text-green-600' : 'text-amber-600'}>
                  {batchJob.status === 'completed' ? 'Completed' : 'Processing...'}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    batchJob.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'
                  }`}
                  style={{
                    width:
                      batchJob.total > 0
                        ? `${Math.round((batchJob.processed / batchJob.total) * 100)}%`
                        : '0%',
                  }}
                />
              </div>

              {/* Failed files */}
              {batchJob.failed.length > 0 && (
                <div className="text-xs text-red-600 space-y-1">
                  {batchJob.failed.map((f) => (
                    <div key={f.filename}>
                      <span className="font-medium">{f.filename}</span>: {f.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
