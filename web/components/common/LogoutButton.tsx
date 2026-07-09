'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton({
  variant = 'sidebar',
}: {
  variant?: 'sidebar' | 'block'
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const cls =
    variant === 'block'
      ? 'min-h-[44px] w-full rounded-lg border border-line-strong bg-surface px-5 text-[13.5px] font-bold text-ink transition-colors hover:bg-page disabled:opacity-40'
      : 'mt-2 min-h-[40px] rounded-lg border border-line-strong bg-surface px-5 text-[13px] font-bold text-ink transition-colors hover:bg-page disabled:opacity-40'

  return (
    <button onClick={handleLogout} disabled={loading} className={cls}>
      {loading ? '退出中…' : '退出登录'}
    </button>
  )
}
