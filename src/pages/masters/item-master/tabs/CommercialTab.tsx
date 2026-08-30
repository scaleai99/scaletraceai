import { useState } from 'react'
import type { ReactNode } from 'react'
import { useItemMasterStore } from '../../../../store/itemMasterStore'

const inputCls =
  'h-7 w-full border border-[#CCCCCC] rounded px-2 text-xs text-[#222] focus:outline-none focus:border-[#E8A838] transition-colors bg-white'

const selectCls =
  'h-7 border border-[#CCCCCC] rounded px-2 text-xs text-[#222] focus:outline-none focus:border-[#E8A838] bg-white cursor-pointer min-w-[140px]'

const textareaCls =
  'w-full border border-[#CCCCCC] rounded px-2 py-1.5 text-xs text-[#222] focus:outline-none focus:border-[#E8A838] transition-colors bg-white resize-none'

interface FieldProps {
  label: string
  children: ReactNode
  alignStart?: boolean
}

function Field({ label, children, alignStart }: FieldProps) {
  return (
    <div
      className={`flex gap-3 py-2 border-b border-[#F0F0F0] ${alignStart ? 'items-start' : 'items-center'}`}
    >
      <label className="w-[180px] text-right text-xs text-[#444] shrink-0 mt-1.5 font-medium">
        {label}
      </label>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export function CommercialTab() {
  const form = useItemMasterStore((s) => s.form)
  const updateOverview = useItemMasterStore((s) => s.updateOverview)

  const [currency, setCurrency] = useState('INR')
  const [taxCategory, setTaxCategory] = useState('GST')
  const [gstRate, setGstRate] = useState('18%')
  const [paymentTerms, setPaymentTerms] = useState('Net 30')
  const [creditLimit, setCreditLimit] = useState(0)
  const [incoterms, setIncoterms] = useState('')

  return (
    <div className="max-w-2xl">
      {/* Currency */}
      <Field label="Currency">
        <select
          className={selectCls}
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option>INR</option>
          <option>USD</option>
          <option>EUR</option>
          <option>GBP</option>
          <option>JPY</option>
          <option>AED</option>
        </select>
      </Field>

      {/* Tax Category */}
      <Field label="Tax Category">
        <select
          className={selectCls}
          value={taxCategory}
          onChange={(e) => setTaxCategory(e.target.value)}
        >
          <option>GST</option>
          <option>VAT</option>
          <option>Service Tax</option>
          <option>Exempt</option>
        </select>
      </Field>

      {/* GST Rate */}
      <Field label="GST Rate">
        <select
          className={selectCls}
          value={gstRate}
          onChange={(e) => setGstRate(e.target.value)}
        >
          <option>0%</option>
          <option>5%</option>
          <option>12%</option>
          <option>18%</option>
          <option>28%</option>
        </select>
      </Field>

      {/* HSN Code */}
      <Field label="HSN Code">
        <input
          className={inputCls}
          value={form.overview.hsnCode}
          onChange={(e) => updateOverview({ hsnCode: e.target.value })}
          placeholder="e.g. 84715000"
        />
      </Field>

      {/* Payment Terms */}
      <Field label="Payment Terms">
        <select
          className={selectCls}
          value={paymentTerms}
          onChange={(e) => setPaymentTerms(e.target.value)}
        >
          <option>Advance</option>
          <option>Net 15</option>
          <option>Net 30</option>
          <option>Net 45</option>
          <option>Net 60</option>
          <option>COD</option>
        </select>
      </Field>

      {/* Credit Limit */}
      <Field label="Credit Limit">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            className="w-28 h-7 border border-[#CCCCCC] rounded px-2 text-xs text-[#222] focus:outline-none focus:border-[#E8A838] bg-white"
            value={creditLimit}
            onChange={(e) => setCreditLimit(Number(e.target.value))}
          />
          <span className="text-xs text-[#666]">INR</span>
        </div>
      </Field>

      {/* Incoterms */}
      <Field label="Incoterms">
        <input
          className={inputCls}
          value={incoterms}
          onChange={(e) => setIncoterms(e.target.value)}
          placeholder="e.g. FOB, CIF, DDP"
        />
      </Field>

      {/* Remarks */}
      <Field label="Remarks" alignStart>
        <textarea
          className={textareaCls}
          rows={3}
          value={form.overview.remarks}
          onChange={(e) => updateOverview({ remarks: e.target.value })}
          placeholder="Additional commercial notes..."
        />
      </Field>

      {/* Save / Delete */}
      <div className="flex gap-3 mt-6">
        <button className="px-6 py-1.5 bg-[#E8A838] hover:bg-[#D4962E] text-white text-sm rounded font-medium transition-colors">
          Save
        </button>
        <button className="px-6 py-1.5 bg-[#E8A838] hover:bg-[#D4962E] text-white text-sm rounded font-medium transition-colors">
          Delete
        </button>
        <button className="ml-auto p-1.5 border border-[#CCC] rounded text-[#666] text-xs hover:bg-[#F4F4F4] transition-colors">
          
        </button>
      </div>
    </div>
  )
}

export default CommercialTab
