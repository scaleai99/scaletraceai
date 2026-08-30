import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../../../lib/utils'
import { useItemMasterStore } from '../../../../store/itemMasterStore'
import AiExtractionModal from '../AiExtractionModal'
import type { DrawingExtractionResult } from '../../../../types/item-master'

// --- Sub-components ------------------------------------------------------------

function ConfBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100)
  if (confidence >= 0.85) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-green-100 text-green-700 shrink-0">
         {pct}%
      </span>
    )
  }
  if (confidence >= 0.60) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 shrink-0">
         {pct}%
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700 shrink-0">
       {pct}%
    </span>
  )
}

interface FieldProps {
  label: string
  confidenceKey?: string
  children: ReactNode
  alignStart?: boolean
}

function Field({ label, confidenceKey, children, alignStart }: FieldProps) {
  const conf = useItemMasterStore((s) =>
    confidenceKey ? s.confidenceMap[confidenceKey] : undefined
  )
  const flash = useItemMasterStore((s) =>
    confidenceKey ? s.aiFlashFields.has(confidenceKey) : false
  )

  return (
    <div
      className={cn(
        'flex gap-3 py-2 border-b border-[#F0F0F0]',
        alignStart ? 'items-start' : 'items-center'
      )}
    >
      <label className="w-[180px] text-right text-xs text-[#444] shrink-0 mt-1.5 font-medium">
        {label}
      </label>
      <div className={cn('flex-1 flex items-center gap-2', flash && 'animate-ai-flash rounded')}>
        {children}
        {conf !== undefined && <ConfBadge confidence={conf} />}
      </div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0',
        value ? 'bg-[#E8A838]' : 'bg-[#CCCCCC]'
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
          value ? 'translate-x-[18px]' : 'translate-x-[2px]'
        )}
      />
    </button>
  )
}

const inputCls =
  'h-7 w-full border border-[#CCCCCC] rounded px-2 text-xs text-[#222] focus:outline-none focus:border-[#E8A838] transition-colors bg-white'

const selectCls =
  'h-7 border border-[#CCCCCC] rounded px-2 text-xs text-[#222] focus:outline-none focus:border-[#E8A838] bg-white cursor-pointer min-w-[140px]'

const textareaCls =
  'w-full border border-[#CCCCCC] rounded px-2 py-1.5 text-xs text-[#222] focus:outline-none focus:border-[#E8A838] transition-colors bg-white resize-none'

// --- DesignTab -----------------------------------------------------------------

export function DesignTab() {
  const form = useItemMasterStore((s) => s.form)
  const updateOverview = useItemMasterStore((s) => s.updateOverview)
  const applyExtractionResult = useItemMasterStore((s) => s.applyExtractionResult)
  const clearAiFields = useItemMasterStore((s) => s.clearAiFields)
  const apiPermissionGranted = useItemMasterStore((s) => s.apiPermissionGranted)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showModal, setShowModal] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string>('')

  // KEY FIX: store result separately, apply it AFTER modal unmounts
  const [pendingResult, setPendingResult] = useState<DrawingExtractionResult | null>(null)

  const ov = form.overview

  // Apply extraction result AFTER modal has closed (pendingResult set -> modal gone -> effect fires)
  useEffect(() => {
    if (pendingResult && !showModal) {
      console.log('[DesignTab] Applying extraction result to store:', pendingResult.model_used)
      console.log('[DesignTab] drawing_number:', pendingResult.drawing_number?.value)
      console.log('[DesignTab] part_name:', pendingResult.part_name?.value)
      applyExtractionResult(pendingResult)
      setPendingResult(null)
    }
  }, [pendingResult, showModal, applyExtractionResult])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      // Clear any fields populated by a previous drawing so the new PDF's
      // data is never mixed with stale values (fixes "same result for any pdf").
      clearAiFields()
      setPendingResult(null)
      setPendingFile(f)
      setShowModal(true)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  // Called by modal when extraction succeeds - save result, close modal
  function handleExtractionComplete(result: DrawingExtractionResult) {
    console.log('[DesignTab] Extraction complete, saving pending result')
    if (pendingFile) setUploadedFileName(pendingFile.name)
    setPendingResult(result)   // store result
    setShowModal(false)        // close modal - useEffect will apply result after unmount
    setPendingFile(null)
  }

  function handleExtractionError(msg: string) {
    console.error('[DesignTab] Extraction error:', msg)
    setShowModal(false)
    setPendingFile(null)
  }

  return (
    <div className="max-w-2xl">
      {/* Drawing File - FIRST field */}
      <div className="flex items-center gap-3 py-2 border-b border-[#F0F0F0]">
        <label className="w-[180px] text-right text-xs text-[#444] shrink-0 font-medium">
          Drawing File
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[#E8A838] text-sm font-medium hover:underline cursor-pointer"
          >
            Upload
          </button>
          {uploadedFileName && (
            <span className="text-xs text-[#666]"> {uploadedFileName}</span>
          )}
          <span className="text-xs text-[#888]"> Upload PDF drawing - AI will auto-fill all fields</span>
        </div>
      </div>

      {/* Item Category */}
      <Field label="Item Category" confidenceKey="overview.itemCategory">
        <select
          className={selectCls}
          value={ov.itemCategory}
          onChange={(e) => updateOverview({ itemCategory: e.target.value as typeof ov.itemCategory })}
        >
          <option value="">Select...</option>
          <option>Finished</option>
          <option>Semi-Finished</option>
          <option>Raw Material</option>
          <option>Consumable</option>
          <option>Free-Issue</option>
          <option>Service</option>
        </select>
      </Field>

      {/* Item No. */}
      <Field label="Item No." confidenceKey="overview.partNo">
        <input
          className={inputCls}
          value={ov.partNo}
          onChange={(e) => updateOverview({ partNo: e.target.value })}
        />
      </Field>

      {/* Description */}
      <Field label="Description" confidenceKey="overview.description" alignStart>
        <textarea
          className={textareaCls}
          rows={3}
          value={ov.description}
          onChange={(e) => updateOverview({ description: e.target.value })}
        />
      </Field>

      {/* Drawing No. */}
      <Field label="Drawing No." confidenceKey="overview.drawingNo">
        <input
          className={inputCls}
          value={ov.drawingNo}
          onChange={(e) => updateOverview({ drawingNo: e.target.value })}
        />
      </Field>

      {/* Default UOM */}
      <Field label="Default UOM">
        <select
          className={selectCls}
          value={ov.defaultUOM ?? ''}
          onChange={(e) => updateOverview({ defaultUOM: e.target.value })}
        >
          <option value="">No</option>
          <option>Nos</option>
          <option>Kg</option>
          <option>Meter</option>
          <option>Litre</option>
          <option>Set</option>
          <option>Box</option>
        </select>
      </Field>

      {/* Saleable / Purchase toggles side by side */}
      <div className="flex gap-3 py-2 border-b border-[#F0F0F0] items-center">
        <label className="w-[180px] text-right text-xs text-[#444] shrink-0 font-medium">
          Saleable Item
        </label>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Toggle
              value={ov.saleableItem ?? false}
              onChange={(v) => updateOverview({ saleableItem: v })}
            />
            <span className="text-xs text-[#444]">{ov.saleableItem ? 'ON' : 'OFF'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#444] font-medium">Purchase Item</span>
            <Toggle
              value={ov.purchaseItem ?? false}
              onChange={(v) => updateOverview({ purchaseItem: v })}
            />
            <span className="text-xs text-[#444]">{ov.purchaseItem ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      </div>

      {/* Is it Equipment */}
      <Field label="Is it Equipment">
        <Toggle
          value={ov.isEquipment ?? false}
          onChange={(v) => updateOverview({ isEquipment: v })}
        />
        <span className="text-xs text-[#444]">{ov.isEquipment ? 'ON' : 'OFF'}</span>
      </Field>


      {/* Length */}
      <Field label="Length" confidenceKey="overview.length">
        <input
          className={inputCls}
          value={ov.length ?? ''}
          onChange={(e) => updateOverview({ length: e.target.value })}
        />
      </Field>

      {/* Width */}
      <Field label="Width" confidenceKey="overview.width">
        <input
          className={inputCls}
          value={ov.width ?? ''}
          onChange={(e) => updateOverview({ width: e.target.value })}
        />
      </Field>

      {/* Thickness */}
      <Field label="Thickness" confidenceKey="overview.thickness">
        <input
          className={inputCls}
          value={ov.thickness ?? ''}
          onChange={(e) => updateOverview({ thickness: e.target.value })}
        />
      </Field>

      {/* Diameter */}
      <Field label="Diameter (mm)" confidenceKey="overview.diameter">
        <input
          className={inputCls}
          value={ov.diameter ?? ''}
          onChange={(e) => updateOverview({ diameter: e.target.value })}
        />
      </Field>

      {/* Radius */}
      <Field label="Radius (mm)" confidenceKey="overview.radius">
        <input
          className={inputCls}
          value={ov.radius ?? ''}
          onChange={(e) => updateOverview({ radius: e.target.value })}
        />
      </Field>

      {/* Weight */}
      <Field label="Weight (g)" confidenceKey="overview.weight">
        <input
          className={inputCls}
          value={ov.weight ?? ''}
          onChange={(e) => updateOverview({ weight: e.target.value })}
        />
      </Field>

      {/* Color */}
      <Field label="Color">
        <input
          className={inputCls}
          value={ov.color ?? ''}
          onChange={(e) => updateOverview({ color: e.target.value })}
        />
      </Field>

      {/* End Application */}
      <Field label="End Application" alignStart>
        <textarea
          className={textareaCls}
          rows={2}
          value={ov.endApplication ?? ''}
          onChange={(e) => updateOverview({ endApplication: e.target.value })}
        />
      </Field>

      {/* Item Grade */}
      <Field label="Item Grade">
        <select
          className={selectCls}
          value={ov.itemGrade ?? ''}
          onChange={(e) => updateOverview({ itemGrade: e.target.value })}
        >
          <option value="">N.A.</option>
          <option>Grade A</option>
          <option>Grade B</option>
          <option>Grade C</option>
        </select>
      </Field>

      {/* AI Extraction Modal */}
      {showModal && pendingFile && (
        <AiExtractionModal
          file={pendingFile}
          apiPermissionGranted={apiPermissionGranted}
          onComplete={handleExtractionComplete}
          onError={handleExtractionError}
          onClose={() => { setShowModal(false); setPendingFile(null) }}
        />
      )}
    </div>
  )
}

export default DesignTab
