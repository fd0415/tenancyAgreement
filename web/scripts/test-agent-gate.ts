/**
 * 04 模块自测：意图识别 + 合同类型验证
 * 运行：npx tsx scripts/test-agent-gate.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { chatJSON, DEEPSEEK_MODELS } from '../lib/deepseek'
import {
  INTENT_SYSTEM_PROMPT,
  buildIntentUserPrompt,
  VALIDATE_SYSTEM_PROMPT,
  buildValidateUserPrompt,
} from '../lib/prompts'

const RENTAL_SAMPLE = `房屋租赁合同
出租方（甲方）：张三
承租方（乙方）：李四
第一条 房屋坐落于北京市朝阳区某小区1号楼101室。
第二条 租赁期限自2026年1月1日起至2026年12月31日止。
第三条 月租金为人民币5000元，押金为一个月租金。
第四条 乙方逾期退租的，甲方有权扣除押金。`

const LABOR_SAMPLE = `劳动合同
用人单位（甲方）：某科技有限公司
劳动者（乙方）：王五
第一条 工作岗位为软件工程师。
第二条 月工资为人民币20000元。
第三条 乙方须遵守公司竞业限制协议。`

async function testIntent(label: string, input: string) {
  const r = await chatJSON<{ intent: string; focus_areas: string[]; reason: string }>({
    model: DEEPSEEK_MODELS.flash,
    system: INTENT_SYSTEM_PROMPT,
    user: buildIntentUserPrompt(input),
  })
  console.log(`\n[意图] ${label}\n  输入: ${input}\n  →`, JSON.stringify(r))
}

async function testValidate(label: string, text: string) {
  const r = await chatJSON<{ is_rental: boolean; confidence: string; reason: string }>({
    model: DEEPSEEK_MODELS.flash,
    system: VALIDATE_SYSTEM_PROMPT,
    user: buildValidateUserPrompt(text),
  })
  console.log(`\n[类型] ${label}\n  →`, JSON.stringify(r))
}

async function main() {
  console.log('=== 意图识别 ===')
  await testIntent('租房相关(应放行)', '帮我看看这份租房合同的押金和退租条款')
  await testIntent('劳动合同(应拦截)', '帮我看看这份劳动合同的竞业协议合不合理')
  await testIntent('闲聊(应拦截)', '今天天气怎么样')

  console.log('\n=== 合同类型验证 ===')
  await testValidate('租房合同(应 is_rental=true)', RENTAL_SAMPLE)
  await testValidate('劳动合同(应 is_rental=false)', LABOR_SAMPLE)

  console.log('\n✅ 自测完成')
}

main().catch((e) => {
  console.error('❌ 测试失败:', e)
  process.exit(1)
})
