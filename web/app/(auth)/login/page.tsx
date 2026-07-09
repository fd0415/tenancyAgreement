'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')

    if (!username.trim() || !password) {
      setError('请输入账号和密码')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '登录失败')
        return
      }
      router.push('/home')
      router.refresh()
    } catch {
      setError('网络异常，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface">
      {/* 背景光晕 */}
      <div
        className="pointer-events-none absolute -left-20 -top-32 h-[520px] w-[520px] opacity-[0.22]"
        style={{
          filter: 'blur(64px)',
          background:
            'radial-gradient(circle at 30% 30%, var(--purple), transparent 60%), radial-gradient(circle at 70% 40%, var(--blue), transparent 55%), radial-gradient(circle at 55% 75%, var(--orange), transparent 55%)',
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-36 -right-24 h-[460px] w-[460px] opacity-[0.16]"
        style={{
          filter: 'blur(64px)',
          background:
            'radial-gradient(circle at 30% 30%, var(--purple), transparent 60%), radial-gradient(circle at 70% 40%, var(--blue), transparent 55%), radial-gradient(circle at 55% 75%, var(--orange), transparent 55%)',
        }}
      />

      {/* 登录卡片 */}
      <div
        className="relative z-10 w-[380px] rounded-2xl border border-line bg-surface px-[34px] pb-[30px] pt-10 text-center"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="mb-[18px] flex justify-center">
          <div
            className="flex h-[46px] w-[46px] items-center justify-center rounded-[10px]"
            style={{
              background: 'linear-gradient(145deg, var(--purple), var(--blue))',
              boxShadow: '0 4px 10px rgba(167,139,250,.18)',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-[22px] w-[22px]">
              <path
                d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path d="M14 3.5V8h4" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
              <path
                d="M8.5 13.5l2 2 4-4.5"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-black text-ink">登录</h2>
        <p className="mt-1.5 text-[13px] text-muted">帮你 3 分钟看懂租房合同风险</p>

        <form onSubmit={handleLogin}>
          <div className="mt-[22px] text-left">
            <label className="mb-[7px] block text-xs font-extrabold text-ink-soft">账号</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入账号"
              autoComplete="username"
              className="block min-h-[46px] w-full rounded-lg border border-line-strong bg-page px-3.5 text-sm text-ink outline-none focus:border-accent focus:bg-surface"
            />
          </div>

          <div className="mt-[22px] text-left">
            <label className="mb-[7px] block text-xs font-extrabold text-ink-soft">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoComplete="current-password"
              className="block min-h-[46px] w-full rounded-lg border border-line-strong bg-page px-3.5 text-sm text-ink outline-none focus:border-accent focus:bg-surface"
            />
          </div>

          {error && (
            <p className="mt-3 text-left text-[12.5px] font-semibold text-high">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-black-btn px-[22px] text-sm font-bold text-white transition-opacity hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? '登录中…' : '登录'}
          </button>
        </form>

        <div className="mt-[18px] flex items-start gap-2 text-left text-[11.5px] leading-[1.6] text-muted">
          <span>账号由平台统一开通，忘记密码请联系客服重置</span>
        </div>
      </div>
    </div>
  )
}
