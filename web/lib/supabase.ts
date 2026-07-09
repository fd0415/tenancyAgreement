import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/** 前端用 Client（受 RLS 限制） */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/** 服务端专用 Client（绕过 RLS，仅在 API Route / Server Action 中使用） */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
