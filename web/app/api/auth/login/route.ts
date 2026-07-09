import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyPassword, signToken, buildAuthCookie } from '@/lib/auth'
import type { User } from '@/types'

export async function POST(request: Request) {
  let body: { username?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }

  const username = body.username?.trim()
  const password = body.password

  if (!username || !password) {
    return NextResponse.json({ error: '请输入账号和密码' }, { status: 400 })
  }

  // 查用户
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('username', username)
    .maybeSingle<User>()

  if (error) {
    return NextResponse.json({ error: '服务异常，请稍后再试' }, { status: 500 })
  }

  // 用户不存在或密码错误，统一返回同一提示（避免枚举账号）
  if (!user) {
    return NextResponse.json({ error: '账号或密码错误' }, { status: 401 })
  }

  const ok = await verifyPassword(password, user.password_hash)
  if (!ok) {
    return NextResponse.json({ error: '账号或密码错误' }, { status: 401 })
  }

  // 签发 JWT 并写入 httpOnly Cookie
  const token = await signToken({ userId: user.id, username: user.username })
  const response = NextResponse.json({
    ok: true,
    user: { id: user.id, username: user.username, display_name: user.display_name },
  })
  response.cookies.set(buildAuthCookie(token))
  return response
}
