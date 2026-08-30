import type { ReactNode } from 'react'
import { useItemMasterStore } from '../../../../store/itemMasterStore'

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

export function SalesTab() {
  const form = useItemMasterStore((s) => s.form)
  const updateOverview = useItemMasterStore((s) => s.updateOverview)

  const ov = form.overview

  return (
    <div className="max-w-2xl">
      {/* Sales Category */}
      <Field label="Sales Category">
        <select
          className={selectCls}
          value={ov.salesCategory}
          onChange={(e) =>
            updateOverview({ salesCategory: e.target.value as typeof ov.salesCategory })
          }
        >
          <option value="">Select</option>
          <option>Aerospace</option>
          <option>Defence</option>
          <option>Automotive</option>
          <option>Locomotive</option>
          <option>Industrial</option>
          <option>Medical</option>
        </select>
      </Field>

      {/* Sales Minimum Order Qty */}
      <Field label="Sales Min. Order Qty">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            className="w-20 h-7 border border-[#CCCCCC] rounded px-2 text-xs text-[#222] focus:outline-none focus:border-[#E8A838] bg-white"
            value={ov.minimumOrderQty}
            onChange={(e) => updateOverview({ minimumOrderQty: Number(e.target.value) })}
          />
          <span className="text-xs text-[#666]">in</span>
          <select className={selectCls} value={ov.unitOfMeasure} onChange={(e) => updateOverview({ unitOfMeasure: e.target.value })}>
            <option value="">Select</option>
            <option>Nos</option>
            <option>Kg</option>
            <option>Meter</option>
            <option>Litre</option>
            <option>Set</option>
            <option>Box</option>
          </select>
          <span className="text-xs text-[#888]">of default UOM</span>
        </div>
      </Field>

      {/* Features */}
      <Field label="Features" alignStart>
        <textarea
          className={textareaCls}
          rows={4}
          placeholder=" "
          value={ov.remarks}
          onChange={(e) => updateOverview({ remarks: e.target.value })}
        />
      </Field>

      {/* Benefits */}
      <Field label="Benefits" alignStart>
        <textarea
          className={textareaCls}
          rows={4}
          placeholder=" "
        />
      </Field>

      {/* Save / Delete / More */}
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

      {/* Comment section */}
      <div className="border-t border-[#E5E5E5] mt-6 pt-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
            R
          </div>
          <div className="flex-1">
            <textarea
              placeholder="Write Comment"
              className="w-full border border-[#CCCCCC] rounded px-3 py-2 text-xs resize-none h-16 focus:outline-none focus:border-[#E8A838] transition-colors"
            />
            <button className="mt-2 px-4 py-1.5 bg-[#E8A838] text-white text-xs rounded font-medium hover:bg-[#D4962E] transition-colors">
              Post
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}

export default SalesTab
