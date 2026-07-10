'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandMark } from '@/components/common/BrandMark'
import type { Clause, ScanEvent, RiskItem } from '@/types'

type Severity = 'high' | 'mid' | 'low'
type ClauseStatus = 'pending' | 'scanning' | 'safe' | Severity
type RiskData = Omit<RiskItem, 'id' | 'report_id' | 'created_at'>
type Phase = 'intro' | 'scanning' | 'done' | 'error'

type TraceItem =
  | { kind: 'line'; text: string }
  | { kind: 'card'; risk: RiskData }

type ClauseResult = { kind: 'safe' } | { kind: 'risk'; risk: RiskData }

const SEV_LABEL: Record<Severity, string> = { high: '高风险', mid: '中风险', low: '低风险' }

// 每一段「变黑正在识别」的最短停留时间：太短会一闪而过，太长会拖沓
const MIN_READ_MS = 820

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function ScanClient({
  contractId,
  fileName,
  clauses,
}: {
  contractId: string
  fileName: string
  clauses: Clause[]
}) {
  const router = useRouter()
  const [statusMap, setStatusMap] = useState<Record<string, ClauseStatus>>({})
  const [trace, setTrace] = useState<TraceItem[]>([])
  const [doneCount, setDoneCount] = useState(0)
  const [phase, setPhase] = useState<Phase>('intro')
  const [statusText, setStatusText] = useState('AI 正在通读合同全文…')

  // 后端并发分析的结果先落到 ref，前端再按顺序逐段揭示（两者解耦）
  const resultsRef = useRef<Record<string, ClauseResult>>({})
  const doneRef = useRef<{ report_id: string } | null>(null)
  const errorRef = useRef<string | null>(null)

  const clauseRefs = useRef<Record<string, HTMLSpanElement | null>>({})
  const traceRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    traceRef.current?.scrollTo({ top: traceRef.current.scrollHeight, behavior: 'smooth' })
  }, [trace])

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    // ── 后端 SSE：只负责把结果塞进 ref，不直接驱动动画 ──
    async function consume() {
      try {
        const res = await fetch('/api/contract/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractId }),
        })
        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({}))
          errorRef.current = err.error ?? '审核启动失败'
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const blocks = buffer.split('\n\n')
          buffer = blocks.pop() ?? ''
          for (const block of blocks) {
            const line = block.trim()
            if (!line.startsWith('data:')) continue
            const json = line.slice(5).trim()
            if (!json) continue
            const ev = JSON.parse(json) as ScanEvent
            if (ev.type === 'safe') {
              resultsRef.current[ev.clause_id] = { kind: 'safe' }
            } else if (ev.type === 'risk') {
              resultsRef.current[ev.risk.clause_id] = { kind: 'risk', risk: ev.risk }
            } else if (ev.type === 'done') {
              doneRef.current = { report_id: ev.report_id }
            } else if (ev.type === 'error') {
              errorRef.current = ev.message
            }
          }
        }
      } catch {
        errorRef.current = '网络中断，请重试'
      }
    }

    // ── 前端动画：光束循环扫描（等首批结果）→ 逐段揭示 ──
    async function animate() {
      const total = clauses.length

      // 阶段一：光束一直循环扫描，同时等第一条结果就绪（不做人为固定延时，数据一好就开始）
      const firstId = clauses[0]?.id
      while (firstId && !resultsRef.current[firstId] && !doneRef.current) {
        if (errorRef.current) {
          setPhase('error')
          setStatusText(errorRef.current)
          return
        }
        await sleep(40)
      }
      if (errorRef.current) {
        setPhase('error')
        setStatusText(errorRef.current)
        return
      }
      setPhase('scanning')
      setStatusText('Agent 正在逐条审核合同…')

      // 阶段二：一段一段揭示，与后端完成顺序无关
      for (let i = 0; i < total; i++) {
        const c = clauses[i]

        // 先让当前段变黑（正在识别）——等结果期间它保持黑色，画面不空转
        setStatusMap((m) => ({ ...m, [c.id]: 'scanning' }))
        clauseRefs.current[c.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        const preview = c.text.replace(/\s+/g, ' ').slice(0, 18)
        setTrace((t) => [...t, { kind: 'line', text: `正在审核第 ${i + 1} 条 · ${preview}…` }])

        // 一边保持黑色一边等结果，同时保证最短「识别」停留时间
        const start = Date.now()
        while (!resultsRef.current[c.id]) {
          if (errorRef.current) {
            setPhase('error')
            setStatusText(errorRef.current)
            return
          }
          await sleep(40)
        }
        const elapsed = Date.now() - start
        if (elapsed < MIN_READ_MS) await sleep(MIN_READ_MS - elapsed)

        // 落定这一段的最终状态
        const r = resultsRef.current[c.id]
        if (r.kind === 'risk') {
          setStatusMap((m) => ({ ...m, [c.id]: r.risk.severity as Severity }))
          setTrace((t) => [...t, { kind: 'card', risk: r.risk }])
        } else {
          setStatusMap((m) => ({ ...m, [c.id]: 'safe' }))
        }
        setDoneCount(i + 1)
      }

      // 等后端把报告写完
      while (!doneRef.current) {
        if (errorRef.current) {
          setPhase('error')
          setStatusText(errorRef.current)
          return
        }
        await sleep(40)
      }

      setPhase('done')
      setStatusText('审核完成 ✓')
      setTrace((t) => [...t, { kind: 'line', text: '已完成全部条款审核，正在生成体检报告…' }])
      const reportId = doneRef.current.report_id
      setTimeout(() => router.push(`/report/${reportId}`), 1200)
    }

    consume()
    animate()
  }, [contractId, router, clauses])

  function clauseClass(id: string): string {
    const s = statusMap[id]
    if (s === 'scanning') return 'clause clause-scanning'
    if (s === 'high') return 'clause clause-high'
    if (s === 'mid') return 'clause clause-mid'
    if (s === 'low') return 'clause clause-low'
    return 'clause'
  }

  const total = clauses.length

  return (
    <div className="flex h-screen flex-col">
      {/* 顶栏 */}
      <header className="flex items-center gap-3 border-b border-line bg-surface px-6 py-3">
        <BrandMark size="sm" />
        <span className="text-[15px] font-black text-ink">租房合同审核</span>
        <span className="ml-auto text-[12.5px] text-muted">{fileName}</span>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_360px]">
        {/* 左：合同原文 + 开场扫描光束 */}
        <section className="flex min-h-0 flex-col border-r border-line">
          <div className="flex items-center gap-2 border-b border-line px-6 py-3 text-[12px] text-muted">
            <span>合同原文</span>
            {phase === 'scanning' && (
              <span className="ml-auto font-bold text-ink-soft">
                已完成 {doneCount} / {total} 条
              </span>
            )}
            {phase === 'done' && <span className="ml-auto font-bold text-low">审核完成</span>}
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            {phase === 'intro' && <div className="scan-beam" />}
            <div className="h-full overflow-y-auto px-10 py-7">
              <div className="whitespace-pre-line text-[14px] leading-[2] text-ink-soft">
                {clauses.map((c) => (
                  <span key={c.id} className="block py-1">
                    <span
                      ref={(el) => {
                        clauseRefs.current[c.id] = el
                      }}
                      className={clauseClass(c.id)}
                    >
                      {c.text}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 右：Agent 审核轨迹 */}
        <aside className="flex min-h-0 flex-col gap-3 bg-page p-5">
          <div className="flex items-center gap-2 text-[12.5px] font-bold text-ink-soft">
            {(phase === 'intro' || phase === 'scanning') && <span className="scan-dot" />}
            <span>{statusText}</span>
          </div>

          <div
            ref={traceRef}
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-line bg-surface p-4"
          >
            {trace.map((item, i) =>
              item.kind === 'line' ? (
                <div key={i} className="trace-enter flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-soft">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple" />
                  <span>{item.text}</span>
                </div>
              ) : (
                <div key={i} className="trace-enter ml-3.5 rounded-[10px] border border-line bg-page p-3">
                  <span
                    className={`mb-1.5 inline-flex min-h-[22px] items-center rounded-full px-2.5 text-[11px] font-extrabold ${
                      item.risk.severity === 'high'
                        ? 'bg-[var(--high-bg)] text-high'
                        : item.risk.severity === 'mid'
                          ? 'bg-[var(--mid-bg)] text-mid'
                          : 'bg-[var(--low-bg)] text-low'
                    }`}
                  >
                    {SEV_LABEL[item.risk.severity as Severity]}
                  </span>
                  <h4 className="text-[13.5px] font-extrabold text-ink">{item.risk.title}</h4>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{item.risk.description}</p>
                  {item.risk.suggestion && (
                    <div
                      className="mt-2 rounded-[0_8px_8px_0] border-l-[3px] border-purple px-2.5 py-2 text-[11.5px] leading-relaxed"
                      style={{ background: 'rgba(167,139,250,.10)', color: '#5c5470' }}
                    >
                      <b className="mb-0.5 block text-[10.5px]" style={{ color: '#7c5cd6' }}>
                        修改建议
                      </b>
                      {item.risk.suggestion}
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {phase === 'error' && (
            <button
              onClick={() => router.push('/home')}
              className="min-h-[42px] rounded-lg bg-black-btn text-sm font-bold text-white"
            >
              返回首页重试
            </button>
          )}
        </aside>
      </div>
    </div>
  )
}
