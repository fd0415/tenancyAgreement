/**
 * 清空测试数据脚本：删除全部合同 / 体检报告 / 风险项，以及 Storage 里已上传的合同文件。
 * 保留：用户账号（users）、RAG 知识库（knowledge_chunks）。
 *
 * 运行方式：
 *   npx tsx --env-file=.env.local scripts/reset-data.ts            # 清空所有账号的数据
 *   npx tsx --env-file=.env.local scripts/reset-data.ts zf_admin   # 只清空某个账号
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const BUCKET = 'contracts'
const NIL = '00000000-0000-0000-0000-000000000000'

async function main() {
  const username = process.argv[2]

  // 若指定了账号，先取其 user_id
  let userId: string | null = null
  if (username) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle()
    if (error) throw error
    if (!data) {
      console.error(`❌ 未找到账号：${username}`)
      process.exit(1)
    }
    userId = data.id as string
    console.log(`\n🎯 目标账号：${username} (${userId})`)
  } else {
    console.log('\n🎯 目标：所有账号的测试数据')
  }

  // 1) 找出要删除的合同（用于清理 Storage 文件）
  const contractsQuery = supabase.from('contracts').select('id, user_id, file_url')
  const { data: contracts, error: cErr } = userId
    ? await contractsQuery.eq('user_id', userId)
    : await contractsQuery
  if (cErr) throw cErr

  const contractIds = (contracts ?? []).map((c) => c.id as string)
  const filePaths = (contracts ?? [])
    .map((c) => c.file_url as string | null)
    .filter((p): p is string => !!p)

  console.log(`\n📦 待清理：合同 ${contractIds.length} 份，Storage 文件 ${filePaths.length} 个`)

  // 2) 删 Storage 文件
  if (filePaths.length) {
    const { error } = await supabase.storage.from(BUCKET).remove(filePaths)
    if (error) console.warn('⚠️ Storage 文件删除失败（忽略继续）：', error.message)
    else console.log('✅ Storage 文件已删除')
  }

  // 3) 删数据库（risk_items / scan_reports 会随 contracts 级联删除，这里显式再删一次更保险）
  if (userId) {
    // 找出该用户的报告，删其风险项
    const { data: reports } = await supabase
      .from('scan_reports')
      .select('id')
      .eq('user_id', userId)
    const reportIds = (reports ?? []).map((r) => r.id as string)
    if (reportIds.length) {
      await supabase.from('risk_items').delete().in('report_id', reportIds)
    }
    await supabase.from('scan_reports').delete().eq('user_id', userId)
    await supabase.from('contracts').delete().eq('user_id', userId)
  } else {
    await supabase.from('risk_items').delete().neq('id', NIL)
    await supabase.from('scan_reports').delete().neq('id', NIL)
    await supabase.from('contracts').delete().neq('id', NIL)
  }

  console.log('✅ 数据库已清空（合同 / 报告 / 风险项）')
  console.log('\n✨ 完成！账号与知识库已保留，可以重新测试了。\n')
  process.exit(0)
}

main().catch((err) => {
  console.error('脚本出错：', err)
  process.exit(1)
})
