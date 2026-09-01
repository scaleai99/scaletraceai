/**
 * ChemicalBatchListPage.tsx - Shop Floor - Special Process, Phase 1
 * (Chemical Control). Lists ChemicalBatch records.
 *
 * No demo-data fallback (CLAUDE.md rule 2) - an empty list renders empty.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, RefreshCw, FlaskConical } from 'lucide-react'
import { Badge, Button, Table, type Column } from '../../components/ui'
import { listChemicalBatches, type ChemicalBatch, type QcReleaseStatus } from '../../api/chemicalBatchApi'

function qcBadgeVariant(status: QcReleaseStatus): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'Released') return 'success'
  if (status === 'Rejected') return 'danger'
  return 'warning'
}

function isExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false
  return new Date(expiryDate) < new Date(new Date().toDateString())
}

export function ChemicalBatchListPage() {
  const navigate = useNavigate()
  const [batches, setBatches] = useState<ChemicalBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listChemicalBatches()
      setBatches(data)
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } }
      setError(axErr?.response?.data?.detail ?? 'Failed to load chemical batches')
      setBatches([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const columns: Column<ChemicalBatch>[] = [
    {
      key: 'chemical_name',
      header: 'Chemical',
      render: (b) => (
        <div>
          <div className="font-medium text-gray-800">{b.chemical_name}</div>
          {b.process_ref && <div className="text-xs text-gray-400">{b.process_ref}</div>}
        </div>
      ),
    },
    {
      key: 'lot_number',
      header: 'Lot / Item',
      render: (b) => (
        <div className="text-xs text-gray-600">
          <div>{b.lot_number ?? '—'}</div>
          <div className="text-gray-400">{b.item_code ?? ''}</div>
        </div>
      ),
    },
    {
      key: 'concentration_pct',
      header: 'Concentration',
      render: (b) => (b.concentration_pct != null ? `${b.concentration_pct}%` : '—'),
    },
    {
      key: 'qc_release_status',
      header: 'QC Status',
      render: (b) => <Badge variant={qcBadgeVariant(b.qc_release_status)} size="sm">{b.qc_release_status}</Badge>,
    },
    {
      key: 'expiry_date',
      header: 'Expiry',
      render: (b) => (
        <span className={isExpired(b.expiry_date) ? 'text-red-600 font-medium' : 'text-gray-600'}>
          {b.expiry_date ?? '—'}
          {isExpired(b.expiry_date) && ' (Expired)'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => <Badge variant={b.status === 'Active' ? 'default' : 'danger'} size="sm">{b.status}</Badge>,
    },
  ]

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical size={18} className="text-[#204577]" /> Chemical Batches
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Chemical Control - shop-floor tank/bath chemical receipts, QC release, and expiry tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={load}>
            <RefreshCw size={13} /> Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/shopfloor/chemical-batches/new')}>
            <Plus size={13} /> New Chemical Batch
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">Loading…</div>
        ) : (
          <Table
            columns={columns}
            data={batches}
            emptyMessage="No chemical batches yet. Register one from an existing stock lot."
            onRowClick={(b) => navigate(`/shopfloor/chemical-batches/${b.id}`)}
          />
        )}
      </div>
    </div>
  )
}
