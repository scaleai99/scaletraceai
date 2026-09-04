/**
 * BallooningPanel - OP110 ballooning against the REAL drawing.
 *
 * The page is rendered server-side from the uploaded PDF (pymupdf), so balloons
 * sit on the actual sheet rather than on an invented part outline. Coordinates
 * are stored as 0-1 fractions of the page, so the overlay survives any zoom or
 * render width.
 *
 * Click a row then click the drawing to place that balloon; click a balloon to
 * select its row. Nothing is auto-placed: an unplaced characteristic is listed
 * as unplaced rather than dropped somewhere plausible.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Crosshair, RefreshCw, MapPin } from 'lucide-react'
import { getCharacteristicSet, placeBalloon, type ExtractionCharacteristic } from '../../api/characteristicsApi'

interface Props {
  rfqId: string
  lineItemId: string
}

export function BallooningPanel({ rfqId, lineItemId }: Props) {
  const [chars, setChars] = useState<ExtractionCharacteristic[]>([])
  const [setId, setSetId] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [placing, setPlacing] = useState(false)
  const [imgOk, setImgOk] = useState<boolean | null>(null)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [imgMsg, setImgMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  const pageUrl = `/api/v1/rfqs/${rfqId}/line-items/${lineItemId}/drawing-page?page=1&width=1400`

  const load = useCallback(() => {
    setLoading(true); setError(null)
    getCharacteristicSet(rfqId, lineItemId)
      .then((s) => {
        setSetId(s?.id ?? null)
        setChars((s?.characteristics ?? []) as ExtractionCharacteristic[])
      })
      .catch((err: unknown) => {
        const ax = err as { response?: { data?: { detail?: string } } }
        setError(ax?.response?.data?.detail ?? 'Could not load the characteristic set.')
        setChars([])
      })
      .finally(() => setLoading(false))
  }, [rfqId, lineItemId])

  useEffect(() => { load() }, [load])

  // A plain <img src> would NOT carry the Bearer token and would 401, so the
  // page is fetched as an authenticated blob and shown from an object URL.
  // The real failure reason is surfaced instead of a broken-image icon.
  useEffect(() => {
    let alive = true
    let objectUrl: string | null = null
    fetch(pageUrl, { headers: authHeader() })
      .then(async (r) => {
        if (!alive) return
        if (r.ok) {
          const blob = await r.blob()
          objectUrl = URL.createObjectURL(blob)
          setImgUrl(objectUrl); setImgOk(true); setImgMsg(null)
          return
        }
        let detail: unknown = `HTTP ${r.status}`
        try { const j = await r.json(); detail = j?.detail?.message || j?.detail || detail } catch { /* non-JSON body */ }
        setImgOk(false); setImgMsg(typeof detail === 'string' ? detail : JSON.stringify(detail))
      })
      .catch(() => { if (alive) { setImgOk(false); setImgMsg('Could not reach the drawing renderer.') } })
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [pageUrl])

  function authHeader(): Record<string, string> {
    try {
      const raw = localStorage.getItem('scale-erp-auth')
      const p = raw ? JSON.parse(raw) : null
      const t = p?.state?.token || p?.token
      return t ? { Authorization: `Bearer ${t}` } : {}
    } catch { return {} }
  }

  const onDrawingClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placing || !selected || !wrapRef.current) return
    const r = wrapRef.current.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
    try {
      await placeBalloon(selected, Number(x.toFixed(5)), Number(y.toFixed(5)), 1)
      setPlacing(false)
      load()
    } catch {
      setError('Could not save the balloon position.')
    }
  }

  const placed = chars.filter((c) => c.balloon_x != null && c.balloon_y != null)
  const unplaced = chars.filter((c) => c.balloon_x == null || c.balloon_y == null)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">
          {chars.length} characteristic{chars.length === 1 ? '' : 's'} &middot;{' '}
          <span className="font-medium text-gray-700">{placed.length} placed</span>
          {unplaced.length > 0 && <span className="text-amber-700"> &middot; {unplaced.length} unplaced</span>}
        </span>
        <button type="button" onClick={load}
          className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
        {selected && (
          <button type="button" onClick={() => setPlacing((p) => !p)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              placing ? 'bg-amber-500 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            <MapPin className="h-3.5 w-3.5" />
            {placing ? 'Click the drawing to place...' : 'Place selected balloon'}
          </button>
        )}
      </div>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}
      {!setId && !loading && (
        <p className="text-sm text-gray-400">No characteristic set on this line item yet - extract the drawing first (OP20).</p>
      )}

      {/* The drawing with the balloon overlay */}
      {imgOk === false && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          The drawing sheet could not be rendered, so balloons cannot be placed on it: {imgMsg}
          <span className="block text-amber-700">The characteristic list below is still complete and usable.</span>
        </div>
      )}
      {imgOk && imgUrl && (
        <div
          ref={wrapRef}
          onClick={onDrawingClick}
          className={`relative w-full overflow-hidden rounded-lg border border-gray-300 bg-white ${placing ? 'cursor-crosshair' : ''}`}
        >
          <img src={imgUrl} alt="Drawing sheet 1" className="block w-full select-none" draggable={false} />
          {placed.map((c) => {
            const on = selected === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelected(c.id) }}
                title={c.raw_text || c.feature_ref || ''}
                style={{ left: `${(c.balloon_x as number) * 100}%`, top: `${(c.balloon_y as number) * 100}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 text-[11px] font-bold leading-none
                  ${on ? 'border-amber-600 bg-amber-300 text-amber-950' : 'border-gray-800 bg-white text-gray-900'}
                  ${c.is_key ? 'ring-2 ring-amber-400' : ''}`}
                aria-label={`Balloon ${c.seq}`}
              >
                <span className="flex h-6 w-6 items-center justify-center">{c.seq}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Characteristic list */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-2 py-2 text-left">#</th>
              <th className="px-2 py-2 text-left">Requirement</th>
              <th className="px-2 py-2 text-left">Type</th>
              <th className="px-2 py-2 text-center">Key</th>
              <th className="px-2 py-2 text-center">Balloon</th>
            </tr>
          </thead>
          <tbody>
            {chars.length === 0 ? (
              <tr><td colSpan={5} className="px-2 py-6 text-center text-gray-400">No characteristics.</td></tr>
            ) : chars.map((c) => {
              const isPlaced = c.balloon_x != null && c.balloon_y != null
              return (
                <tr key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`cursor-pointer border-t border-gray-100 ${selected === c.id ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                  <td className="px-2 py-1.5 font-mono font-semibold">{c.seq}</td>
                  <td className="px-2 py-1.5">{c.raw_text || c.feature_ref || '-'}</td>
                  <td className="px-2 py-1.5 text-gray-600">{c.char_type}</td>
                  <td className="px-2 py-1.5 text-center">
                    {c.is_key && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">KEY</span>}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {isPlaced
                      ? <span className="text-emerald-700">placed</span>
                      : <span className="text-amber-600">unplaced</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selected && !placing && (
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <Crosshair className="h-3 w-3" />
          Balloon {chars.find((c) => c.id === selected)?.seq} selected - click &quot;Place selected balloon&quot;, then click the sheet.
        </p>
      )}
    </div>
  )
}
