/**
 * 合同健康度评分
 * 满分 100，按风险数量与严重程度扣分（下限 0）。
 */
// 评分规则：满分 100，高风险每条 -3，中风险每条 -1，低风险不扣分
const WEIGHT = { high: 3, mid: 1, low: 0 } as const

export function computeHealthScore(counts: {
  high: number
  mid: number
  low: number
}): number {
  const deduction =
    counts.high * WEIGHT.high + counts.mid * WEIGHT.mid + counts.low * WEIGHT.low
  return Math.max(0, Math.min(100, 100 - deduction))
}

/** 健康度对应的等级颜色档（供前端环形/药丸配色） */
export function scoreTier(score: number): 'good' | 'mid' | 'bad' {
  if (score >= 80) return 'good'
  if (score >= 60) return 'mid'
  return 'bad'
}
