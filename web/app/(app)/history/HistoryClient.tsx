'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { HistoryItem } from '@/lib/history'

function tierColor(score: number): string {
  if (score >= 80) return 'var(--low)'
  if (score >= 60) return 'var(--mid)'
  return 'var(--high)'
}

function tierBg(score: number): string {
  if (score >= 80) return 'var(--low-bg)'
  if (score >= 60) return 'var(--mid-bg)'
  return 'var(--high-bg)'
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function HistoryClient({ items }: { items: HistoryItem[] }) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase()
    if (!kw) return items
    return items.filter((it) => it.fileName.toLowerCase().includes(kw))
  }, [items, q])

  return (
    <>
      {/* 标题 + 搜索 */}
      <div className="mb-6 flex items-center gap-4">
        <h1 className="text-[22px] font-black text-ink">历史记录</h1>
        <span className="text-[13px] text-muted">共 {items.length} 份合同</span>
        <div className="ml-auto relative w-[280px] max-w-full">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索合同名称"
            className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-muted focus:border-line-strong"
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-12 text-center">
          <p className="text-[14px] text-ink-soft">还没有体检过任何合同</p>
          <Link
            href="/home"
            className="mt-4 inline-block rounded-lg bg-black-btn px-5 py-2.5 text-[13px] font-bold text-white"
          >
            去审核第一份合同
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          {/* 表头 */}
          <div className="grid grid-cols-[minmax(0,1fr)_90px_200px_180px_110px] items-center gap-3 border-b border-line px-5 py-3 text-[12px] font-bold text-muted">
            <span>合同</span>
            <span>健康度</span>
            <span>风险分布</span>
            <span>体检时间</span>
            <span></span>
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-muted">
              没有匹配「{q}」的合同
            </div>
          ) : (
            filtered.map((it) => (
              <div
                key={it.reportId}
                className="grid grid-cols-[minmax(0,1fr)_90px_200px_180px_110px] items-center gap-3 border-b border-line px-5 py-4 last:border-b-0 transition-colors hover:bg-page"
              >
                {/* 合同名 */}
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--accent-bg)' }}>
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-accent">
                      <path d="M7 3h7l3 3v15H7V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                      <path d="M14 3v4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-extrabold text-ink">{it.fileName}</div>
                    {it.status !== 'done' && (
                      <div className="mt-0.5 text-[11px] text-muted">
                        {it.status === 'failed' ? '审核未完成' : '审核中'}
                      </div>
                    )}
                  </div>
                </div>

                {/* 健康度 */}
                <div>
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-black"
                    style={{ background: tierBg(it.score), color: tierColor(it.score) }}
                  >
                    {it.score}
                  </span>
                </div>

                {/* 风险分布 */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded px-1.5 py-0.5 text-[11.5px] font-bold" style={{ background: 'var(--high-bg)', color: 'var(--high)' }}>高{it.high}</span>
                  <span className="rounded px-1.5 py-0.5 text-[11.5px] font-bold" style={{ background: 'var(--mid-bg)', color: 'var(--mid)' }}>中{it.mid}</span>
                  <span className="rounded px-1.5 py-0.5 text-[11.5px] font-bold" style={{ background: 'var(--low-bg)', color: 'var(--low)' }}>低{it.low}</span>
                </div>

                {/* 时间 */}
                <div className="text-[12.5px] text-ink-soft">{fmtDate(it.createdAt)}</div>

                {/* 查看报告 */}
                <div className="text-right">
                  <Link
                    href={`/report/${it.reportId}`}
                    className="inline-block rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-[12.5px] font-bold text-ink-soft hover:bg-page"
                  >
                    查看报告
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  )
}
