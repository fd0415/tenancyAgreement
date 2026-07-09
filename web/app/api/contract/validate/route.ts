import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { chatJSON, DEEPSEEK_MODELS } from '@/lib/deepseek'
import { VALIDATE_SYSTEM_PROMPT, buildValidateUserPrompt } from '@/lib/prompts'
import type { ValidateResult } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  let body: { contractId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }

  const contractId = body.contractId
  if (!contractId) {
    return NextResponse.json({ error: '缺少合同 ID' }, { status: 400 })
  }

  // 读取合同文本（校验归属）
  const { data: contract, error } = await supabaseAdmin
    .from('contracts')
    .select('id, user_id, raw_text')
    .eq('id', contractId)
    .maybeSingle()

  if (error || !contract || contract.user_id !== user.userId) {
    return NextResponse.json({ error: '合同不存在' }, { status: 404 })
  }

  try {
    const result = await chatJSON<ValidateResult>({
      model: DEEPSEEK_MODELS.flash,
      system: VALIDATE_SYSTEM_PROMPT,
      user: buildValidateUserPrompt(contract.raw_text ?? ''),
    })

    const isRental = result.is_rental === true

    // 回写合同类型
    await supabaseAdmin
      .from('contracts')
      .update({ contract_type: isRental ? 'rental' : 'unknown' })
      .eq('id', contractId)

    return NextResponse.json({
      is_rental: isRental,
      confidence: result.confidence ?? 'medium',
      reason: result.reason ?? '',
    } satisfies ValidateResult)
  } catch (e) {
    console.error('[validate] error:', e)
    return NextResponse.json(
      { error: '合同类型验证失败，请稍后再试' },
      { status: 502 }
    )
  }
}
