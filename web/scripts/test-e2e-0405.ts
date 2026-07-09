/**
 * 04 + 05 端到端联测（真实 DeepSeek + 真实向量库）
 * 运行：npx tsx --env-file=.env.local scripts/test-e2e-0405.ts
 */
import { readFileSync } from 'node:fs'
import { chatJSON, DEEPSEEK_MODELS } from '../lib/deepseek'
import {
  INTENT_SYSTEM_PROMPT,
  buildIntentUserPrompt,
  VALIDATE_SYSTEM_PROMPT,
  buildValidateUserPrompt,
} from '../lib/prompts'
import { splitClauses } from '../lib/contract-parser'
import { retrieveRules } from '../lib/rag'

const RENTAL = '/Users/fengdi/Desktop/测试租房合同1_二房东转租及押金问题.txt'
const LABOR = '/Users/fengdi/Desktop/测试非目标合同1_劳动合同.txt'

const line = (s = '') => console.log(s)
const hr = (t: string) => line(`\n${'═'.repeat(60)}\n${t}\n${'═'.repeat(60)}`)

async function intent(input: string) {
  return chatJSON<{ intent: string; focus_areas: string[]; reason: string }>({
    model: DEEPSEEK_MODELS.flash,
    system: INTENT_SYSTEM_PROMPT,
    user: buildIntentUserPrompt(input),
  })
}
async function validate(text: string) {
  return chatJSON<{ is_rental: boolean; confidence: string; reason: string }>({
    model: DEEPSEEK_MODELS.flash,
    system: VALIDATE_SYSTEM_PROMPT,
    user: buildValidateUserPrompt(text),
  })
}

async function main() {
  const rentalText = readFileSync(RENTAL, 'utf-8')
  const laborText = readFileSync(LABOR, 'utf-8')

  // ── 第一道门：意图识别（针对输入框文字）──
  hr('① 意图识别（DeepSeek V4 Flash）')
  for (const q of [
    '帮我看看这份租房合同押金退不退',
    '帮我看看这份劳动合同的试用期合不合理',
  ]) {
    const r = await intent(q)
    const pass = r.intent === 'contract_review'
    line(`  输入：${q}`)
    line(`    → ${r.intent} ${pass ? '✅放行' : '⛔拦截'} | focus=[${r.focus_areas.join('、')}] | ${r.reason}`)
  }

  // ── 第二道门：合同类型验证（针对上传文档）──
  hr('② 合同类型验证（DeepSeek V4 Flash）')
  const vRental = await validate(rentalText)
  line(`  租房合同 → is_rental=${vRental.is_rental} (${vRental.confidence}) ${vRental.is_rental ? '✅放行' : '⛔拦截'}`)
  line(`    理由：${vRental.reason}`)
  const vLabor = await validate(laborText)
  line(`  劳动合同 → is_rental=${vLabor.is_rental} (${vLabor.confidence}) ${!vLabor.is_rental ? '✅正确拦截' : '❌漏放'}`)
  line(`    理由：${vLabor.reason}`)

  // ── 切条 + RAG 召回（仅对放行的租房合同）──
  hr('③ 租房合同切条 + ④ 逐条 RAG 召回')
  const clauses = splitClauses(rentalText)
  line(`  切出 ${clauses.length} 个片段：`)
  for (const c of clauses) {
    const preview = c.text.replace(/\s+/g, ' ').slice(0, 30)
    const rules = await retrieveRules(c.text, 3, 0.3)
    line(`\n  【${c.id}】${preview}…`)
    if (rules.length === 0) {
      line('     （无命中规则，相似度均低于阈值）')
    } else {
      rules.forEach((r) =>
        line(`     ↳ [${r.risk_level}] ${r.title}  (${r.similarity.toFixed(3)})`)
      )
    }
  }

  line('\n✅ 端到端联测完成')
}

main().catch((e) => {
  console.error('❌ 测试失败:', e)
  process.exit(1)
})
