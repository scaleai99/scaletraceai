/**
 * RfqSuggestionCard
 *
 * Displayed after a successful drawing extraction when the backend suggests
 * creating an RFQ from the extracted data. Confirm-then-act: no RFQ is
 * created without the user clicking "Create RFQ".
 *
 * Props:
 *   suggestion   "" agent_suggestion from the extraction response
 *   onDismiss    "" called when user clicks Dismiss
 *   onConfirm    "" called when user clicks Create RFQ (passes the draft data)
 */

import { useState } from 'react'
import { Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { AgentSuggestion, RfqLineDraft } from '../../types/item-master'

interface RfqSuggestionCardProps {
  suggestion: AgentSuggestion
  onDismiss: () => void
  onConfirm: (rfqDraft: object, lineDraft: RfqLineDraft) => void
}

function ConfidencePill({ label }: { label: string }) {
  const cls =
    label === 'high'
      ? 'bg-green-100 text-green-700'
      : label === 'medium'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-red-100 text-red-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${cls}`}>
      {label}
    </span>
  )
}

export function RfqSuggestionCard({ suggestion, onDismiss, onConfirm }: RfqSuggestionCardProps) {
  const [expanded, setExpanded] = useState(false)

  if (!suggestion.should_suggest) return null

  const line = suggestion.line_item_draft
  const rfq = suggestion.rfq_draft

  return (
    <div className="mt-4 border border-amber-200 bg-amber-50 rounded-lg p-4 shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              AI suggests creating an RFQ from this drawing
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-amber-700">
                {Math.round(suggestion.confidence * 100)}% confidence
              </span>
              <ConfidencePill label={suggestion.confidence_label} />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-amber-500 hover:text-amber-700 p-0.5 rounded transition-colors"
          aria-label="Dismiss suggestion"
        >
          <X size={14} />
        </button>
      </div>

      {/* Reason */}
      <p className="text-xs text-amber-700 mt-2">{suggestion.reason}</p>

      {/* Expandable draft preview */}
      {line && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 mt-2 transition-colors"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Hide draft fields' : 'Preview draft RFQ fields'}
        </button>
      )}

      {expanded && line && (
        <div className="mt-2 bg-white rounded border border-amber-100 p-3 grid grid-cols-2 gap-x-4 gap-y-1">
          {[
            ['Drawing No.', line.drawing_number],
            ['Revision', line.drawing_revision],
            ['Part Description', line.part_description],
            ['Material Spec', line.material_spec],
            ['Surface Treatment', line.surface_treatment_spec],
            ['Annual Qty', String(line.annual_quantity)],
            ['Due Date', rfq?.quotation_due_date ?? '""'],
          ].map(([label, value]) =>
            value ? (
              <div key={label} className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500 font-medium min-w-[90px]">{label}:</span>
                <span className="text-[10px] text-gray-800 truncate">{value}</span>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => rfq && line && onConfirm(rfq, line)}
          className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5"
        >
          <Sparkles size={12} />
          Create RFQ from Drawing
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="px-4 py-1.5 border border-amber-300 text-amber-700 text-xs font-medium rounded hover:bg-amber-100 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
