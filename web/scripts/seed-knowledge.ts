/**
 * 灌库脚本：把 data/knowledge-base.json 的 105 条审核规则向量化后写入 Supabase。
 * 策略：一条规则 = 一个 chunk（规则文本很短，无需再切碎）。
 *
 * 运行：npx tsx --env-file=.env.local scripts/seed-knowledge.ts
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { supabaseAdmin } from '../lib/supabase'
import { embedTexts } from '../lib/embedding'

const SOURCE_NAME = '租房合同审核规则知识库'

interface Rule {
  index: number
  item: string
  point: string
  risk_level: string
}

function buildEmbeddingText(r: Rule): string {
  // 审核项 + 审核要点 一起向量化，语义更完整
  return `审核项：${r.item}。审核要点：${r.point}`
}

async function main() {
  const jsonPath = join(process.cwd(), 'data', 'knowledge-base.json')
  const { rules } = JSON.parse(readFileSync(jsonPath, 'utf-8')) as { rules: Rule[] }
  console.log(`读取到 ${rules.length} 条规则，开始向量化…`)

  const texts = rules.map(buildEmbeddingText)
  const vectors = await embedTexts(texts)
  console.log(`向量化完成：${vectors.length} 条，维度 ${vectors[0]?.length}`)

  const rows = rules.map((r, i) => ({
    ref_key: `rule-${r.index}`,
    title: r.item,
    risk_level: r.risk_level,
    content: texts[i],
    embedding: vectors[i],
    source: SOURCE_NAME,
    chunk_index: r.index,
    metadata: { item: r.item, point: r.point, risk_level: r.risk_level },
  }))

  // 分批 upsert，按 ref_key 去重覆盖
  const CHUNK = 50
  let done = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK)
    const { error } = await supabaseAdmin
      .from('knowledge_chunks')
      .upsert(batch, { onConflict: 'ref_key' })
    if (error) throw new Error(`写入失败: ${error.message}`)
    done += batch.length
    console.log(`  已写入 ${done}/${rows.length}`)
  }

  const { count } = await supabaseAdmin
    .from('knowledge_chunks')
    .select('*', { count: 'exact', head: true })
  console.log(`✅ 灌库完成，knowledge_chunks 当前共 ${count} 条`)
}

main().catch((e) => {
  console.error('❌ 灌库失败:', e)
  process.exit(1)
})
