/**
 * CalibrationPage - Module 21: Instrument Calibration
 *
 * Features:
 * - Stat cards from GET /api/v1/qms/calibration/stats
 * - Instrument table from GET /api/v1/qms/calibration
 * - "Add Instrument" form via POST /api/v1/qms/calibration
 * - "Record Calibration" modal per row via POST /api/v1/qms/calibration/{id}/calibrate
 * - Status badges: Overdue (red), Active (green), due-within-30 (amber)
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, Clock, Gauge, Plus, RefreshCw, X } from 'lucide-react'
import { Badge, Button } from '../../components/ui'
import { DemoBanner } from '../../components/ui/DemoBanner'
import {
  CalibrationRecord,
  CalibrationCreate,
  CalibrateRequest,
  CalibrationStats,
  listCalibrationRecords,
  createCalibrationRecord,
  recordCalibration,
  getCalibrationStats,
} from '../../api/qualityApi'
import { useDemoFallback } from '../../lib/useDemoFallback'
import { DEMO_CALIBRATION } from '../../lib/demoData'

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  colour: string
  sub?: string
}

function StatCard({ label, value, icon, colour, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg ${colour}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Badge helper
// ---------------------------------------------------------------------------
function statusBadge(record: CalibrationRecord) {
  if (record.is_overdue || record.status === 'Overdue') {
    return <Badge variant="danger" size="sm">Overdue</Badge>
  }
  if (record.status === 'Active' && record.next_due_date) {
    const daysUntilDue = Math.ceil(
      (new Date(record.next_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntilDue <= 30 && daysUntilDue >= 0) {
      return <Badge variant="warning" size="sm">Due in {daysUntilDue}d</Badge>
    }
  }
  if (record.status === 'Active') return <Badge variant="success" size="sm">Active</Badge>
  if (record.status === 'Recalled') return <Badge variant="danger" size="sm">Recalled</Badge>
  if (record.status === 'Retired') return <Badge variant="default" size="sm">Retired</Badge>
  return <Badge variant="default" size="sm">{record.status}</Badge>
}

// ---------------------------------------------------------------------------
// Add Instrument Modal
// ---------------------------------------------------------------------------
interface AddInstrumentModalProps {
  onClose: () => void
  onCreated: () => void
}

function AddInstrumentModal({ onClose, onCreated }: AddInstrumentModalProps) {
  const [form, setForm] = useState<CalibrationCreate>({
    instrument_name: '',
    instrument_type: '',
    serial_number: '',
    make_model: '',
    location: '',
    range_spec: '',
    calibration_interval_days: 365,
    last_calibrated_date: null,
    calibration_cert_number: '',
    calibrated_by: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!form.instrument_name.trim()) {
      setError('Instrument name is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createCalibrationRecord({
        ...form,
        last_calibrated_date: form.last_calibrated_date || null,
      })
      onCreated()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string }
      setError(err?.response?.data?.detail ?? err?.message ?? 'Failed to create instrument')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Instrument</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Instrument Name *</label>
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.instrument_name}
                onChange={e => setForm(f => ({ ...f, instrument_name: e.target.value }))}
                placeholder="e.g. Vernier Caliper"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Type</label>
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.instrument_type || ''}
                onChange={e => setForm(f => ({ ...f, instrument_type: e.target.value }))}
                placeholder="e.g. Caliper"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Serial Number</label>
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.serial_number || ''}
                onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Make / Model</label>
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.make_model || ''}
                onChange={e => setForm(f => ({ ...f, make_model: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Location</label>
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.location || ''}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Lab / Shop Floor"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Range / Spec</label>
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.range_spec || ''}
                onChange={e => setForm(f => ({ ...f, range_spec: e.target.value }))}
                placeholder="e.g. 0-25mm ±0.001mm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Calibration Interval (days)</label>
              <input
                type="number"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.calibration_interval_days}
                onChange={e => setForm(f => ({ ...f, calibration_interval_days: parseInt(e.target.value) || 365 }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Last Calibrated Date</label>
              <input
                type="date"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.last_calibrated_date || ''}
                onChange={e => setForm(f => ({ ...f, last_calibrated_date: e.target.value || null }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Certificate Number</label>
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.calibration_cert_number || ''}
                onChange={e => setForm(f => ({ ...f, calibration_cert_number: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Calibrated By (Lab)</label>
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.calibrated_by || ''}
                onChange={e => setForm(f => ({ ...f, calibrated_by: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Notes</label>
            <textarea
              rows={2}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={form.notes || ''}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Add Instrument'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Record Calibration Modal
// ---------------------------------------------------------------------------
interface RecordCalibrationModalProps {
  record: CalibrationRecord
  onClose: () => void
  onSaved: () => void
}

function RecordCalibrationModal({ record, onClose, onSaved }: RecordCalibrationModalProps) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<CalibrateRequest>({
    calibration_date: today,
    cert_number: '',
    calibrated_by: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!form.cert_number.trim() || !form.calibrated_by.trim()) {
      setError('Certificate number and calibrated-by are required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await recordCalibration(record.id, form)
      onSaved()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string }
      setError(err?.response?.data?.detail ?? err?.message ?? 'Failed to record calibration')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Record Calibration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          <span className="font-medium">{record.instrument_name}</span>
          {' '}<span className="text-gray-400 font-mono text-xs">({record.instrument_code})</span>
        </p>

        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Calibration Date *</label>
            <input
              type="date"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.calibration_date}
              onChange={e => setForm(f => ({ ...f, calibration_date: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Certificate Number *</label>
            <input
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.cert_number}
              onChange={e => setForm(f => ({ ...f, cert_number: e.target.value }))}
              placeholder="e.g. CERT-2025-001"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Calibrated By (Lab) *</label>
            <input
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.calibrated_by}
              onChange={e => setForm(f => ({ ...f, calibrated_by: e.target.value }))}
              placeholder="e.g. NABL Accredited Lab"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Notes</label>
            <textarea
              rows={2}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={form.notes || ''}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Record Calibration'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function CalibrationPage() {
  const [stats, setStats] = useState<CalibrationStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [calibratingRecord, setCalibratingRecord] = useState<CalibrationRecord | null>(null)

  const { data: records, isDemo, loading, refetch } = useDemoFallback<CalibrationRecord>(
    () => listCalibrationRecords(),
    DEMO_CALIBRATION,
    [],
  )

  const fetchData = async () => {
    setError(null)
    refetch()
    try {
      const st = await getCalibrationStats()
      setStats(st)
    } catch {
      // stats failure is non-fatal; show zeros from demo data
    }
  }

  useEffect(() => {
    getCalibrationStats()
      .then(setStats)
      .catch(() => { /* non-fatal */ })
  }, [])

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calibration</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Module 21 "" Instrument register, calibration schedule and certificates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchData}
            icon={<RefreshCw size={14} />}
            title="Refresh"
          />
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setShowAddModal(true)}
          >
            Add Instrument
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Instruments"
          value={stats?.total ?? records.length}
          icon={<Gauge size={18} className="text-blue-600" />}
          colour="bg-blue-50"
          sub="In register"
        />
        <StatCard
          label="Due Within 30 Days"
          value={stats?.due_within_30_days ?? 0}
          icon={<Clock size={18} className="text-amber-500" />}
          colour="bg-amber-50"
          sub="Scheduled calibrations"
        />
        <StatCard
          label="Overdue"
          value={stats?.overdue_count ?? 0}
          icon={<AlertTriangle size={18} className="text-red-500" />}
          colour="bg-red-50"
          sub="Past due date"
        />
        <StatCard
          label="Active"
          value={stats?.active ?? 0}
          icon={<CheckCircle size={18} className="text-green-600" />}
          colour="bg-green-50"
          sub="Up to date"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Demo banner */}
      {isDemo && <DemoBanner />}

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 animate-pulse">
          Loading calibration records...
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Gauge size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">No calibration records yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Click "Add Instrument" to register your first instrument.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <span className="text-xs text-gray-500">{records.length} instruments</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[
                    'Code',
                    'Name',
                    'Type',
                    'Serial No.',
                    'Location',
                    'Last Calibration',
                    'Next Due',
                    'Certificate',
                    'Status',
                    'Action',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-mono text-xs font-semibold text-amber-700">
                      {rec.instrument_code}
                    </td>
                    <td className="px-3 py-2.5 text-gray-800">{rec.instrument_name}</td>
                    <td className="px-3 py-2.5 text-gray-600">{rec.instrument_type ?? '-'}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-600">
                      {rec.serial_number ?? '-'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{rec.location ?? '-'}</td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                      {rec.last_calibrated_date
                        ? new Date(rec.last_calibrated_date).toLocaleDateString('en-IN')
                        : '-'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {rec.next_due_date ? (
                        <span
                          className={
                            rec.is_overdue || rec.status === 'Overdue'
                              ? 'text-red-600 font-semibold'
                              : (() => {
                                  const days = Math.ceil(
                                    (new Date(rec.next_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                                  )
                                  return days <= 30 && days >= 0 ? 'text-amber-600 font-semibold' : 'text-gray-600'
                                })()
                          }
                        >
                          {new Date(rec.next_due_date).toLocaleDateString('en-IN')}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-500">
                      {rec.calibration_cert_number ?? '-'}
                    </td>
                    <td className="px-3 py-2.5">
                      {statusBadge(rec)}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => setCalibratingRecord(rec)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Record Calibration
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Instrument Modal */}
      {showAddModal && (
        <AddInstrumentModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false)
            fetchData()
          }}
        />
      )}

      {/* Record Calibration Modal */}
      {calibratingRecord && (
        <RecordCalibrationModal
          record={calibratingRecord}
          onClose={() => setCalibratingRecord(null)}
          onSaved={() => {
            setCalibratingRecord(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}
