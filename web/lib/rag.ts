/**
 * RAG 检索模块
 * 输入合同条款文本 → 向量化 → 在 knowledge_chunks 里检索最相关的审核规则。
 */
import { supabaseAdmin } from './supabase'
import { embedText } from './embedding'

export interface RetrievedRule {
  id: string
  content: string
  title: string | null
  risk_level: string | null
  source: string | null
  metadata: Record<string, unknown> | null
  similarity: number
}

/**
 * 检索与查询文本最相关的审核规则。
 * @param query 合同条款 / 用户问题文本
 * @param topK 返回条数
 * @param minSimilarity 相似度下限（0~1），低于此值的丢弃
 */
export async function retrieveRules(
  query: string,
  topK = 5,
  minSimilarity = 0.3
): Promise<RetrievedRule[]> {
  const embedding = await embedText(query)

  const { data, error } = await supabaseAdmin.rpc('match_knowledge_chunks', {
    query_embedding: embedding,
    match_count: topK,
    min_similarity: minSimilarity,
  })

  if (error) throw new Error(`RAG 检索失败: ${error.message}`)
  return (data ?? []) as RetrievedRule[]
}
