/**
 * QuotationFormPage - Module 10: Quotation creation.
 *
 * Creates a standalone quotation (customer + terms). A quotation may also
 * originate from an approved RFQ via the RFQ detail page; both paths call the
 * same POST /api/v1/quotations. Line items are added on the detail page.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { createQuotation } from '../../api/quotationApi'
import { listCustomers, type Customer } from '../../api/customerApi'
import * as F from '../../components/flow/FlowUi'

const QUO_FLOW_STAGES: F.FlowStageDef[] = [
  { n: 5, title: 'AI Process Planning & Costing', sub: 'Cost build-up', group: 'COSTING & PRICING' },
  { n: 6, title: 'Commercial Pricing', sub: 'Margin & selling price', group: 'COSTING & PRICING' },
  { n: 7, title: 'Approval Workflow', sub: 'Margin matrix routing', group: 'APPROVAL & RELEASE' },
  { n: 8, title: 'Quotation Released', sub: 'Sent to customer', group: 'APPROVAL & RELEASE' },
  { n: 9, title: 'Negotiation / Revision', sub: 'Revision history', group: 'CUSTOMER RESPONSE' },
  { n: 10, title: 'Customer PO Received', sub: 'PO comparison', group: 'CUSTOMER RESPONSE' },
  { n: 11, title: 'Contract Review', sub: 'Terms acceptance', group: 'ORDER EXECUTION' },
  { n: 12, title: 'Sales Order', sub: 'Handover to planning', group: 'ORDER EXECUTION' },
]

export function QuotationFormPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState('')
  const [validityDate, setValidityDate] = useState('')
  const [leadDays, setLeadDays] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeStage, setActiveStage] = useState(6)

  useEffect(() => {
    listCustomers({}).then(r => setCustomers(Array.isArray(r) ? r : [])).catch(() => setCustomers([]))
  }, [])

  const handleCreate = async () => {
    if (!customerId) { setError('Please select a customer.'); return }
    setSaving(true); setError(null)
    try {
      const q = await createQuotation({
        customer_id: customerId,
        validity_date: validityDate || null,
        delivery_lead_days: leadDays.trim() ? parseInt(leadDays, 10) : undefined,
        payment_terms: paymentTerms.trim() ? parseInt(paymentTerms, 10) : undefined,
        line_items: [],
      })
      navigate(`/sales/quotations/${q.id}`)
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to create quotation')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-7xl space-y-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/sales/quotations')} className="text-gray-500 hover:text-gray-700 p-1 rounded" aria-label="Back to Quotations">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Quotation</h1>
          <p className="text-sm text-gray-500 mt-0.5">Module 10 · Create a quotation and continue through the flow</p>
        </div>
      </div>

      <F.StageStrip stages={QUO_FLOW_STAGES} active={activeStage} done={new Set()} onSelect={setActiveStage} />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-gray-50/40 p-6">
        {/* Stage 6 · Commercial Pricing — editable create entry */}
        {activeStage === 6 && (
          <>
            <F.StageHeader n={6} group="COSTING & PRICING" title="Commercial Pricing"
              desc="Create the quotation with its customer and commercial terms. Line items, costing and pricing are added on the next stages once it's saved."
              meta={<><F.MetaChip label="Mode" value="New Quote" tone="indigo" /><F.MetaChip label="Status" value="Draft" /></>} />
            <F.Card title="Quotation Header" right={<F.Badge text="New" tone="indigo" />}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-medium text-gray-600">Customer <span className="text-rose-500">*</span></label>
                  <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:border-indigo-400 focus:outline-none">
                    <option value="">- Select customer -</option>
                    {customers.map((c) => (<option key={c.id} value={c.id}>{c.customer_code} — {c.customer_name}</option>))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Validity Date</label>
                  <input type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:border-indigo-400 focus:outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Delivery Lead (days)</label>
                  <input type="number" value={leadDays} onChange={(e) => setLeadDays(e.target.value)} placeholder="30" className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:border-indigo-400 focus:outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Payment Terms (days)</label>
                  <input type="number" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="45" className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:border-indigo-400 focus:outline-none" />
                </div>
              </div>
              <div className="mt-4"><F.PlaceholderNote>Line items, per-line costing and margin are added on the quotation record after it's created. A quotation can also be started from an approved RFQ.</F.PlaceholderNote></div>
              <F.Footer>
                <button type="button" className={F.btnGhost} onClick={() => navigate('/sales/quotations')}>Cancel</button>
                <button type="button" className={F.btnPrimary} onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create & Continue →'}</button>
              </F.Footer>
            </F.Card>
          </>
        )}

        {/* Costing (5) and all downstream stages — locked until the quotation exists */}
        {activeStage !== 6 && (
          <>
            {(() => {
              const st = QUO_FLOW_STAGES.find((s) => s.n === activeStage)!
              return (
                <F.StageHeader n={st.n} group={st.group} title={st.title}
                  desc="This stage opens on the quotation record once it has been created."
                  meta={<F.MetaChip label="Status" value="Locked" tone="amber" />} />
              )
            })()}
            <F.PlaceholderNote>
              Create the quotation first (Stage 6 · Create &amp; Continue). Costing, approval, release, negotiation and order-execution stages become available on the quotation record the moment it's saved.
            </F.PlaceholderNote>
            <F.Footer><button className={F.btnPrimary} onClick={() => setActiveStage(6)}>← Back to Create</button></F.Footer>
          </>
        )}
      </div>
    </div>
  )
}
