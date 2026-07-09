'use client'

import Link from 'next/link'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--high-bg)]">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-high">
          <path d="M12 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
      <h2 className="text-lg font-black text-ink">页面出错了</h2>
      <p className="max-w-[420px] text-[13.5px] leading-relaxed text-ink-soft">
        {error.message || '发生了未知错误，请稍后重试。'}
      </p>
      <div className="mt-1 flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-black-btn px-5 py-2.5 text-sm font-bold text-white hover:bg-black"
        >
          重试
        </button>
        <Link
          href="/home"
          className="rounded-lg border border-line-strong bg-surface px-5 py-2.5 text-sm font-bold text-ink-soft hover:bg-page"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}
