import { supabaseAdmin } from '@/lib/supabase'

export interface HistoryItem {
  reportId: string
  contractId: string
  fileName: string
  score: number
  high: number
  mid: number
  low: number
  status: 'scanning' | 'done' | 'failed'
  createdAt: string
}

export interface UserStats {
  reportCount: number
  riskCount: number
  usageDays: number
}

/** 该用户全部体检报告，按时间倒序，附带合同名。 */
export async function loadUserReports(userId: string): Promise<HistoryItem[]> {
  const { data: reports } = await supabaseAdmin
    .from('scan_reports')
    .select('id, contract_id, health_score, high_count, mid_count, low_count, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const rows = reports ?? []
  const contractIds = [...new Set(rows.map((r) => r.contract_id as string))]

  const nameMap: Record<string, string> = {}
  if (contractIds.length) {
    const { data: cs } = await supabaseAdmin
      .from('contracts')
      .select('id, file_name')
      .in('id', contractIds)
    for (const c of cs ?? []) nameMap[c.id as string] = c.file_name as string
  }

  return rows.map((r) => ({
    reportId: r.id as string,
    contractId: r.contract_id as string,
    fileName: nameMap[r.contract_id as string] ?? '合同',
    score: (r.health_score as number | null) ?? 0,
    high: (r.high_count as number) ?? 0,
    mid: (r.mid_count as number) ?? 0,
    low: (r.low_count as number) ?? 0,
    status: (r.status as HistoryItem['status']) ?? 'done',
    createdAt: r.created_at as string,
  }))
}

/** 个人中心统计：累计体检合同 / 累计发现风险 / 使用天数。 */
export async function loadUserStats(userId: string): Promise<UserStats> {
  const reports = await loadUserReports(userId)
  const riskCount = reports.reduce((s, r) => s + r.high + r.mid + r.low, 0)

  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('created_at')
    .eq('id', userId)
    .maybeSingle()

  const since = userRow?.created_at
    ? new Date(userRow.created_at as string)
    : reports.length
      ? new Date(reports[reports.length - 1].createdAt)
      : new Date()
  const usageDays = Math.max(
    1,
    Math.floor((Date.now() - since.getTime()) / 86_400_000) + 1
  )

  return { reportCount: reports.length, riskCount, usageDays }
}
