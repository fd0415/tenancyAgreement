/**
 * 单条条款风险分析
 * 流程：RAG 检索相关规则 → DeepSeek V4 Pro 结合规则判断风险。
 */
import { chatJSON, DEEPSEEK_MODELS } from './deepseek'
import { ANALYZE_SYSTEM_PROMPT, buildAnalyzeUserPrompt } from './prompts'
import { retrieveRules } from './rag'

export type Severity = 'high' | 'mid' | 'low' | 'none'

export interface ClauseAnalysis {
  has_risk: boolean
  severity: Severity
  title: string
  description: string
  suggestion: string
  suggested_text: string
}

const VALID_SEVERITY: Severity[] = ['high', 'mid', 'low', 'none']

/**
 * 分析单个条款。
 * @param clauseText 条款文本
 * @param focusAreas 用户关注点
 */
export async function analyzeClause(
  clauseText: string,
  focusAreas?: string[]
): Promise<ClauseAnalysis> {
  // 1. RAG 检索相关规则（带上要点，供模型参考）
  const rules = await retrieveRules(clauseText, 4, 0.3)
  const ruleInputs = rules.map((r) => ({
    title: r.title,
    risk_level: r.risk_level,
    point: (r.metadata as { point?: string } | null)?.point,
  }))

  // 2. 交给 V4 Pro 判断（失败重试一次；仍失败则按无风险跳过，避免中断整份报告）
  let raw: Partial<ClauseAnalysis> = {}
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      raw = await chatJSON<Partial<ClauseAnalysis>>({
        model: DEEPSEEK_MODELS.flash,
        system: ANALYZE_SYSTEM_PROMPT,
        user: buildAnalyzeUserPrompt({ clauseText, rules: ruleInputs, focusAreas }),
      })
      break
    } catch (e) {
      if (attempt === 1) {
        console.error('[analyzeClause] 分析失败，按无风险跳过：', e)
        return {
          has_risk: false,
          severity: 'none',
          title: '',
          description: '',
          suggestion: '',
          suggested_text: '',
        }
      }
    }
  }

  // 3. 兜底校正
  let severity: Severity =
    raw.severity && VALID_SEVERITY.includes(raw.severity) ? raw.severity : 'none'
  const hasRisk = raw.has_risk === true && severity !== 'none'
  if (!hasRisk) severity = 'none'

  return {
    has_risk: hasRisk,
    severity,
    title: hasRisk ? raw.title?.trim() || '存在风险' : '',
    description: hasRisk ? raw.description?.trim() || '' : '',
    suggestion: hasRisk ? raw.suggestion?.trim() || '' : '',
    suggested_text: hasRisk ? raw.suggested_text?.trim() || '' : '',
  }
}
