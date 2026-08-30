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

export function RFQFormPage() {
  const navigate = useNavigate()

  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [customersLoading, setCustomersLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')

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
      .then(setCustomers)
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
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
    <div className="max-w-2xl">
      {/* Back link + header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate('/sales/rfqs')}
          className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded"
          aria-label="Back to RFQs"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New RFQ</h1>
          <p className="text-sm text-gray-500">Module 04 - Create Request for Quotation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {/* Customer & Contact */}
          <div className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Customer
            </h2>

            {/* Customer search filter */}
            <Input
              label="Search customers"
              placeholder="Type to filter customer list..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              disabled={customersLoading}
            />

            <Select
              label="Customer"
              required
              options={[
                { label: customersLoading ? 'Loading customers...' : 'Select a customer', value: '', disabled: true },
                ...customerOptions,
              ]}
              value={form.customer_id}
              onChange={set('customer_id')}
              error={errors.customer_id}
            />

            <Input
              label="Contact Name"
              placeholder="e.g. Rajesh Kumar"
              value={form.contact_name}
              onChange={set('contact_name')}
              maxLength={100}
            />
          </div>

          {/* Dates & Priority */}
          <div className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Schedule & Priority
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Received Date"
                required
                type="date"
                value={form.received_date}
                onChange={set('received_date')}
                error={errors.received_date}
              />
              <Input
                label="Quotation Due Date"
                required
                type="date"
                value={form.quotation_due_date}
                onChange={set('quotation_due_date')}
                error={errors.quotation_due_date}
              />
            </div>

            <div className="w-48">
              <Select
                label="Priority"
                required
                options={PRIORITY_OPTIONS}
                value={form.priority}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    priority: e.target.value as 'High' | 'Medium' | 'Low',
                  }))
                }
              />
            </div>
          </div>

          {/* API error + Submit */}
          <div className="p-6">
            {apiError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {apiError}
              </div>
            )}

            <div className="flex items-center gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/sales/rfqs')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submitLoading}
                icon={<Save size={15} />}
              >
                Create RFQ
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
