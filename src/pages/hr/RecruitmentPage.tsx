import { useEffect, useState, useCallback } from 'react'
import { UserPlus, Plus } from 'lucide-react'
import { listReqs, createReq, updateReq, listCandidates, createCandidate, updateCandidate, type JobRequisition, type Candidate } from '../../api/hrExtApi'

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected']

export function RecruitmentPage() {
  const [reqs, setReqs] = useState<JobRequisition[]>([])
  const [cands, setCands] = useState<Candidate[]>([])
  const [sel, setSel] = useState<string | null>(null)
  const [rf, setRf] = useState({ title: '', department: '', positions: 1 })
  const [cf, setCf] = useState({ name: '', email: '', phone: '' })
  const [err, setErr] = useState('')
  const loadReqs = useCallback(() => { listReqs().then(setReqs).catch(e => setErr(String(e))) }, [])
  const loadCands = useCallback((rid: string) => { listCandidates(rid).then(setCands).catch(() => setCands([])) }, [])
  useEffect(() => { loadReqs() }, [loadReqs])
  useEffect(() => { if (sel) loadCands(sel) }, [sel, loadCands])
  const addReq = async () => { setErr(''); try { await createReq(rf); setRf({ title: '', department: '', positions: 1 }); loadReqs() } catch (e: any) { setErr(e?.response?.data?.detail || String(e)) } }
  const addCand = async () => { if (!sel) return; await createCandidate({ ...cf, requisition_id: sel }); setCf({ name: '', email: '', phone: '' }); loadCands(sel) }
  const moveStage = async (id: string, stage: string) => { await updateCandidate(id, { stage }); if (sel) loadCands(sel) }
  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-4"><UserPlus className="w-5 h-5 text-amber-500" /><h1 className="text-xl font-semibold">Recruitment</h1></div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold mb-2">Job Requisitions</h2>
          <div className="flex flex-wrap gap-2 mb-2 items-end border border-gray-200 rounded p-2">
            <input className="border rounded px-2 py-1 text-sm flex-1 min-w-[120px]" placeholder="Title" value={rf.title} onChange={e => setRf({ ...rf, title: e.target.value })} />
            <input className="border rounded px-2 py-1 text-sm w-28" placeholder="Dept" value={rf.department} onChange={e => setRf({ ...rf, department: e.target.value })} />
            <input type="number" className="border rounded px-2 py-1 text-sm w-16" value={rf.positions} onChange={e => setRf({ ...rf, positions: Number(e.target.value) })} />
            <button onClick={addReq} className="bg-amber-500 text-white text-sm rounded px-2 py-1"><Plus className="w-3 h-3" /></button>
          </div>
          {err && <p className="text-red-600 text-xs mb-2">{err}</p>}
          <table className="w-full text-sm border border-gray-200 rounded">
            <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-2 py-1.5">Title</th><th className="text-left px-2 py-1.5">Dept</th><th className="text-left px-2 py-1.5">Pos</th><th className="text-left px-2 py-1.5">Status</th></tr></thead>
            <tbody>{reqs.map(r => <tr key={r.id} onClick={() => setSel(r.id)} className={`border-t border-gray-100 cursor-pointer ${sel === r.id ? 'bg-amber-50' : 'hover:bg-gray-50'}`}><td className="px-2 py-1.5">{r.title}</td><td className="px-2 py-1.5">{r.department}</td><td className="px-2 py-1.5">{r.positions}</td>
              <td className="px-2 py-1.5"><select value={r.status} onClick={e => e.stopPropagation()} onChange={async e => { await updateReq(r.id, { status: e.target.value }); loadReqs() }} className="text-xs border rounded"><option>Open</option><option>OnHold</option><option>Closed</option></select></td></tr>)}
              {reqs.length === 0 && <tr><td colSpan={4} className="px-2 py-4 text-center text-gray-400">No requisitions.</td></tr>}</tbody>
          </table>
        </div>
        <div>
          <h2 className="text-sm font-semibold mb-2">Candidates {sel ? '' : <span className="text-xs text-gray-400">(select a requisition)</span>}</h2>
          {sel && (
            <div className="flex flex-wrap gap-2 mb-2 items-end border border-gray-200 rounded p-2">
              <input className="border rounded px-2 py-1 text-sm flex-1 min-w-[100px]" placeholder="Name" value={cf.name} onChange={e => setCf({ ...cf, name: e.target.value })} />
              <input className="border rounded px-2 py-1 text-sm w-36" placeholder="Email" value={cf.email} onChange={e => setCf({ ...cf, email: e.target.value })} />
              <button onClick={addCand} className="bg-amber-500 text-white text-sm rounded px-2 py-1"><Plus className="w-3 h-3" /></button>
            </div>
          )}
          <table className="w-full text-sm border border-gray-200 rounded">
            <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-2 py-1.5">Name</th><th className="text-left px-2 py-1.5">Stage</th></tr></thead>
            <tbody>{cands.map(c => <tr key={c.id} className="border-t border-gray-100"><td className="px-2 py-1.5">{c.name}</td>
              <td className="px-2 py-1.5"><select value={c.stage} onChange={e => moveStage(c.id, e.target.value)} className="text-xs border rounded">{STAGES.map(s => <option key={s}>{s}</option>)}</select></td></tr>)}
              {sel && cands.length === 0 && <tr><td colSpan={2} className="px-2 py-4 text-center text-gray-400">No candidates.</td></tr>}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
export default RecruitmentPage
