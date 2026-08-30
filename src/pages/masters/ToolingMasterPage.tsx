/**
 * ToolingMasterPage "" Module 09 gap (Req 9.12).
 *
 * Tooling investment + expected life †' amortised tooling cost per part, which
 * feeds the AI Costing Engine's Tooling Cost component. Reached at
 * /masters/tooling.
 */
import { useCallback, useEffect, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { Button, Input } from '../../components/ui'
import { listTooling, createTooling, Tooling } from '../../api/toolingApi'

export function ToolingMasterPage() {
  const [tools, setTools] = useState<Tooling[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [investment, setInvestment] = useState('')
  const [life, setLife] = useState('')
  const [consumable, setConsumable] = useState('')

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTools(await listTooling())
    } catch {
      setTools([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const handleAdd = async () => {
    if (!code || !name) return
    setError(null)
    try {
      await createTooling({
        tool_code: code,
        tool_name: name,
        investment_inr: investment ? Number(investment) : undefined,
        expected_life_units: life ? Number(life) : undefined,
        consumable_cost_per_unit: consumable ? Number(consumable) : undefined,
      })
      setCode(''); setName(''); setInvestment(''); setLife(''); setConsumable('')
      await refetch()
    } catch {
      setError('Could not add tool (code may already exist).')
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tooling Master</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 09 "" amortised tooling cost per part feeds the AI Costing Engine
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refetch} icon={<RefreshCw size={14} />} title="Refresh" />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Add Tool</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <Input label="Tool Code" value={code} onChange={(e) => setCode(e.target.value)} />
          <Input label="Tool Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Investment ‚¹" type="number" value={investment} onChange={(e) => setInvestment(e.target.value)} />
          <Input label="Expected Life (units)" type="number" value={life} onChange={(e) => setLife(e.target.value)} />
          <Input label="Consumable ‚¹/unit" type="number" value={consumable} onChange={(e) => setConsumable(e.target.value)} />
        </div>
        <div className="mt-3">
          <Button variant="primary" onClick={handleAdd} icon={<Plus size={16} />}>Add Tool</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-2 text-left">Code</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-right">Investment ‚¹</th>
              <th className="px-4 py-2 text-right">Life</th>
              <th className="px-4 py-2 text-right">Amortised ‚¹/part</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400 animate-pulse">Loading"¦</td></tr>
            ) : tools.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No tools yet.</td></tr>
            ) : (
              tools.map((t) => (
                <tr key={t.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-xs font-semibold text-amber-700">{t.tool_code}</td>
                  <td className="px-4 py-2">{t.tool_name}</td>
                  <td className="px-4 py-2 text-right">{t.investment_inr ?? '""'}</td>
                  <td className="px-4 py-2 text-right">{t.expected_life_units ?? '""'}</td>
                  <td className="px-4 py-2 text-right font-semibold">‚¹{t.amortised_cost_per_part.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
