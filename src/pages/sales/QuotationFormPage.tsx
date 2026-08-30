/**
 * QuotationFormPage - Module 10: Quotation creation redirect.
 *
 * Quotations are created from approved RFQs via the RFQ detail page.
 * This page explains the correct workflow and links to RFQ Management.
 */

import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { Button } from '../../components/ui'

export function QuotationFormPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => navigate('/sales/quotations')}
          className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded"
          aria-label="Back to Quotations"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Quotation</h1>
          <p className="text-sm text-gray-500 mt-0.5">Module 10 - Quotation creation</p>
        </div>
      </div>

      {/* Workflow guidance card */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Info size={22} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-semibold text-amber-900">
              Quotations are created from an approved RFQ
            </h2>
            <p className="text-sm text-amber-800 mt-1.5 leading-relaxed">
              The correct workflow is to open an RFQ in <span className="font-semibold">Approved</span> state
              and use the <span className="font-semibold">Create Quotation</span> action on that page.
              This links the quotation to the originating RFQ and customer automatically.
            </p>
          </div>
        </div>

        <ol className="text-sm text-amber-800 space-y-2 list-none">
          <li className="flex items-start gap-2">
            <span className="bg-amber-200 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
            <span>Go to <span className="font-medium">RFQ Management</span> and find the relevant RFQ.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-amber-200 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
            <span>Advance the RFQ to <span className="font-medium">Approved</span> state (via Contract Review †' Technical Review †' Approved).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-amber-200 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
            <span>On the RFQ detail page, click <span className="font-medium">Create Quotation</span> to generate a linked quotation.</span>
          </li>
        </ol>

        <div className="pt-2">
          <Button
            variant="primary"
            onClick={() => navigate('/sales/rfqs')}
            icon={<ArrowRight size={14} />}
          >
            Go to RFQ Management
          </Button>
        </div>
      </div>

      {/* Secondary link back to quotation list */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => navigate('/sales/quotations')}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          † Back to Quotations list
        </button>
      </div>
    </div>
  )
}
