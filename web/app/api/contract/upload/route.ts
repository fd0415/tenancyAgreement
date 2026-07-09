import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth'
import { extractText, splitClauses, detectFileType } from '@/lib/contract-parser'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_SIZE = 20 * 1024 * 1024 // 20MB
const BUCKET = 'contracts'

export async function POST(request: Request) {
  // 1. 鉴权
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  // 2. 读取表单
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }

  const file = form.get('file')
  const userPrompt = (form.get('prompt') as string | null)?.trim() ?? null

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '请上传合同文件' }, { status: 400 })
  }

  // 3. 校验类型 & 大小
  const fileType = detectFileType(file.name, file.type)
  if (!fileType) {
    return NextResponse.json(
      { error: '仅支持 PDF、DOCX 和 TXT 格式的合同文件' },
      { status: 400 }
    )
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '文件过大，请控制在 20MB 以内' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // 4. 解析文本
  let rawText: string
  try {
    rawText = await extractText(buffer, fileType)
  } catch (e) {
    console.error('[upload] parse error:', e)
    return NextResponse.json(
      { error: '合同解析失败，请确认文件内容是否可读（非加密/非扫描件）' },
      { status: 422 }
    )
  }

  if (!rawText || rawText.length < 30) {
    return NextResponse.json(
      { error: '未能从文件中提取到有效文字，可能是扫描件或空文档' },
      { status: 422 }
    )
  }

  const clauses = splitClauses(rawText)

  // 5. 上传原文件到 Storage
  const storagePath = `${user.userId}/${Date.now()}-${crypto.randomUUID()}.${fileType}`
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('[upload] storage error:', uploadError)
    return NextResponse.json({ error: '文件存储失败，请稍后再试' }, { status: 500 })
  }

  // 6. 写入 contracts 表
  const { data: contract, error: dbError } = await supabaseAdmin
    .from('contracts')
    .insert({
      user_id: user.userId,
      file_name: file.name,
      file_url: storagePath,
      file_type: fileType,
      raw_text: rawText,
      clauses,
      contract_type: 'unknown',
      user_prompt: userPrompt,
    })
    .select('id, file_name, file_type, clauses')
    .single()

  if (dbError) {
    console.error('[upload] db error:', dbError)
    return NextResponse.json({ error: '保存合同信息失败' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    contract: {
      id: contract.id,
      file_name: contract.file_name,
      file_type: contract.file_type,
      clause_count: Array.isArray(contract.clauses) ? contract.clauses.length : 0,
    },
  })
}
