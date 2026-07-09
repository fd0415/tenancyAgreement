import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'fallback-secret-change-in-production'
)

// 需要登录才能访问的路径前缀
const PROTECTED_PATHS = ['/home', '/scan', '/report', '/history', '/profile']
// 已登录后不需要再访问的路径
const AUTH_PATHS = ['/login']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('lease_token')?.value

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p))

  // 验证 token
  let isValidToken = false
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET)
      isValidToken = true
    } catch {
      isValidToken = false
    }
  }

  // 未登录访问需要保护的页面 → 跳转到登录
  if (isProtected && !isValidToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 已登录访问登录页 → 跳转到首页
  if (isAuthPath && isValidToken) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login',
    '/home/:path*',
    '/scan/:path*',
    '/report/:path*',
    '/history/:path*',
    '/profile/:path*',
  ],
}
