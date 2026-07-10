import { supabaseAdmin } from '@/lib/supabase'
import type { Clause, RiskItem, ScanReport } from '@/types'

const SEV_RANK = { high: 0, mid: 1, low: 2, none: 3 } as const

export interface LoadedReport {
  report: ScanReport
  fileName: string
  /** 已按严重程度 + 顺序排好序的风险列表 */
  risks: RiskItem[]
  /** clause_id → 条款全文，用于提取「条款位置」小标题 */
  clauseMap: Record<string, string>
}

/**
 * 按报告 id 或合同 id 加载一份体检报告及其风险项。
 * 传入合同 id 时取该合同最新一份报告。
 */
export async function loadReport(
  idOrContractId: string
): Promise<LoadedReport | null> {
  let report: ScanReport | null = null

  const byId = await supabaseAdmin
    .from('scan_reports')
    .select('*')
    .eq('id', idOrContractId)
    .maybeSingle()
  report = (byId.data as ScanReport | null) ?? null

  if (!report) {
    const byContract = await supabaseAdmin
      .from('scan_reports')
      .select('*')
      .eq('contract_id', idOrContractId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    report = (byContract.data as ScanReport | null) ?? null
  }

  if (!report) return null

  const { data: contract } = await supabaseAdmin
    .from('contracts')
    .select('file_name, clauses')
    .eq('id', report.contract_id)
    .maybeSingle()

  const clauseMap: Record<string, string> = {}
  const clauses = (contract?.clauses as Clause[] | null) ?? []
  for (const c of clauses) clauseMap[c.id] = c.text

  const { data: riskRows } = await supabaseAdmin
    .from('risk_items')
    .select('*')
    .eq('report_id', report.id)

  const risks = ((riskRows as RiskItem[] | null) ?? []).sort((a, b) => {
    const r = SEV_RANK[a.severity] - SEV_RANK[b.severity]
    return r !== 0 ? r : a.sort_order - b.sort_order
  })

  return {
    report,
    fileName: (contract?.file_name as string | undefined) ?? '合同',
    risks,
    clauseMap,
  }
}
