/**
 * CharacteristicSetPanel — the signed characteristic-set backbone for one RFQ
 * line item (Drawing/Model extraction pipeline, Phase 1).
 *
 * Shows the intake manifest (what the file probe actually found), the
 * normalised characteristic list with confidence tiers, human confirm/edit/
 * add/delete, and the ONE signature gate that freezes the set as the
 * authoritative source for everything downstream. All data is real — an empty
 * extraction shows an empty set, never synthetic rows.
 */
import { useCallback, useEffect, useState } from 'react'
import {
  ClipboardCheck, ChevronDown, ChevronRight, Loader2, RefreshCw, Plus,
  Check, Trash2, Lock, Unlock, AlertTriangle, ShieldCheck,
} from 'lucide-react'
import {
  getCharacteristicSet,
  extractCharacteristicSet,
  updateCharacteristic,
  addCharacteristic,
  deleteCharacteristic,
  signCharacteristicSet,
  reopenCharacteristicSet,
  type CharacteristicSet,
  type ExtractionCharacteristic,
  type CharTier,
} from '../../api/characteristicsApi'

interface LineItemLite {
  id: string
  part_number?: string | null
  line_number?: number
  drawing_pdf_path?: string | null
  ai_extraction_id?: string | null
}

function TierBadge({ tier, confidence }: { tier: CharTier; confidence: number | null }) {
  const map: Record<CharTier, string> = {
    auto: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    confirm: 'bg-amber-50 text-amber-700 border-amber-200',
    must_open: 'bg-red-50 text-red-700 border-red-200',
  }
  const label: Record<CharTier, string> = {
    auto: 'Auto', confirm: '1-click', must_open: 'Open',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${map[tier]}`}>
      {confidence == null ? '—' : `${confidence}%`} · {label[tier]}
    </span>
  )
}

function SetStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-gray-50 text-gray-500 border-gray-200',
    extracted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    under_review: 'bg-amber-50 text-amber-700 border-amber-200',
    signed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    superseded: 'bg-gray-50 text-gray-400 border-gray-200',
  }
  const label: Record<string, string> = {
    draft: 'Draft', extracted: 'Extracted', under_review: 'Under review',
    signed: 'Signed', superseded: 'Superseded',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${map[status] ?? map.draft}`}>
      {label[status] ?? status}
    </span>
  )
}

export function CharacteristicSetPanel({ rfqId, lineItem }: { rfqId: string; lineItem: LineItemLite }) {
  const [set, setSet] = useState<CharacteristicSet | null>(null)
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manifestOpen, setManifestOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [edit, setEdit] = useState<Record<string, unknown>>({})
  const [adding, setAdding] = useState(false)
  const [newChar, setNewChar] = useState<Record<string, unknown>>({ char_type: 'dimension' })
  const [signNote, setSignNote] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getCharacteristicSet(rfqId, lineItem.id)
      .then((s) => setSet(s))
      .catch((e: unknown) => {
        const ax = e as { response?: { status?: number; data?: { detail?: string } } }
        const code = ax?.response?.status
        if (code === 404) {
          setError('Characteristic-set service not found (HTTP 404) — the backend needs a restart to load this module.')
        } else if (code) {
          const detail = ax?.response?.data?.detail
          setError(`Could not load the characteristic set (HTTP ${code}${detail ? ': ' + detail : ''}).`)
        } else {
          setError('Could not load the characteristic set — no response from the server (is the backend running?).')
        }
      })
      .finally(() => setLoading(false))
  }, [rfqId, lineItem.id])

  useEffect(() => { load() }, [load])

  const doExtract = async () => {
    setBusy('extract'); setError(null)
    try {
      const s = await extractCharacteristicSet(rfqId, lineItem.id)
      setSet(s)
    } catch (e: unknown) {
      setError(errMsg(e, 'Build failed.'))
    } finally { setBusy(null) }
  }

  const doConfirm = async (c: ExtractionCharacteristic) => {
    setBusy(c.id); setError(null)
    try { setSet(await updateCharacteristic(c.id, { confirm: true })) }
    catch (e) { setError(errMsg(e, 'Confirm failed.')) }
    finally { setBusy(null) }
  }

  const startEdit = (c: ExtractionCharacteristic) => {
    setEditId(c.id)
    setEdit({
      raw_text: c.raw_text ?? '', nominal: c.nominal ?? '', upper_tol: c.upper_tol ?? '',
      lower_tol: c.lower_tol ?? '', unit: c.unit ?? '', gdt_symbol: c.gdt_symbol ?? '',
      feature_ref: c.feature_ref ?? '', is_key: c.is_key, char_type: c.char_type,
    })
  }

  const saveEdit = async (cid: string) => {
    setBusy(cid); setError(null)
    try {
      const body: Record<string, unknown> = {
        raw_text: String(edit.raw_text ?? ''),
        unit: String(edit.unit ?? '') || undefined,
        gdt_symbol: String(edit.gdt_symbol ?? '') || undefined,
        feature_ref: String(edit.feature_ref ?? '') || undefined,
        char_type: String(edit.char_type ?? '') || undefined,
        is_key: !!edit.is_key,
        confirm: true,
      }
      body.nominal = edit.nominal === '' || edit.nominal == null ? null : Number(edit.nominal)
      body.upper_tol = edit.upper_tol === '' || edit.upper_tol == null ? null : Number(edit.upper_tol)
      body.lower_tol = edit.lower_tol === '' || edit.lower_tol == null ? null : Number(edit.lower_tol)
      setSet(await updateCharacteristic(cid, body))
      setEditId(null)
    } catch (e) { setError(errMsg(e, 'Save failed.')) }
    finally { setBusy(null) }
  }

  const doDelete = async (cid: string) => {
    setBusy(cid); setError(null)
    try { setSet(await deleteCharacteristic(cid)) }
    catch (e) { setError(errMsg(e, 'Delete failed.')) }
    finally { setBusy(null) }
  }

  const doAdd = async () => {
    if (!set) return
    const raw = String(newChar.raw_text ?? '').trim()
    if (!raw) { setError('Enter a description for the new characteristic.'); return }
    setBusy('add'); setError(null)
    try {
      const body: Record<string, unknown> = {
        set_id: set.id,
        char_type: String(newChar.char_type ?? 'general'),
        raw_text: raw,
        unit: String(newChar.unit ?? '') || undefined,
        gdt_symbol: String(newChar.gdt_symbol ?? '') || undefined,
        feature_ref: String(newChar.feature_ref ?? '') || undefined,
        is_key: !!newChar.is_key,
      }
      body.nominal = newChar.nominal === '' || newChar.nominal == null ? null : Number(newChar.nominal)
      setSet(await addCharacteristic(body as never))
      setAdding(false); setNewChar({ char_type: 'dimension' })
    } catch (e) { setError(errMsg(e, 'Add failed.')) }
    finally { setBusy(null) }
  }

  const doSign = async () => {
    if (!set) return
    setBusy('sign'); setError(null)
    try { setSet(await signCharacteristicSet(set.id, signNote || undefined)); setSignNote('') }
    catch (e) { setError(errMsg(e, 'Sign failed.')) }
    finally { setBusy(null) }
  }

  const doReopen = async () => {
    if (!set) return
    setBusy('reopen'); setError(null)
    try { setSet(await reopenCharacteristicSet(set.id)) }
    catch (e) { setError(errMsg(e, 'Reopen failed.')) }
    finally { setBusy(null) }
  }

  const signed = set?.status === 'signed'
  const frozen = signed || set?.status === 'superseded'
  const canSign = !!set && set.characteristic_count > 0 && set.open_count === 0 && !signed

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-t-2xl px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-2.5">
          <ClipboardCheck size={17} className="text-indigo-600" />
          <span className="text-sm font-semibold text-gray-800">Characteristic Set</span>
          <span className="text-xs text-gray-400">— signed baseline for costing, quotation &amp; inspection</span>
          {set && <SetStatusPill status={set.status} />}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {set && <span>{set.characteristic_count} chars · {set.key_characteristic_count} key · {set.open_count} open</span>}
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4">
          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              onClick={doExtract}
              disabled={busy === 'extract' || !lineItem.ai_extraction_id}
              title={!lineItem.ai_extraction_id ? 'Upload a drawing first — extraction runs in the background, then the set can be built.' : 'Build / rebuild the characteristic set from the AI extraction'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              {busy === 'extract' ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              {set ? 'Re-extract' : 'Build characteristic set'}
            </button>
            <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
              {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Refresh
            </button>
            {set && !frozen && (
              <button onClick={() => setAdding((a) => !a)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                <Plus size={13} /> Add characteristic
              </button>
            )}
          </div>

          {!set && !loading && (
            <p className="text-sm text-gray-400">
              No characteristic set yet.{' '}
              {lineItem.ai_extraction_id
                ? 'Click "Build characteristic set" to normalise the AI extraction into a reviewable, signable set.'
                : 'Upload a drawing above — the set is built automatically once the background AI extraction finishes.'}
            </p>
          )}

          {set && (
            <>
              {/* Intake manifest */}
              {set.intake_manifest && (
                <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50">
                  <button onClick={() => setManifestOpen((m) => !m)} className="flex w-full items-center justify-between px-4 py-2.5 text-left">
                    <span className="text-xs font-semibold text-gray-700">
                      Intake manifest — {String(set.intake_manifest.detected_type ?? 'unknown')}
                      {set.intake_manifest.classification ? ` · ${String(set.intake_manifest.classification)}` : ''}
                    </span>
                    {manifestOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {manifestOpen && (
                    <div className="border-t border-gray-200 px-4 py-3 text-xs text-gray-600">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
                        <ManifestKV k="Type (by)" v={`${str(set.intake_manifest.detected_type)} (${str(set.intake_manifest.detected_by)})`} />
                        <ManifestKV k="Pages" v={num(set.intake_manifest.page_count)} />
                        <ManifestKV k="Text layer" v={set.intake_manifest.has_text_layer == null ? '—' : (set.intake_manifest.has_text_layer ? 'yes' : 'no (OCR)')} />
                        <ManifestKV k="Text chars" v={num(set.intake_manifest.text_char_count)} />
                        <ManifestKV k="Encrypted" v={set.intake_manifest.encrypted == null ? '—' : (set.intake_manifest.encrypted ? 'yes' : 'no')} />
                        <ManifestKV k="STEP schema" v={str(set.intake_manifest.step_schema)} />
                        <ManifestKV k="PMI hint" v={set.intake_manifest.has_pmi_hint == null ? '—' : (set.intake_manifest.has_pmi_hint ? `yes (${num(set.intake_manifest.pmi_entity_hint_count)})` : 'no')} />
                        <ManifestKV k="Size" v={set.intake_manifest.file_size_bytes ? `${Math.round(Number(set.intake_manifest.file_size_bytes) / 1024)} KB` : '—'} />
                      </div>
                      {Array.isArray(set.intake_manifest.warnings) && set.intake_manifest.warnings.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {set.intake_manifest.warnings.map((w, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-amber-700">
                              <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {w}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Characteristic table */}
              {set.characteristics.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
                  The AI extraction produced no discrete characteristics for this drawing. Add them manually, or re-upload a clearer drawing.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wide text-gray-400">
                        <th className="py-2 pr-2">#</th>
                        <th className="py-2 pr-2">Type</th>
                        <th className="py-2 pr-2">Feature / text</th>
                        <th className="py-2 pr-2">Nominal ± tol</th>
                        <th className="py-2 pr-2">GD&amp;T</th>
                        <th className="py-2 pr-2">Confidence</th>
                        <th className="py-2 pr-2">Key</th>
                        <th className="py-2 pr-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {set.characteristics.map((c) => (
                        editId === c.id ? (
                          <tr key={c.id} className="bg-indigo-50/40">
                            <td className="py-2 pr-2 align-top text-gray-400">{c.seq}</td>
                            <td className="py-2 pr-2 align-top" colSpan={6}>
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <input className={inp} placeholder="Type" value={str(edit.char_type)} onChange={(e) => setEdit((p) => ({ ...p, char_type: e.target.value }))} />
                                <input className={`${inp} col-span-2`} placeholder="Feature / description" value={str(edit.raw_text)} onChange={(e) => setEdit((p) => ({ ...p, raw_text: e.target.value }))} />
                                <input className={inp} placeholder="Feature ref" value={str(edit.feature_ref)} onChange={(e) => setEdit((p) => ({ ...p, feature_ref: e.target.value }))} />
                                <input className={inp} placeholder="Nominal" value={str(edit.nominal)} onChange={(e) => setEdit((p) => ({ ...p, nominal: e.target.value }))} />
                                <input className={inp} placeholder="Upper tol" value={str(edit.upper_tol)} onChange={(e) => setEdit((p) => ({ ...p, upper_tol: e.target.value }))} />
                                <input className={inp} placeholder="Lower tol" value={str(edit.lower_tol)} onChange={(e) => setEdit((p) => ({ ...p, lower_tol: e.target.value }))} />
                                <input className={inp} placeholder="Unit" value={str(edit.unit)} onChange={(e) => setEdit((p) => ({ ...p, unit: e.target.value }))} />
                                <input className={inp} placeholder="GD&T symbol" value={str(edit.gdt_symbol)} onChange={(e) => setEdit((p) => ({ ...p, gdt_symbol: e.target.value }))} />
                                <label className="flex items-center gap-1.5 text-gray-600"><input type="checkbox" checked={!!edit.is_key} onChange={(e) => setEdit((p) => ({ ...p, is_key: e.target.checked }))} /> Key</label>
                              </div>
                            </td>
                            <td className="py-2 pr-2 align-top text-right">
                              <div className="flex justify-end gap-1">
                                <button className="rounded bg-indigo-600 px-2 py-1 text-white disabled:opacity-40" disabled={busy === c.id} onClick={() => saveEdit(c.id)}>{busy === c.id ? '…' : 'Save'}</button>
                                <button className="rounded border border-gray-300 px-2 py-1 text-gray-600" onClick={() => setEditId(null)}>Cancel</button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr key={c.id} className={c.status === 'Deleted' ? 'opacity-40' : ''}>
                            <td className="py-2 pr-2 text-gray-400">{c.seq}</td>
                            <td className="py-2 pr-2"><span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">{c.char_type}</span></td>
                            <td className="py-2 pr-2 text-gray-700">
                              {c.feature_ref && <span className="font-medium">{c.feature_ref}: </span>}
                              {c.raw_text ?? '—'}
                              {c.confirmed_at && <Check size={11} className="ml-1 inline text-emerald-600" />}
                            </td>
                            <td className="py-2 pr-2 font-mono text-gray-700">
                              {c.nominal == null ? '—' : c.nominal}
                              {c.upper_tol != null || c.lower_tol != null ? ` (+${c.upper_tol ?? 0}/${c.lower_tol ?? 0})` : ''}
                              {c.unit ? ` ${c.unit}` : ''}
                            </td>
                            <td className="py-2 pr-2 font-mono text-gray-600">{c.gdt_symbol ?? '—'}{c.datums && c.datums.length ? ` |${(c.datums as string[]).join('|')}` : ''}</td>
                            <td className="py-2 pr-2"><TierBadge tier={c.tier} confidence={c.confidence} /></td>
                            <td className="py-2 pr-2">{c.is_key ? <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">KEY</span> : ''}</td>
                            <td className="py-2 pr-2 text-right">
                              {!frozen && (
                                <div className="flex justify-end gap-1">
                                  {!c.confirmed_at && (
                                    <button title="Confirm" className="rounded p-1 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40" disabled={busy === c.id} onClick={() => doConfirm(c)}><Check size={13} /></button>
                                  )}
                                  <button title="Edit" className="rounded p-1 text-gray-500 hover:bg-gray-100" onClick={() => startEdit(c)}>✎</button>
                                  <button title="Delete" className="rounded p-1 text-red-500 hover:bg-red-50 disabled:opacity-40" disabled={busy === c.id} onClick={() => doDelete(c.id)}><Trash2 size={13} /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add row */}
              {adding && !frozen && (
                <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <input className={inp} placeholder="Type (dimension/gdt/note…)" value={str(newChar.char_type)} onChange={(e) => setNewChar((p) => ({ ...p, char_type: e.target.value }))} />
                    <input className={`${inp} col-span-2`} placeholder="Description / callout *" value={str(newChar.raw_text)} onChange={(e) => setNewChar((p) => ({ ...p, raw_text: e.target.value }))} />
                    <input className={inp} placeholder="Feature ref" value={str(newChar.feature_ref)} onChange={(e) => setNewChar((p) => ({ ...p, feature_ref: e.target.value }))} />
                    <input className={inp} placeholder="Nominal" value={str(newChar.nominal)} onChange={(e) => setNewChar((p) => ({ ...p, nominal: e.target.value }))} />
                    <input className={inp} placeholder="Unit" value={str(newChar.unit)} onChange={(e) => setNewChar((p) => ({ ...p, unit: e.target.value }))} />
                    <input className={inp} placeholder="GD&T symbol" value={str(newChar.gdt_symbol)} onChange={(e) => setNewChar((p) => ({ ...p, gdt_symbol: e.target.value }))} />
                    <label className="flex items-center gap-1.5 text-xs text-gray-600"><input type="checkbox" checked={!!newChar.is_key} onChange={(e) => setNewChar((p) => ({ ...p, is_key: e.target.checked }))} /> Key characteristic</label>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40" disabled={busy === 'add'} onClick={doAdd}>{busy === 'add' ? 'Adding…' : 'Add'}</button>
                    <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600" onClick={() => setAdding(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Sign gate */}
              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                {signed ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <ShieldCheck size={16} />
                      <span>Signed{set.signed_by ? ` by ${set.signed_by}` : ''}{set.signed_at ? ` · ${new Date(set.signed_at).toLocaleString()}` : ''} — v{set.version} is the authoritative baseline.</span>
                    </div>
                    <button onClick={doReopen} disabled={busy === 'reopen'} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                      <Unlock size={13} /> Reopen
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex-1 min-w-[220px]">
                      <label className="mb-1 block text-[11px] font-medium text-gray-500">Signature note (optional)</label>
                      <input className={inp} placeholder="e.g. reviewed against Rev C, all KCs confirmed" value={signNote} onChange={(e) => setSignNote(e.target.value)} />
                      {!canSign && (
                        <p className="mt-1.5 text-[11px] text-amber-700">
                          {set.characteristic_count === 0
                            ? 'Nothing to sign yet — build the set or add characteristics.'
                            : `${set.open_count} low-confidence characteristic(s) must be reviewed and confirmed before signing.`}
                        </p>
                      )}
                    </div>
                    <button onClick={doSign} disabled={!canSign || busy === 'sign'} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40">
                      {busy === 'sign' ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />} Sign characteristic set
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const inp = 'w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none'

function str(v: unknown): string { return v == null ? '' : String(v) }
function num(v: unknown): string { return v == null ? '—' : String(v) }

function ManifestKV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-400">{k}</span>
      <span className="font-medium text-gray-700">{v}</span>
    </div>
  )
}

function errMsg(e: unknown, fallback: string): string {
  const r = e as { response?: { data?: { detail?: string } } }
  return r?.response?.data?.detail ?? fallback
}
