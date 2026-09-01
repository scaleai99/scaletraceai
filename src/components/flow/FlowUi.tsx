/**
 * FlowUi — shared presentational primitives for the RFQ → Quotation flow.
 *
 * These render the stage-by-stage card layout from the approved design
 * screenshots. They are used INSIDE the existing RFQ detail page (stages 1–4)
 * and Quotation detail page (stages 5–12) — there is no separate workbench
 * route. Everything here is pure presentation; data + handlers come from the
 * host page.
 */
import React from 'react'
import { Check } from 'lucide-react'

export type Tone = 'green' | 'indigo' | 'amber' | 'gray' | 'rose'

/* ---- button class strings (indigo/violet flow theme) ---- */
export const btnPrimary =
  'inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
export const btnGhost =
  'inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
export const btnDanger =
  'inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
export const btnSuccess =
  'inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

export function MetaChip({ label, value, tone }: { label: string; value: React.ReactNode; tone?: Tone }) {
  const v =
    tone === 'green' ? 'text-emerald-600'
    : tone === 'indigo' ? 'text-indigo-600'
    : tone === 'amber' ? 'text-amber-600'
    : tone === 'rose' ? 'text-rose-600'
    : 'text-gray-800'
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 min-w-[110px]">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</div>
      <div className={`mt-0.5 font-mono text-sm font-semibold ${v}`}>{value}</div>
    </div>
  )
}

export function Card({
  title, right, children, className = '',
}: { title?: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          {title && <h3 className="text-base font-bold text-gray-900">{title}</h3>}
          {right}
        </div>
      )}
      <div className={title ? 'px-6 pb-6' : 'p-6'}>{children}</div>
    </div>
  )
}

export function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-800">{value}</span>
    </div>
  )
}

/** Read-only labelled value (used for real data display). */
export function FieldValue({ label, value, required }: { label: string; value: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}{required && <span className="text-rose-500"> *</span>}</label>
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 min-h-[38px]">
        {value ?? <span className="text-gray-300">—</span>}
      </div>
    </div>
  )
}

/** Editable input, controlled. */
export function FieldInput({
  label, value, onChange, required, type = 'text', placeholder,
}: { label: string; value: string; onChange?: (v: string) => void; required?: boolean; type?: string; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}{required && <span className="text-rose-500"> *</span>}</label>
      <input
        value={value}
        placeholder={placeholder}
        type={type}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={!onChange}
        className={`rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none ${!onChange ? 'bg-gray-50' : ''}`}
      />
    </div>
  )
}

export function CheckItem({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 text-sm text-gray-700">
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${ok ? 'text-emerald-500' : 'text-amber-500'}`}>
        {ok ? <Check size={16} /> : <span className="text-lg leading-none">⚠</span>}
      </span>
      <span>{children}</span>
    </div>
  )
}

export function DriverBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-xs"><span className="text-gray-600">{label}</span><span className="font-semibold text-gray-700">{pct}%</span></div>
      <div className="h-1.5 w-full rounded-full bg-gray-100"><div className="h-1.5 rounded-full bg-indigo-500" style={{ width: pct + '%' }} /></div>
    </div>
  )
}

export function Badge({ text, tone }: { text: React.ReactNode; tone: Tone }) {
  const c = {
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    indigo: 'bg-indigo-50 text-indigo-600',
    gray: 'bg-gray-100 text-gray-500',
    rose: 'bg-rose-100 text-rose-700',
  }[tone]
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${c}`}>{text}</span>
}

export function Footer({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-3 pt-4">{children}</div>
}

export function StageHeader({
  n, group, title, desc, meta,
}: { n: number; group: string; title: string; desc: string; meta?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-6 pb-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">STAGE {String(n).padStart(2, '0')} · {group}</div>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-1.5 max-w-xl text-sm text-gray-500">{desc}</p>
      </div>
      {meta && <div className="flex shrink-0 flex-wrap gap-3">{meta}</div>}
    </div>
  )
}

/** A placeholder card for stages/sections whose backend does not exist yet. */
export function PlaceholderNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-700">
      {children}
    </div>
  )
}

export interface FlowStageDef { n: number; title: string; sub: string; group: string }

/** Horizontal stage strip shown at the top of a flow page (in-page, not full screen). */
export function StageStrip({
  stages, active, done, onSelect,
}: { stages: FlowStageDef[]; active: number; done: Set<number>; onSelect: (n: number) => void }) {
  return (
    <div className="flex items-stretch gap-2 overflow-x-auto rounded-xl border border-gray-200 bg-white p-2">
      {stages.map((s) => {
        const isActive = s.n === active
        const isDone = done.has(s.n)
        return (
          <button
            key={s.n}
            onClick={() => onSelect(s.n)}
            className={`flex min-w-[168px] flex-1 items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${isActive ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-gray-50'}`}
          >
            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
              isActive ? 'bg-indigo-600 text-white'
              : isDone ? 'bg-emerald-100 text-emerald-600'
              : 'border border-gray-300 text-gray-400'}`}>
              {isDone && !isActive ? <Check size={13} /> : s.n}
            </span>
            <span className="leading-tight">
              <span className={`text-[13px] font-semibold ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>{s.title}</span>
              <span className="block text-[11px] text-gray-400">{s.sub}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
