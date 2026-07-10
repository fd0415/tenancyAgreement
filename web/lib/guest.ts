import { supabaseAdmin } from '@/lib/supabase'

// 去掉登录后，所有匿名访客的数据统一挂在这个固定用户名下。
export const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000'

let ensured = false

/** 确保访客用户存在（首次调用时写入，之后进程内跳过）。 */
export async function ensureGuestUser(): Promise<void> {
  if (ensured) return
  await supabaseAdmin.from('users').upsert(
    {
      id: GUEST_USER_ID,
      username: '__guest__',
      password_hash: '',
      display_name: '访客',
    },
    { onConflict: 'id' }
  )
  ensured = true
}
