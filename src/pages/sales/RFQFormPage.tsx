/**
 * RFQFormPage - Module 04: Create new RFQ.
 *
 * Fields:
 * - Customer selector (searchable, calls GET /api/v1/customers?status=Active)
 * - Received date, quotation due date
 * - Priority (High / Medium / Low)
 * - Contact name
 *
 * On submit -> POST /api/v1/rfqs -> redirect to /sales/rfqs/:id (detail page)
 */

import { useEffect, useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Input, Select, Button } from '../../components/ui'
import { createRFQ, listActiveCustomers, CustomerOption } from '../../api/rfqApi'
import * as F from '../../components/flow/FlowUi'

interface FormState {
  customer_id: string
  contact_name: string
  received_date: string
  quotation_due_date: string
  priority: 'High' | 'Medium' | 'Low'
}

const PRIORITY_OPTIONS = [
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' },
]

/** Format today's date as YYYY-MM-DD (for date input default values) */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Compute a date N days from today as YYYY-MM-DD */
function futureDateISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const RFQ_FLOW_STAGES: F.FlowStageDef[] = [
  { n: 1, title: 'RFQ Received', sub: 'Inbox & attachments', group: 'RFQ INTAKE' },
  { n: 2, title: 'RFQ Registration', sub: 'Header, items, terms', group: 'RFQ INTAKE' },
  { n: 3, title: 'AI Drawing & Spec Review', sub: '2D/3D extraction', group: 'ENGINEERING REVIEW' },
  { n: 4, title: 'Technical & Config Review', sub: 'Manufacturability', group: 'ENGINEERING REVIEW' },
]

export function RFQFormPage() {
  const navigate = useNavigate()

  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [customersLoading, setCustomersLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [activeStage, setActiveStage] = useState(2)

  const [form, setForm] = useState<FormState>({
    customer_id: '',
    contact_name: '',
    received_date: todayISO(),
    quotation_due_date: futureDateISO(14),
    priority: 'Medium',
  })

  // Load active customers
  useEffect(() => {
    setCustomersLoading(true)
    listActiveCustomers()
      .then(r => setCustomers(Array.isArray(r) ? r : []))
      .catch(() => setCustomers([]))
      .finally(() => setCustomersLoading(false))
  }, [])

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // Filtered customer list by search
  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.toLowerCase()
    return (
      c.customer_name.toLowerCase().includes(q) ||
      c.customer_code.toLowerCase().includes(q)
    )
  })

  const customerOptions = filteredCustomers.map((c) => ({
    label: `${c.customer_code} - ${c.customer_name}`,
    value: c.id,
  }))

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.customer_id) errs.customer_id = 'Customer is required'
    if (!form.received_date) errs.received_date = 'Received date is required'
    if (!form.quotation_due_date) errs.quotation_due_date = 'Quotation due date is required'
    if (form.received_date && form.quotation_due_date && form.quotation_due_date < form.received_date) {
      errs.quotation_due_date = 'Due date must be on or after received date'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!validate()) return

    setSubmitLoading(true)
    setApiError(null)

    try {
      const rfq = await createRFQ({
        customer_id: form.customer_id,
        contact_name: form.contact_name || null,
        received_date: form.received_date,
        quotation_due_date: form.quotation_due_date,
        priority: form.priority,
      })
      navigate(`/sales/rfqs/${rfq.id}`)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string | { message?: string } } }; message?: string }
      const detail = axiosErr?.response?.data?.detail
      const msg =
        typeof detail === 'string'
          ? detail
          : typeof detail === 'object' && detail?.message
            ? detail.message
            : axiosErr?.message ?? 'Failed to create RFQ'
      setApiError(msg)
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/sales/rfqs')} className="text-gray-500 hover:text-gray-700 p-1 rounded" aria-label="Back to RFQs">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New RFQ</h1>
          <p className="text-sm text-gray-500">Module 04 · Register a Request for Quotation</p>
        </div>
      </div>

      {/* Stage strip — same flow as the RFQ record */}
      <F.StageStrip stages={RFQ_FLOW_STAGES} active={activeStage} done={new Set()} onSelect={setActiveStage} />

      {apiError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{apiError}</div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-gray-50/40 p-6">
        {/* Stage 1 · RFQ Received */}
        {activeStage === 1 && (
          <>
            <F.StageHeader n={1} group="RFQ INTAKE" title="RFQ Received"
              desc="A new customer request is being entered manually. Capture the registration details in the next stage to create the RFQ."
              meta={<><F.MetaChip label="Source" value="Manual" /><F.MetaChip label="Status" value="Not saved" tone="amber" /></>} />
            <F.Card title="Intake">
              <p className="text-sm text-gray-600">This RFQ hasn't been created yet. Continue to <span className="font-semibold">RFQ Registration</span> to enter the customer, due date and priority — saving there creates the RFQ and opens the full engineering flow.</p>
              <F.Footer><button className={F.btnPrimary} onClick={() => setActiveStage(2)}>Continue to Registration →</button></F.Footer>
            </F.Card>
          </>
        )}

        {/* Stage 2 · RFQ Registration (editable create form) */}
        {activeStage === 2 && (
          <>
            <F.StageHeader n={2} group="RFQ INTAKE" title="RFQ Registration"
              desc="Capture the customer, schedule and priority. Saving creates the RFQ; line items and drawings are added on the next stages."
              meta={<><F.MetaChip label="Mode" value="New RFQ" tone="indigo" /><F.MetaChip label="Status" value="Draft" /></>} />
            <F.Card title="RFQ Header" right={<F.Badge text="New" tone="indigo" />}>
              <div className="space-y-4">
                <Input
                  label="Search customers"
                  placeholder="Type to filter customer list..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  disabled={customersLoading}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Select
                    label="Customer"
                    required
                    options={[{ label: customersLoading ? 'Loading customers...' : 'Select a customer', value: '', disabled: true }, ...customerOptions]}
                    value={form.customer_id}
                    onChange={set('customer_id')}
                    error={errors.customer_id}
                  />
                  <Input label="Contact Name" placeholder="e.g. Rajesh Kumar" value={form.contact_name} onChange={set('contact_name')} maxLength={100} />
                  <Input label="Received Date" required type="date" value={form.received_date} onChange={set('received_date')} error={errors.received_date} />
                  <Input label="Quotation Due Date" required type="date" value={form.quotation_due_date} onChange={set('quotation_due_date')} error={errors.quotation_due_date} />
                  <Select
                    label="Priority"
                    required
                    options={PRIORITY_OPTIONS}
                    value={form.priority}
                    onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as 'High' | 'Medium' | 'Low' }))}
                  />
                </div>
              </div>
              <F.Footer>
                <button type="button" className={F.btnGhost} onClick={() => navigate('/sales/rfqs')}>Cancel</button>
                <button type="button" className={F.btnPrimary} onClick={() => handleSubmit()} disabled={submitLoading}>
                  {submitLoading ? 'Creating…' : 'Save & Register →'}
                </button>
              </F.Footer>
            </F.Card>
          </>
        )}

        {/* Stages 3 & 4 · locked until the RFQ exists */}
        {(activeStage === 3 || activeStage === 4) && (
          <>
            <F.StageHeader n={activeStage} group="ENGINEERING REVIEW"
              title={activeStage === 3 ? 'AI Drawing & Spec Review' : 'Technical & Configuration Review'}
              desc={activeStage === 3 ? 'AI reads the 2D drawing and specification sheet and extracts part data.' : 'Engineer verifies AI output against shop-floor capability and certification requirements.'}
              meta={<F.MetaChip label="Status" value="Locked" tone="amber" />} />
            <F.PlaceholderNote>
              Register the RFQ first (Stage 2 · Save &amp; Register). Drawing upload, AI extraction and the engineering review become available on the RFQ record the moment it's created.
            </F.PlaceholderNote>
            <F.Footer><button className={F.btnPrimary} onClick={() => setActiveStage(2)}>← Back to Registration</button></F.Footer>
          </>
        )}
      </div>
    </div>
  )
}
