import { useEffect, useState, useCallback } from 'react'
import { PenTool, Plus } from 'lucide-react'
import { listSignatures, createSignature, signSignature, type SignatureRequest } from '../../api/integrationApi'
const DOC_TYPES = ['Quotation', 'PO', 'Contract', 'FAIR', 'NCR', 'Other']
export function ESignaturePage() {
  const [rows, setRows] = useState<SignatureRequest[]>([])
  const [err, setErr] = useState('')
  const [f, setF] = useState({ document_type: 'Quotation', document_ref: '', signer_name: '', signer_email: '' })
  const load = useCallback(() => { listSignatures().then(setRows).catch(() => setRows([])) }, [])
  useEffect(() => { load() }, [load])
  const add = async () => { setErr(''); try { await createSignature(f); setF({ document_type: 'Quotation', document_ref: '', signer_name: '', signer_email: '' }); load() } catch (e: any) { setErr(e?.response?.data?.detail || String(e)) } }
  const sign = async (id: string) => { await signSignature(id); load() }
  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-4"><PenTool className="w-5 h-5 text-amber-500" /><h1 className="text-xl font-semibold">E-Signature</h1></div>
      <p className="text-xs text-gray-500 mb-3">On-premise e-signature register "" signing applies a local SHA-256 seal (no external provider).</p>
      <div className="flex flex-wrap gap-2 mb-3 items-end border border-gray-200 rounded p-3">
        <select className="border rounded px-2 py-1 text-sm" value={f.document_type} onChange={e => setF({ ...f, document_type: e.target.value })}>{DOC_TYPES.map(t => <option key={t}>{t}</option>)}</select>
        <input className="border rounded px-2 py-1 text-sm w-36" placeholder="Document ref" value={f.document_ref} onChange={e => setF({ ...f, document_ref: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm w-40" placeholder="Signer name" value={f.signer_name} onChange={e => setF({ ...f, signer_name: e.target.value })} />
        <input className="border rounded px-2 py-1 text-sm w-40" placeholder="Signer email" value={f.signer_email} onChange={e => setF({ ...f, signer_email: e.target.value })} />
        <button onClick={add} className="bg-amber-500 hover:bg-amber-600 text-white text-sm rounded px-3 py-1 flex items-center gap-1"><Plus className="w-3 h-3" />Request</button>
      </div>
      {err && <p className="text-red-600 text-xs mb-2">{err}</p>}
      <table className="w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-3 py-2">Document</th><th className="text-left px-3 py-2">Ref</th><th className="text-left px-3 py-2">Signer</th><th className="text-left px-3 py-2">Status</th><th className="text-left px-3 py-2">Seal</th><th></th></tr></thead>
        <tbody>{rows.map(s => <tr key={s.id} className="border-t border-gray-100"><td className="px-3 py-1.5">{s.document_type}</td><td className="px-3 py-1.5">{s.document_ref}</td><td className="px-3 py-1.5">{s.signer_name}</td><td className="px-3 py-1.5">{s.status}</td><td className="px-3 py-1.5 font-mono text-[10px]">{s.signature_hash ? s.signature_hash.slice(0, 12) + '"¦' : '""'}</td>
          <td className="px-3 py-1.5 text-right">{s.status === 'Pending' && <button onClick={() => sign(s.id)} className="text-xs bg-amber-500 text-white rounded px-2 py-0.5">Sign</button>}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No signature requests yet.</td></tr>}</tbody>
      </table>
    </div>
  )
}
export default ESignaturePage
