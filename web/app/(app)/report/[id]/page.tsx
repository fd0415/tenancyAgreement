import { getAuthUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BrandMark } from '@/components/common/BrandMark'
import { scoreTier } from '@/lib/scoring'
import { loadReport } from '@/lib/report'
import { clauseLabel } from '@/lib/format'

const TIER_COLOR = { good: 'var(--low)', mid: 'var(--mid)', bad: 'var(--high)' } as const
const SEV = {
  high: { label: '高风险', bg: 'var(--high-bg)', color: 'var(--high)' },
  mid: { label: '中风险', bg: 'var(--mid-bg)', color: 'var(--mid)' },
  low: { label: '低风险', bg: 'var(--low-bg)', color: 'var(--low)' },
  none: { label: '无风险', bg: 'var(--page)', color: 'var(--muted)' },
} as const

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) notFound()

  const loaded = await loadReport(id, user.userId)
  if (!loaded) notFound()

  const { report, fileName, risks, clauseMap } = loaded
  const score = report.health_score ?? 0
  const tier = scoreTier(score)
  const total = report.high_count + report.mid_count + report.low_count

  return (
    <div className="min-h-screen">
      {/* 顶栏 */}
      <header className="flex items-center gap-3 border-b border-line bg-surface px-6 py-3">
        <BrandMark size="sm" />
        <span className="text-[15px] font-black text-ink">租房合同审核</span>
        <nav className="ml-6 flex gap-5 text-[13.5px] font-bold text-ink-soft">
          <Link href="/home" className="hover:text-ink">首页</Link>
          <Link href="/history" className="hover:text-ink">历史记录</Link>
        </nav>
      </header>

      <div className="mx-auto max-w-4xl px-8 py-9">
        {report.status === 'failed' ? (
          <div className="rounded-xl border border-line bg-surface p-8 text-center">
            <h2 className="text-lg font-black text-high">审核失败</h2>
            <p className="mt-2 text-[13.5px] text-ink-soft">这份合同审核中断了，请返回首页重新上传审核。</p>
            <Link
              href="/home"
              className="mt-5 inline-block rounded-lg bg-black-btn px-5 py-2.5 text-sm font-bold text-white"
            >
              返回首页
            </Link>
          </div>
        ) : (
          <>
            {/* 顶部：健康度 + 概述 */}
            <div className="mb-7 flex items-center gap-7">
              <div
                className="flex h-24 w-24 flex-shrink-0 flex-col items-center justify-center rounded-full bg-surface"
                style={{ border: `7px solid ${TIER_COLOR[tier]}` }}
              >
                <span className="text-[32px] font-black leading-none" style={{ color: TIER_COLOR[tier] }}>
                  {score}
                </span>
                <span className="mt-1 text-[10.5px] text-muted">健康度</span>
              </div>
              <div>
                <h1 className="text-[21px] font-black text-ink">{fileName} · 体检报告</h1>
                <p className="mt-1.5 max-w-[640px] text-[13.5px] leading-relaxed text-ink-soft">
                  共发现{' '}
                  <strong style={{ color: 'var(--high)' }}>{report.high_count} 条高风险</strong>、
                  <strong style={{ color: 'var(--mid)' }}>{report.mid_count} 条中风险</strong>、
                  <strong style={{ color: 'var(--low)' }}>{report.low_count} 条低风险</strong>。
                  {total > 0
                    ? '建议签约前逐条要求修改，并保留沟通记录。'
                    : '未发现明显风险，仍建议签约前通读全文。'}
                </p>
              </div>
            </div>

            {/* 三色统计卡 */}
            <div className="mb-7 grid grid-cols-3 gap-3.5">
              <div className="rounded-xl border border-line p-[18px] text-center" style={{ background: 'var(--high-bg)' }}>
                <div className="text-[28px] font-black text-high">{report.high_count}</div>
                <div className="mt-1 text-[11.5px] leading-snug text-ink-soft">高风险条款<br />可能造成明显经济损失</div>
              </div>
              <div className="rounded-xl border border-line p-[18px] text-center" style={{ background: 'var(--mid-bg)' }}>
                <div className="text-[28px] font-black text-mid">{report.mid_count}</div>
                <div className="mt-1 text-[11.5px] leading-snug text-ink-soft">中风险条款<br />权利义务不够对等</div>
              </div>
              <div className="rounded-xl border border-line p-[18px] text-center" style={{ background: 'var(--low-bg)' }}>
                <div className="text-[28px] font-black text-low">{report.low_count}</div>
                <div className="mt-1 text-[11.5px] leading-snug text-ink-soft">低风险条款<br />建议签前协商优化</div>
              </div>
            </div>

            {/* 风险列表（点击进入详情页） */}
            {risks.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {risks.map((r, i) => {
                  const sev = SEV[r.severity]
                  const loc = clauseLabel(clauseMap[r.clause_id]) || `第 ${i + 1} 条`
                  return (
                    <Link
                      key={r.id}
                      href={`/report/${report.id}/risk/${r.id}`}
                      className="flex items-center gap-3.5 rounded-xl border border-line bg-surface px-[18px] py-[15px] transition-colors hover:border-line-strong hover:bg-page"
                    >
                      <span className="w-5 text-[11px] font-extrabold text-muted">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-extrabold text-ink">
                          {r.title || '风险条款'}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-muted">{loc}</span>
                      </span>
                      <span
                        className="inline-flex min-h-[24px] items-center rounded-full px-2.5 text-[11.5px] font-extrabold"
                        style={{ background: sev.bg, color: sev.color }}
                      >
                        {sev.label}
                      </span>
                      <span className="text-muted">›</span>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-surface p-8 text-center text-[13.5px] text-ink-soft">
                这份合同没有检出明显风险条款，是一份相对规范的合同。
              </div>
            )}

            <div className="mt-8">
              <Link href="/home" className="text-[13px] font-bold text-muted hover:text-ink">
                ← 再审一份合同
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
