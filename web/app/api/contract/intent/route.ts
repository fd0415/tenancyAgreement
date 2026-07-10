import { NextResponse } from 'next/server'
import { chatJSON, DEEPSEEK_MODELS } from '@/lib/deepseek'
import { INTENT_SYSTEM_PROMPT, buildIntentUserPrompt } from '@/lib/prompts'
import type { IntentResult } from '@/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: { prompt?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }

  const prompt = body.prompt?.trim()
  if (!prompt) {
    // 无文字输入时，默认视为合同审核意图（用户仅上传文件）
    return NextResponse.json({
      intent: 'contract_review',
      focus_areas: [],
      reason: '用户未输入文字，默认按合同审核处理',
    } satisfies IntentResult)
  }

  try {
    const result = await chatJSON<IntentResult>({
      model: DEEPSEEK_MODELS.flash,
      system: INTENT_SYSTEM_PROMPT,
      user: buildIntentUserPrompt(prompt),
    })

    // 兜底校正
    const intent =
      result.intent === 'out_of_scope' ? 'out_of_scope' : 'contract_review'
    return NextResponse.json({
      intent,
      focus_areas: Array.isArray(result.focus_areas) ? result.focus_areas : [],
      reason: result.reason ?? '',
    } satisfies IntentResult)
  } catch (e) {
    console.error('[intent] error:', e)
    // 模型异常时不阻断用户，放行为合同审核
    return NextResponse.json({
      intent: 'contract_review',
      focus_areas: [],
      reason: '意图识别服务异常，默认放行',
    } satisfies IntentResult)
  }
}
