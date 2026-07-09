/**
 * Embedding 封装 · SiliconFlow BGE
 * 模型：BAAI/bge-large-zh-v1.5（中文优化，输出 1024 维）
 * 职责：文字 → 向量。切块由调用方决定，本模块只做向量化。
 */

const SILICONFLOW_URL = 'https://api.siliconflow.cn/v1/embeddings'
export const EMBEDDING_MODEL = 'BAAI/bge-large-zh-v1.5'
export const EMBEDDING_DIM = 1024

// SiliconFlow 单次请求的输入条数上限（保守取值，避免超限）
const BATCH_SIZE = 32

interface EmbeddingResponse {
  data: { embedding: number[]; index: number }[]
}

async function callSiliconFlow(inputs: string[]): Promise<number[][]> {
  const apiKey = process.env.SILICONFLOW_API_KEY
  if (!apiKey) throw new Error('缺少 SILICONFLOW_API_KEY 环境变量')

  const res = await fetch(SILICONFLOW_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: inputs }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`SiliconFlow embedding 失败 (${res.status}): ${text.slice(0, 200)}`)
  }

  const json = (await res.json()) as EmbeddingResponse
  // 按 index 排序，保证与输入顺序一致
  return json.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding)
}

/** 单条文本 → 向量 */
export async function embedText(text: string): Promise<number[]> {
  const [vec] = await callSiliconFlow([text])
  return vec
}

/** 批量文本 → 向量（自动分批，保持顺序） */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const out: number[][] = []
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const vecs = await callSiliconFlow(batch)
    out.push(...vecs)
  }
  return out
}
