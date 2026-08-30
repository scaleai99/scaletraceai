import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../../lib/utils'
import { extractDrawing } from '../../../api/extractDrawing'
import type { DrawingExtractionResult, AgentSuggestion, RfqLineDraft } from '../../../types/item-master'
import { RfqSuggestionCard } from '../../../components/ui/RfqSuggestionCard'

interface AiExtractionModalProps {
  file: File
  onComplete: (result: DrawingExtractionResult) => void
  onError: (msg: string) => void
  onClose: () => void
  apiPermissionGranted: boolean
}

type ModalState = 'extracting' | 'success' | 'error'

const STEPS = [
  { threshold: 20,  label: 'Reading PDF & running EasyOCR...' },
  { threshold: 45,  label: 'Step 1: EasyOCR text extraction (primary)...' },
  { threshold: 70,  label: 'Step 2: On-premise AI (Ollama) - only if needed...' },
  { threshold: 90,  label: 'Step 3: Vision AI - last resort...' },
  { threshold: 100, label: 'Populating form fields...' },
]

function getProviderStatus(progress: number, _currentMsg: string): string {
  if (progress < 20) return 'EasyOCR: rendering PDF at 200 DPI...'
  if (progress < 45) return 'EasyOCR: reading title block & parsing fields...'
  if (progress < 70) return 'On-premise AI (Ollama) fallback if OCR insufficient...'
  if (progress < 90) return 'Vision AI last resort...'
  return 'Finalizing extraction...'
}
function getActiveStep(progress: number): number {
  for (let i = 0; i < STEPS.length; i++) {
    if (progress < STEPS[i].threshold) return i
  }
  return STEPS.length - 1
}

function ConfBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100)
  if (confidence >= 0.85) return <span className="text-[10px] font-medium text-green-600">{pct}%</span>
  if (confidence >= 0.60) return <span className="text-[10px] font-medium text-amber-600">{pct}%</span>
  return <span className="text-[10px] font-medium text-red-600">{pct}%</span>
}

// Non-LLM fallbacks: the local LLM did NOT read the drawing; data came from
// filename/regex heuristics, PDF metadata, or demo mode. Surfaced to the user
// so a low-quality extraction is never mistaken for a real AI read.
function isFallbackModel(modelUsed: string): boolean {
  const m = (modelUsed || '').toLowerCase()
  return (
    (m.includes('regex') && !m.includes('easyocr')) ||
    m.includes('filename') ||
    m.includes('structured-metadata') ||
    m.includes('metadata') ||
    m.includes('mock') ||
    m === '' ||
    m === 'none'
  )
}

function providerLabel(modelUsed: string): string {
  if (modelUsed.includes('ollama')) return `On-Premise Ollama (${modelUsed.replace('ollama/', '')})`
  if (modelUsed.includes('mistral')) return `Mistral AI (${modelUsed.replace('mistral/', '')})`
  if (modelUsed.includes('groq')) return `Groq (${modelUsed.replace('groq/', '')})`
  if (modelUsed.includes('gemini')) return `Google Gemini`
  if (modelUsed.includes('mock')) return `Demo mode (no AI)`
  if (modelUsed.includes('easyocr')) return `EasyOCR on-premise (Apache 2.0)`
  if (modelUsed.includes('regex') || modelUsed.includes('filename')) return `Filename/regex fallback (Ollama did not read the drawing)`
  if (modelUsed.includes('metadata')) return `PDF metadata fallback (Ollama did not read the drawing)`
  return modelUsed
}

export default function AiExtractionModal({
  file,
  onComplete,
  onError,
  onClose,
}: AiExtractionModalProps) {
  const [modalState, setModalState] = useState<ModalState>('extracting')
  const [progress, setProgress] = useState(0)
  const [currentMsg, setCurrentMsg] = useState('Uploading file...')
  const [result, setResult] = useState<DrawingExtractionResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [suggestionDismissed, setSuggestionDismissed] = useState(false)
  const cancelledRef = useRef(false)
  const navigate = useNavigate()

  const activeStep = getActiveStep(progress)

  useEffect(() => {
    cancelledRef.current = false

    const run = async () => {
      try {
        setProgress(0)
        setCurrentMsg('Uploading file...')
        setModalState('extracting')

        const res = await extractDrawing(
          file,
          true, // always allow API fallback - backend decides which provider
          (pct, msg) => {
            if (!cancelledRef.current) {
              setProgress(pct)
              setCurrentMsg(msg)
            }
          }
        )

        if (cancelledRef.current) return

        console.log('[Modal] Got result from backend:', res.model_used)
        console.log('[Modal] drawing_number:', res.drawing_number?.value)
        console.log('[Modal] part_name:', res.part_name?.value)

        // Check if we actually got any data
        const hasData =
          (res.drawing_number?.value != null) ||
          (res.part_name?.value != null) ||
          (res.revision?.value != null)

        if (!hasData) {
          console.warn('[Modal] All fields null - backend may be running old code')
          setErrorMsg(
            'AI returned empty data.\n\n' +
            'Fix: Stop the backend (Ctrl+C) and restart it:\n' +
            'python -m uvicorn app.main:app --reload --port 8001\n\n' +
            'Then try uploading again.'
          )
          setModalState('error')
          return
        }

        setProgress(100)
        setCurrentMsg('Extraction complete')
        setResult(res)
        setModalState('success')

        // Call onComplete immediately - fields will populate behind the modal
        onComplete(res)

        // Close modal after 2 seconds showing success
        setTimeout(() => {
          if (!cancelledRef.current) onClose()
        }, 2000)

      } catch (err) {
        if (cancelledRef.current) return
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[Modal] Extraction error:', msg)
        setErrorMsg(msg)
        setModalState('error')
        onError(msg)
      }
    }

    void run()

    return () => {
      cancelledRef.current = true
    }
  }, [retryKey]) // retryKey causes re-run when user clicks Retry

  // Build field summary for success state
  const fieldSummary: Array<{ label: string; value: string; confidence: number }> = []
  if (result) {
    const fields: Array<[keyof DrawingExtractionResult, string]> = [
      ['drawing_number', 'Drawing No'],
      ['part_name',      'Part Name'],
      ['revision',       'Revision'],
      ['material_spec',  'Material Spec'],
      ['length_mm',      'Length (mm)'],
      ['diameter_mm',    'Diameter (mm)'],
      ['surface_treatment', 'Surface Treatment'],
      ['drawing_date',   'Drawing Date'],
    ]
    for (const [key, label] of fields) {
      const f = result[key]
      if (f && typeof f === 'object' && 'value' in f && f.value != null) {
        fieldSummary.push({ label, value: String(f.value), confidence: f.confidence })
      }
    }
  }

  const avgConf = fieldSummary.length > 0
    ? Math.round(fieldSummary.reduce((s, f) => s + f.confidence, 0) / fieldSummary.length * 100)
    : 0

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl w-[500px] p-6 mx-4 animate-modal-in">

        {/* Header */}
        <div className="mb-4">
          <h2 className="font-semibold text-base text-[#222]"> AI Drawing Extraction</h2>
          <p className="text-xs text-gray-500 mt-0.5"> {file.name}</p>
        </div>

        <div className="border-t border-[#E5E5E5] mb-4" />

        {/* -- EXTRACTING -- */}
        {modalState === 'extracting' && (
          <div>
            {/* Steps */}
            <ul className="space-y-2.5 mb-5">
              {STEPS.map((step, i) => (
                <li key={i} className="flex items-center gap-2.5 text-xs">
                  {i < activeStep ? (
                    <span className="text-green-500 text-sm shrink-0"></span>
                  ) : i === activeStep ? (
                    <span className="shrink-0 inline-block w-4 h-4 border-2 border-[#E8A838] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="shrink-0 w-4 h-4 rounded-full border border-[#CCC]" />
                  )}
                  <span className={cn(
                    'transition-colors',
                    i < activeStep ? 'text-green-600' :
                    i === activeStep ? 'text-[#333] font-medium' :
                    'text-[#AAA]'
                  )}>
                    {step.label}
                  </span>
                </li>
              ))}
            </ul>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-[#E8A838] h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-[#888] mt-2">{progress}% - {currentMsg}</p>
            <p className="text-xs text-gray-400 mt-2">
              {getProviderStatus(progress, currentMsg)}
            </p>
          </div>
        )}

        {/* -- SUCCESS -- */}
        {modalState === 'success' && result && (
          <div>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2"></div>
              <p className="font-semibold text-green-600 text-sm">Extraction Complete!</p>
              <p className="text-xs text-[#666] mt-1">
                {fieldSummary.length} fields populated  Avg confidence: {avgConf}%  via {providerLabel(result.model_used)}
              </p>
            </div>

            {isFallbackModel(result.model_used) && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 mb-4 text-left">
                <p className="text-[11px] font-semibold text-amber-800">
                  &#9888; Local AI did not read this drawing
                </p>
                <p className="text-[11px] text-amber-700 mt-1 leading-snug">
                  These values came from a filename/metadata fallback
                  (<span className="font-mono">{result.model_used}</span>), not the on-premise
                  Ollama model, so accuracy is limited. Verify the on-premise LLM is running:
                  start Ollama, pull the text model
                  (<span className="font-mono">ollama pull qwen3:8b</span>), restart the backend
                  on port 8001, then re-upload.
                </p>
              </div>
            )}

            {fieldSummary.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-[#F9F9F9] rounded-lg p-3 mb-4 border border-[#E5E5E5]">
                {fieldSummary.map((f, i) => (
                  <div key={i} className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-[#555] truncate">
                      <span className="font-medium">{f.label}:</span> {f.value}
                    </span>
                    <ConfBadge confidence={f.confidence} />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2 bg-[#E8A838] hover:bg-[#D4962E] text-white text-sm rounded font-medium transition-colors"
            >
              View Populated Fields "
            </button>

            {result.agent_suggestion?.should_suggest && !suggestionDismissed && (
              <RfqSuggestionCard
                suggestion={result.agent_suggestion as AgentSuggestion}
                onDismiss={() => setSuggestionDismissed(true)}
                onConfirm={(_rfqDraft, lineDraft: RfqLineDraft) => {
                  navigate('/rfqs/new', {
                    state: {
                      from_drawing: true,
                      line_item_draft: lineDraft,
                      rfq_draft: result.agent_suggestion?.rfq_draft,
                    }
                  })
                  onClose()
                }}
              />
            )}
          </div>
        )}

        {/* -- ERROR -- */}
        {modalState === 'error' && (
          <div>
            <div className="text-center mb-3">
              <div className="text-3xl mb-2"></div>
              <p className="font-semibold text-red-600 text-sm">Extraction Failed</p>
            </div>
            <pre className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[11px] text-red-800 whitespace-pre-wrap mb-4 max-h-40 overflow-y-auto">
              {errorMsg}
            </pre>
            <div className="flex gap-2">
              <button
                onClick={() => setRetryKey(k => k + 1)}
                className="flex-1 py-2 bg-[#E8A838] hover:bg-[#D4962E] text-white text-sm rounded font-medium transition-colors"
              >
                 Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 border border-[#CCC] text-[#666] text-sm rounded font-medium hover:bg-[#F4F4F4] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
