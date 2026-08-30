/**
 * StepUploadPage "" Module 05 gap (Req 5.13/5.14).
 *
 * Upload a STEP/3D file for on-premise (OCCT) geometry extraction "" bounding
 * box, volume, surface area and face count "" which refine AI costing and
 * surface-treatment area. Reached at /masters/step.
 */
import { useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { Button, Badge } from '../../components/ui'
import { extractStep, StepExtraction } from '../../api/stepApi'

export function StepUploadPage() {
  const [result, setResult] = useState<StepExtraction | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      setResult(await extractStep(file))
    } catch {
      setError('Extraction failed "" ensure the file is a .step/.stp under 100 MB.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">STEP / 3D Ingestion</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Module 05 "" CPU-only geometry extraction (Open CASCADE); feeds AI costing &amp; surface-treatment area
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <label className="block bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 text-center cursor-pointer hover:border-amber-400">
        <UploadCloud className="mx-auto mb-2 text-gray-400" size={28} />
        <span className="text-sm text-gray-600">Click to upload a .step / .stp file</span>
        <input type="file" accept=".step,.stp" className="hidden" onChange={onFile} />
      </label>

      {loading && <p className="mt-4 text-sm text-gray-400 animate-pulse">Extracting geometry"¦</p>}

      {result && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-800">{result.file_name}</span>
            <Badge variant={result.extraction_status === 'success' ? 'success' : 'warning'} size="sm">
              {result.extraction_status}
            </Badge>
          </div>
          {result.extraction_status === 'library_unavailable' && (
            <p className="text-xs text-amber-700 mb-3">
              OCCT (pythonocc-core) is not installed in this deployment "" header metadata was parsed;
              install pythonocc-core to enable full geometry extraction.
            </p>
          )}
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><dt className="text-xs uppercase text-gray-400">Bounding Box (mm)</dt><dd className="font-semibold">{result.bbox_length_mm ?? '""'} Ã- {result.bbox_width_mm ?? '""'} Ã- {result.bbox_height_mm ?? '""'}</dd></div>
            <div><dt className="text-xs uppercase text-gray-400">Volume</dt><dd className="font-semibold">{result.volume_cm3 ?? '""'} cm³</dd></div>
            <div><dt className="text-xs uppercase text-gray-400">Surface Area</dt><dd className="font-semibold">{result.surface_area_cm2 ?? '""'} cm²</dd></div>
            <div><dt className="text-xs uppercase text-gray-400">Faces</dt><dd className="font-semibold">{result.face_count ?? '""'}</dd></div>
            <div><dt className="text-xs uppercase text-gray-400">Material (meta)</dt><dd className="font-semibold">{result.material_from_meta ?? '""'}</dd></div>
          </dl>
        </div>
      )}
    </div>
  )
}
