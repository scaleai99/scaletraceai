/**
 * SurfaceTreatmentPage "" Module 06 gap (Req 6.9).
 *
 * Runs the rule-based AI Surface Treatment Analysis over drawing text + spec
 * references and shows the 7-field structured result that feeds the AI Costing
 * Engine. Reached at /quality/surface-treatment.
 */
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button, Input, Badge } from '../../components/ui'
import {
  analyzeSurfaceTreatment,
  SurfaceTreatmentResult,
} from '../../api/surfaceTreatmentApi'

export function SurfaceTreatmentPage() {
  const [specs, setSpecs] = useState('MIL-DTL-5541, MIL-A-8625')
  const [text, setText] = useState('')
  const [result, setResult] = useState<SurfaceTreatmentResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await analyzeSurfaceTreatment({
        spec_refs: specs.split(',').map((s) => s.trim()).filter(Boolean),
        drawing_text: text,
      })
      setResult(res)
    } catch {
      setError('Analysis failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Surface Treatment Analysis</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Module 06 "" rule-based, on-premise; identifies process type, area, masking, thickness, NADCAP category
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 space-y-3">
        <Input label="Specification references (comma-separated)" value={specs} onChange={(e) => setSpecs(e.target.value)} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Drawing notes / text</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Hard anodize per MIL-A-8625 Type III, 25-50 microns. Mask threaded holes."
          />
        </div>
        <Button variant="primary" onClick={run} loading={loading} icon={<Sparkles size={16} />}>
          Analyze
        </Button>
      </div>

      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Result</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs uppercase text-gray-400">Process Types</dt>
              <dd className="flex flex-wrap gap-1 mt-1">
                {result.process_types.length ? (
                  result.process_types.map((p) => <Badge key={p} variant="info" size="sm">{p}</Badge>)
                ) : (
                  <span className="text-gray-400">""</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-400">Estimated Surface Area</dt>
              <dd className="font-semibold">{result.estimated_surface_area_cm2 ?? '""'} cm²</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-400">Masking</dt>
              <dd>{result.masking.masking_required ? `Required "" ${result.masking.description ?? ''}` : 'Not required'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-400">Coating Thickness</dt>
              <dd className="font-semibold">
                {result.coating_thickness.min != null
                  ? `${result.coating_thickness.min}""${result.coating_thickness.max} ${result.coating_thickness.unit}`
                  : '""'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-400">Finish / Colour</dt>
              <dd>{result.finish_colour ?? '""'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-400">NADCAP Categories</dt>
              <dd className="flex flex-wrap gap-1 mt-1">
                {result.nadcap_categories.length ? (
                  result.nadcap_categories.map((n) => <Badge key={n} variant="purple" size="sm">{n}</Badge>)
                ) : (
                  <span className="text-gray-400">""</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}
