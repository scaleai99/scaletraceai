/**
 * ChemicalBatchDetailPage.tsx - Shop Floor - Special Process, Phase 1
 * (Chemical Control). Router-reused for /shopfloor/chemical-batches/new
 * and /shopfloor/chemical-batches/:id - see resetForm below, which clears
 * every field when navigating to "new" (CLAUDE.md rule 3).
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FlaskConical, Upload, FileText, CheckCircle2, XCircle } from 'lucide-react'
import { Badge, Button, Input, Select, Textarea, type SelectOption } from '../../components/ui'
import {
  getChemicalBatch,
  createChemicalBatch,
  updateChemicalBatch,
  qcReleaseChemicalBatch,
  uploadCocFile,
  deleteChemicalBatch,
  listStockLotsForItem,
  type ChemicalBatch,
  type StockLotOption,
} from '../../api/chemicalBatchApi'

export function ChemicalBatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [batch, setBatch] = useState<ChemicalBatch | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Form fields
  const [chemicalName, setChemicalName] = useState('')
  const [processRef, setProcessRef] = useState('')
  const [concentrationPct, setConcentrationPct] = useState('')
  const [cocNumber, setCocNumber] = useState('')
  const [qcNotes, setQcNotes] = useState('')

  // Create-only: lot lookup
  const [itemCode, setItemCode] = useState('')
  const [lotOptions, setLotOptions] = useState<StockLotOption[]>([])
  const [selectedLotId, setSelectedLotId] = useState('')
  const [lotLookupError, setLotLookupError] = useState<string | null>(null)
  const [lotLookupLoading, setLotLookupLoading] = useState(false)

  // ---- Populate form from a loaded record ----
  const populateForm = useCallback((b: ChemicalBatch) => {
    setChemicalName(b.chemical_name)
    setProcessRef(b.process_ref ?? '')
    setConcentrationPct(b.concentration_pct != null ? String(b.concentration_pct) : '')
    setCocNumber(b.coc_number ?? '')
    setQcNotes('')
  }, [])

  // ---- Reset form (New Chemical Batch) ----
  const resetForm = useCallback(() => {
    setBatch(null)
    setChemicalName(''); setProcessRef(''); setConcentrationPct(''); setCocNumber(''); setQcNotes('')
    setItemCode(''); setLotOptions([]); setSelectedLotId(''); setLotLookupError(null)
    setLoading(false); setLoadError(null); setSaveError(null); setSaveSuccess(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reset when navigating to /new
  useEffect(() => { if (isNew) resetForm() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Load existing record ----
  useEffect(() => {
    if (isNew || !id) return
    setLoading(true)
    setLoadError(null)
    getChemicalBatch(id)
      .then((b) => { setBatch(b); populateForm(b) })
      .catch((err: unknown) => {
        const axErr = err as { response?: { data?: { detail?: string } } }
        setLoadError(axErr?.response?.data?.detail ?? 'Failed to load chemical batch')
      })
      .finally(() => setLoading(false))
  }, [id, isNew, populateForm])

  // ---- Lot lookup (create only) ----
  const handleLookupLots = async () => {
    if (!itemCode.trim()) return
    setLotLookupLoading(true)
    setLotLookupError(null)
    setLotOptions([])
    setSelectedLotId('')
    try {
      const lots = await listStockLotsForItem(itemCode.trim())
      setLotOptions(lots)
      if (lots.length === 0) setLotLookupError(`No active stock lots found for item '${itemCode.trim()}'.`)
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      setLotLookupError(axErr?.response?.data?.detail ?? 'Lot lookup failed')
    } finally {
      setLotLookupLoading(false)
    }
  }

  // ---- Discard changes ----
  const handleDiscard = async () => {
    if (isNew) { resetForm(); setSaveError(null); return }
    if (!id) return
    setSaveError(null)
    try {
      const fresh = await getChemicalBatch(id)
      setBatch(fresh)
      populateForm(fresh)
    } catch {
      if (batch) populateForm(batch)
    }
  }

  // ---- Save ----
  const handleSave = async () => {
    const errs: string[] = []
    if (isNew && !selectedLotId) errs.push('A stock lot must be selected')
    if (!chemicalName.trim()) errs.push('Chemical Name is required')
    else if (chemicalName.trim().length < 2) errs.push('Chemical Name must be at least 2 characters')
    const concNum = concentrationPct.trim() ? Number(concentrationPct) : null
    if (concentrationPct.trim() && (Number.isNaN(concNum) || concNum! < 0 || concNum! > 100)) {
      errs.push('Concentration % must be a number between 0 and 100')
    }
    if (errs.length > 0) { setSaveError(errs.join('. ')); return }

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      if (isNew) {
        const created = await createChemicalBatch({
          stock_lot_id: selectedLotId,
          chemical_name: chemicalName.trim(),
          process_ref: processRef.trim() || undefined,
          concentration_pct: concNum ?? undefined,
          coc_number: cocNumber.trim() || undefined,
        })
        navigate(`/shopfloor/chemical-batches/${created.id}`, { replace: true })
      } else if (id) {
        const updated = await updateChemicalBatch(id, {
          chemical_name: chemicalName.trim(),
          process_ref: processRef.trim() || undefined,
          concentration_pct: concNum ?? undefined,
          coc_number: cocNumber.trim() || undefined,
        })
        setBatch(updated)
        populateForm(updated)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: unknown } } }
      const detail = axErr?.response?.data?.detail
      setSaveError(typeof detail === 'string' ? detail : JSON.stringify(detail))
    } finally {
      setSaving(false)
    }
  }

  // ---- QC release / reject ----
  const handleQcAction = async (status: 'Released' | 'Rejected') => {
    if (!id || isNew) return
    setActionLoading(true)
    try {
      const updated = await qcReleaseChemicalBatch(id, { qc_release_status: status, qc_notes: qcNotes.trim() || undefined })
      setBatch(updated)
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      alert(axErr?.response?.data?.detail ?? 'QC action failed')
    } finally {
      setActionLoading(false)
    }
  }

  // ---- CoC file upload ----
  const handleCocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id || isNew) return
    setActionLoading(true)
    try {
      const updated = await uploadCocFile(id, file)
      setBatch(updated)
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      alert(axErr?.response?.data?.detail ?? 'CoC upload failed')
    } finally {
      setActionLoading(false)
      e.target.value = ''
    }
  }

  // ---- Soft delete ----
  const handleDelete = async () => {
    if (!id || isNew || !window.confirm(`Delete chemical batch '${chemicalName}'?\n\nThis cannot be undone.`)) return
    setActionLoading(true)
    try {
      await deleteChemicalBatch(id)
      navigate('/shopfloor/chemical-batches')
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      alert(axErr?.response?.data?.detail ?? 'Delete failed')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="w-full px-4 py-8 text-center text-sm text-gray-400">Loading…</div>
  }
  if (loadError) {
    return (
      <div className="w-full">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-700">{loadError}</div>
      </div>
    )
  }

  const lotOptionsForSelect: SelectOption[] = lotOptions.map((l) => ({
    label: `${l.lot_number}  (qty ${l.qty_remaining ?? '—'}${l.expiry_date ? `, exp ${l.expiry_date}` : ''})`,
    value: l.id,
  }))

  const displayName = isNew ? 'New Chemical Batch' : (batch?.chemical_name ?? 'Chemical Batch')
  const isDeleted = batch?.status === 'Deleted'

  return (
    <div className="w-full flex flex-col gap-0">
      {/* HEADER */}
      <div className="bg-white border border-gray-200 rounded-t-xl px-4 py-3">
        <button
          onClick={() => navigate('/shopfloor/chemical-batches')}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#005c87] mb-2"
        >
          <ArrowLeft size={13} /> Back to Chemical Batches
        </button>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
            <FlaskConical size={20} className="text-[#204577]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-gray-900">{displayName}</h1>
              {batch && <Badge variant={isDeleted ? 'danger' : 'default'} size="sm">{batch.status}</Badge>}
              {batch && (
                <Badge
                  variant={batch.qc_release_status === 'Released' ? 'success' : batch.qc_release_status === 'Rejected' ? 'danger' : 'warning'}
                  size="sm"
                >
                  QC: {batch.qc_release_status}
                </Badge>
              )}
            </div>
            {batch && (
              <div className="text-xs text-gray-500 mt-0.5">
                Lot {batch.lot_number} · Item {batch.item_code}
                {batch.expiry_date && ` · Expires ${batch.expiry_date}`}
              </div>
            )}
          </div>
          {!isNew && !isDeleted && (
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={actionLoading}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="bg-white border border-gray-200 border-t-0 rounded-b-xl p-4 flex flex-col gap-4">
        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{saveError}</div>
        )}
        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">Saved.</div>
        )}

        {/* Stock lot selection (create only) */}
        {isNew && (
          <div className="border border-gray-200 rounded-xl p-3 flex flex-col gap-3">
            <div className="text-sm font-semibold text-gray-700">
              Stock Lot <span className="text-red-500">*</span>
            </div>
            <p className="text-xs text-gray-500 -mt-2">
              Chemicals are received through the normal GRN process like any other stock item. Enter the item
              code the chemical was received under to find its lot.
            </p>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Item Code"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                  placeholder="e.g. CHEM-ANODIZE-A"
                />
              </div>
              <Button variant="secondary" size="sm" onClick={handleLookupLots} disabled={lotLookupLoading || !itemCode.trim()}>
                {lotLookupLoading ? 'Looking up…' : 'Find Lots'}
              </Button>
            </div>
            {lotLookupError && <p className="text-xs text-red-600">{lotLookupError}</p>}
            {lotOptions.length > 0 && (
              <Select
                label="Stock Lot"
                required
                options={lotOptionsForSelect}
                placeholder="Select a lot…"
                value={selectedLotId}
                onChange={(e) => setSelectedLotId(e.target.value)}
              />
            )}
          </div>
        )}

        {/* Core fields */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Chemical Name"
            required
            value={chemicalName}
            onChange={(e) => setChemicalName(e.target.value)}
            placeholder="e.g. Chromic Acid Anodize Bath A"
            disabled={isDeleted}
          />
          <Input
            label="Process Reference"
            value={processRef}
            onChange={(e) => setProcessRef(e.target.value)}
            placeholder="e.g. Chromic Anodize - AMS2470"
            disabled={isDeleted}
          />
          <Input
            label="Concentration (%)"
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={concentrationPct}
            onChange={(e) => setConcentrationPct(e.target.value)}
            disabled={isDeleted}
          />
          <Input
            label="CoC Number"
            value={cocNumber}
            onChange={(e) => setCocNumber(e.target.value)}
            disabled={isDeleted}
          />
        </div>

        {/* QC release + CoC upload (existing records only) */}
        {!isNew && batch && (
          <div className="border border-gray-200 rounded-xl p-3 flex flex-col gap-3">
            <div className="text-sm font-semibold text-gray-700">QC Release</div>
            {batch.qc_notes && <p className="text-xs text-gray-500">Last note: {batch.qc_notes}</p>}
            <Textarea
              label="QC Notes"
              value={qcNotes}
              onChange={(e) => setQcNotes(e.target.value)}
              placeholder="e.g. Titration within spec"
              rows={2}
              disabled={isDeleted}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleQcAction('Released')}
                disabled={actionLoading || isDeleted || batch.qc_release_status === 'Released'}
              >
                <CheckCircle2 size={13} /> Release
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleQcAction('Rejected')}
                disabled={actionLoading || isDeleted || batch.qc_release_status === 'Rejected'}
              >
                <XCircle size={13} /> Reject
              </Button>
            </div>

            <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
              <div className="text-sm">
                {batch.coc_file_path ? (
                  <a
                    href={batch.coc_file_path}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#005c87] hover:underline"
                  >
                    <FileText size={13} /> {batch.coc_file_name ?? 'View CoC file'}
                  </a>
                ) : (
                  <span className="text-gray-400">No CoC file uploaded</span>
                )}
              </div>
              <label className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 border rounded-lg cursor-pointer ${isDeleted ? 'opacity-50 pointer-events-none' : 'border-gray-300 hover:bg-gray-50'}`}>
                <Upload size={13} /> {batch.coc_file_path ? 'Replace File' : 'Upload File'}
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden" onChange={handleCocUpload} disabled={isDeleted} />
              </label>
            </div>
          </div>
        )}

        {/* Save / Discard bar */}
        {!isDeleted && (
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <button
              onClick={handleDiscard}
              className="px-4 py-1.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-xs text-white bg-[#005c87] rounded hover:bg-[#004a6e] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
