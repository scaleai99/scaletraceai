import { useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '../../../../lib/utils'

type PlanningCategory = 'mrp' | 'replenishment'
type ManufacturedType = 'bom' | 'manufactured' | 'non-manufactured'

const selectCls =
  'h-7 border border-[#CCCCCC] rounded px-2 text-xs text-[#222] focus:outline-none focus:border-[#E8A838] bg-white cursor-pointer min-w-[140px]'

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
      <div className="flex-1 flex items-center gap-2">{children}</div>
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

export function InventoryTab() {
  const [planningCategory, setPlanningCategory] = useState<PlanningCategory>('mrp')
  const [issuedAsKit, setIssuedAsKit] = useState(true)
  const [batchSize, setBatchSize] = useState(0)
  const [traceability, setTraceability] = useState(true)
  const [leadTime, setLeadTime] = useState(0)
  const [shelfLife, setShelfLife] = useState(0)
  const [storageLocation, setStorageLocation] = useState('')
  const [freeIssue, setFreeIssue] = useState(false)
  const [doNotConsider, setDoNotConsider] = useState(false)
  const [manufacturedType, setManufacturedType] = useState<ManufacturedType>('bom')

  return (
    <div className="max-w-2xl">
      {/* Planning Category */}
      <Field label="Planning Category">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input
              type="radio"
              className="accent-[#E8A838]"
              checked={planningCategory === 'mrp'}
              onChange={() => setPlanningCategory('mrp')}
            />
            <span>MRP (Made to Order)</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input
              type="radio"
              className="accent-[#E8A838]"
              checked={planningCategory === 'replenishment'}
              onChange={() => setPlanningCategory('replenishment')}
            />
            <span>Replenishment (Fixed Quantity Method)</span>
          </label>
        </div>
      </Field>

      {/* Issued as a Part of Kit */}
      <Field label="Issued as Part of Kit">
        <Toggle value={issuedAsKit} onChange={setIssuedAsKit} />
        <span className="text-xs text-[#444]">{issuedAsKit ? 'ON' : 'OFF'}</span>
      </Field>

      {/* Economic Batch Size */}
      <Field label="Economic Batch Size">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            className="w-20 h-7 border border-[#CCCCCC] rounded px-2 text-xs text-[#222] focus:outline-none focus:border-[#E8A838] bg-white"
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
          />
          <span className="text-xs text-[#666]">in terms of default UOM</span>
        </div>
      </Field>

      {/* Traceability Required */}
      <Field label="Traceability Required">
        <Toggle value={traceability} onChange={setTraceability} />
        <span className="text-xs text-[#444]">{traceability ? 'ON' : 'OFF'}</span>
      </Field>

      {/* Average/Agreed Lead Time */}
      <Field label="Avg/Agreed Lead Time">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            className="w-20 h-7 border border-[#CCCCCC] rounded px-2 text-xs text-[#222] focus:outline-none focus:border-[#E8A838] bg-white"
            value={leadTime}
            onChange={(e) => setLeadTime(Number(e.target.value))}
          />
          <span className="text-xs text-[#666]">Day</span>
        </div>
      </Field>

      {/* Shelf Life */}
      <Field label="Shelf Life">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            className="w-20 h-7 border border-[#CCCCCC] rounded px-2 text-xs text-[#222] focus:outline-none focus:border-[#E8A838] bg-white"
            value={shelfLife}
            onChange={(e) => setShelfLife(Number(e.target.value))}
          />
          <span className="text-xs text-[#666]">Days</span>
        </div>
      </Field>

      {/* Default Storage Location */}
      <Field label="Default Storage Location">
        <select
          className={selectCls}
          value={storageLocation}
          onChange={(e) => setStorageLocation(e.target.value)}
        >
          <option value="">Not specified</option>
          <option>Warehouse A</option>
          <option>Warehouse B</option>
          <option>Cold Storage</option>
          <option>Dispatch Area</option>
        </select>
      </Field>

      {/* Free Issue */}
      <Field label="Free Issue">
        <Toggle value={freeIssue} onChange={setFreeIssue} />
        <span className="text-xs text-[#444]">{freeIssue ? 'ON' : 'OFF'}</span>
        <button
          className="text-[#888] hover:text-[#555] text-sm ml-1"
          title="Free issue items are provided without charge"
        >
          
        </button>
      </Field>

      {/* Do not Consider at MRP */}
      <Field label="Do not Consider at MRP">
        <Toggle value={doNotConsider} onChange={setDoNotConsider} />
        <span className="text-xs text-[#444]">{doNotConsider ? 'ON' : 'OFF'}</span>
      </Field>

      {/* Manufactured Item */}
      <Field label="Manufactured Item">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input
              type="radio"
              className="accent-[#E8A838]"
              checked={manufacturedType === 'bom'}
              onChange={() => setManufacturedType('bom')}
            />
            <span>Based On BOM</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input
              type="radio"
              className="accent-[#E8A838]"
              checked={manufacturedType === 'manufactured'}
              onChange={() => setManufacturedType('manufactured')}
            />
            <span>Manufactured</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input
              type="radio"
              className="accent-[#E8A838]"
              checked={manufacturedType === 'non-manufactured'}
              onChange={() => setManufacturedType('non-manufactured')}
            />
            <span>Non-Manufactured</span>
          </label>
        </div>
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

export default InventoryTab
