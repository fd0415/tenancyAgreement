import { notFound } from 'next/navigation'
import Link from 'next/link'
import { loadReport } from '@/lib/report'
import { clauseLabel } from '@/lib/format'
import CopyButton from './CopyButton'

const SEV = {
  high: { label: '高风险', bg: 'var(--high-bg)', color: 'var(--high)' },
  mid: { label: '中风险', bg: 'var(--mid-bg)', color: 'var(--mid)' },
  low: { label: '低风险', bg: 'var(--low-bg)', color: 'var(--low)' },
  none: { label: '无风险', bg: 'var(--page)', color: 'var(--muted)' },
} as const

export default async function RiskDetailPage({
  params,
}: {
  params: Promise<{ id: string; riskId: string }>
}) {
  const { id, riskId } = await params

  const loaded = await loadReport(id)
  if (!loaded) notFound()

  const { report, risks, clauseMap } = loaded
  const idx = risks.findIndex((r) => r.id === riskId)
  if (idx === -1) notFound()

  const risk = risks[idx]
  const prev = risks[idx - 1]
  const next = risks[idx + 1]
  const sev = SEV[risk.severity]
  const loc = clauseLabel(clauseMap[risk.clause_id])
  const copyText = risk.suggested_text || risk.suggestion || ''

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-3xl items-start gap-4 px-8 py-8">
        {/* 返回按钮 */}
        <Link
          href={`/report/${report.id}`}
          aria-label="返回体检报告"
          className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-soft hover:bg-page"
        >
          ←
        </Link>

        <div className="min-w-0 flex-1">
          {/* 面包屑 */}
          <div className="text-[12.5px] text-muted">
            <Link href={`/report/${report.id}`} className="hover:text-ink">
              体检报告
            </Link>
            {loc && <span> · {loc}</span>}
          </div>

          {/* 等级 + 标题 */}
          <span
            className="mt-3 inline-flex min-h-[24px] items-center rounded-full px-2.5 text-[11.5px] font-extrabold"
            style={{ background: sev.bg, color: sev.color }}
          >
            {sev.label}
          </span>
          <h1 className="mt-2 text-[26px] font-black leading-tight text-ink">
            {risk.title || '风险条款'}
          </h1>

          {/* 合同原文 */}
          {risk.original_text && (
            <div
              className="mt-5 rounded-[0_12px_12px_0] px-5 py-4 text-[14px] leading-relaxed text-ink-soft"
              style={{ background: 'var(--surface)', borderLeft: `4px solid ${sev.color}` }}
            >
              <span className="mb-1.5 block text-[11px] font-extrabold tracking-wide text-muted">
                合同原文
              </span>
              “{risk.original_text.trim()}”
            </div>
          )}

          {/* 条款位置 */}
          {loc && (
            <section className="mt-6">
              <h2 className="text-[11px] font-extrabold tracking-wide text-muted">条款位置</h2>
              <p className="mt-1.5 text-[14px] text-ink-soft">{loc}</p>
            </section>
          )}

          {/* 风险说明 */}
          {risk.description && (
            <section className="mt-6">
              <h2 className="text-[11px] font-extrabold tracking-wide text-muted">风险说明</h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{risk.description}</p>
            </section>
          )}

          {/* 建议修改：红/绿对比 */}
          {(risk.suggested_text || risk.suggestion) && (
            <section className="mt-6">
              <h2 className="text-[11px] font-extrabold tracking-wide text-muted">建议修改</h2>
              {risk.suggestion && (
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{risk.suggestion}</p>
              )}
              {risk.suggested_text && (
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-line p-4" style={{ background: 'var(--high-bg)' }}>
                    <div className="mb-2 text-[12px] font-extrabold text-high">原文条款</div>
                    <p className="text-[13px] leading-relaxed text-ink-soft">
                      {risk.original_text || '—'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-line p-4" style={{ background: 'var(--low-bg)' }}>
                    <div className="mb-2 text-[12px] font-extrabold text-low">建议修改为</div>
                    <p className="text-[13px] leading-relaxed text-ink-soft">{risk.suggested_text}</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 操作区 */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {copyText && <CopyButton text={copyText} />}

            {prev ? (
              <Link
                href={`/report/${report.id}/risk/${prev.id}`}
                className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-line-strong bg-surface px-4 text-[13.5px] font-bold text-ink-soft hover:bg-page"
              >
                上一条风险
              </Link>
            ) : (
              <span className="inline-flex min-h-[42px] cursor-not-allowed items-center justify-center rounded-lg border border-line bg-surface px-4 text-[13.5px] font-bold text-muted opacity-50">
                上一条风险
              </span>
            )}

            {next ? (
              <Link
                href={`/report/${report.id}/risk/${next.id}`}
                className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-line-strong bg-surface px-4 text-[13.5px] font-bold text-ink-soft hover:bg-page"
              >
                下一条风险
              </Link>
            ) : (
              <span className="inline-flex min-h-[42px] cursor-not-allowed items-center justify-center rounded-lg border border-line bg-surface px-4 text-[13.5px] font-bold text-muted opacity-50">
                下一条风险
              </span>
            )}

            <span className="ml-auto text-[12.5px] text-muted">
              第 {idx + 1} / {risks.length} 条
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
