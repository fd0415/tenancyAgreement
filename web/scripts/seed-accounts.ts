/**
 * 批量创建初始账号脚本
 * 运行方式：npx tsx scripts/seed-accounts.ts
 *
 * 所有账号密码都在下方 ACCOUNTS 数组中定义，
 * 运行前确保 .env.local 中的 Supabase 配置已填写。
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ─── 在这里定义你要创建的账号 ──────────────────────────────
const ACCOUNTS = [
  { username: 'zf_admin', password: 'Admin@2026', display_name: '管理员' },
  { username: 'zf_test1', password: 'Test@1234',  display_name: '测试用户1' },
  { username: 'zf_test2', password: 'Test@5678',  display_name: '测试用户2' },
]
// ──────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 开始创建 ${ACCOUNTS.length} 个账号...\n`)

  for (const account of ACCOUNTS) {
    const password_hash = await bcrypt.hash(account.password, 12)

    const { error } = await supabase
      .from('users')
      .upsert(
        {
          username: account.username,
          password_hash,
          display_name: account.display_name,
        },
        { onConflict: 'username' }
      )

    if (error) {
      console.error(`❌ 创建 ${account.username} 失败：`, error.message)
    } else {
      console.log(`✅ 账号 ${account.username} / 密码 ${account.password}`)
    }
  }

  console.log('\n✨ 完成！\n')
  process.exit(0)
}

main().catch((err) => {
  console.error('脚本出错：', err)
  process.exit(1)
})
