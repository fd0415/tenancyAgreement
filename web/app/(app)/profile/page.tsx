import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth'
import { loadUserStats } from '@/lib/history'
import { AppHeader } from '@/components/common/AppHeader'
import LogoutButton from '@/components/common/LogoutButton'
import { Avatar } from '@/components/common/Avatar'

export default async function ProfilePage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const stats = await loadUserStats(user.userId)

  return (
    <div className="min-h-screen">
      <AppHeader active="profile" username={user.username} />

      <div className="mx-auto max-w-2xl px-8 py-10">
        {/* 头部：头像 + 账号 */}
        <div className="flex items-center gap-5">
          <Avatar seed={user.username} size={76} />
          <div>
            <h1 className="text-[22px] font-black text-ink">{user.username}</h1>
            <p className="mt-1 text-[13px] text-muted">账号密码登录 · 账号由平台统一开通</p>
            <span className="mt-2 inline-block rounded-full bg-page px-2.5 py-1 text-[11.5px] font-bold text-ink-soft">
              普通用户
            </span>
          </div>
        </div>

        {/* 统计卡 */}
        <div className="mt-8 grid grid-cols-3 gap-3.5">
          <div className="rounded-xl border border-line bg-surface p-5 text-center">
            <div className="text-[26px] font-black text-ink">{stats.reportCount}</div>
            <div className="mt-1 text-[12px] text-muted">累计体检合同</div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-5 text-center">
            <div className="text-[26px] font-black text-ink">{stats.riskCount}</div>
            <div className="mt-1 text-[12px] text-muted">累计发现风险</div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-5 text-center">
            <div className="text-[26px] font-black text-ink">{stats.usageDays}</div>
            <div className="mt-1 text-[12px] text-muted">使用天数</div>
          </div>
        </div>

        {/* 菜单一：历史记录 / 账号信息 */}
        <div className="mt-5 overflow-hidden rounded-xl border border-line bg-surface">
          <Link
            href="/history"
            className="flex items-center gap-3 border-b border-line px-5 py-4 transition-colors hover:bg-page"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px] text-ink-soft">
              <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="text-[14px] font-bold text-ink">历史记录</span>
            <span className="ml-auto text-[12.5px] text-muted">{stats.reportCount} 份</span>
            <span className="text-muted">›</span>
          </Link>
          <div className="flex items-center gap-3 px-5 py-4">
            <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px] text-ink-soft">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-[14px] font-bold text-ink">账号信息</span>
            <span className="ml-auto text-[12.5px] text-muted">{user.username}</span>
          </div>
        </div>

        {/* 菜单二：帮助与反馈 */}
        <details className="mt-5 overflow-hidden rounded-xl border border-line bg-surface">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 transition-colors hover:bg-page">
            <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px] text-ink-soft">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-[14px] font-bold text-ink">帮助与反馈</span>
            <span className="ml-auto text-muted">›</span>
          </summary>
          <div className="border-t border-line px-5 py-4 text-[13px] leading-relaxed text-ink-soft">
            <p>本工具仅提供租房合同风险提示，不构成法律意见，签约前请以合同原文及专业法律建议为准。</p>
            <p className="mt-2">
              使用中遇到问题或有建议，可发送邮件至{' '}
              <a href="mailto:feedback@leasecheck.ai" className="font-bold text-accent">
                feedback@leasecheck.ai
              </a>
              。
            </p>
          </div>
        </details>

        <div className="mt-8">
          <LogoutButton variant="block" />
        </div>
      </div>
    </div>
  )
}
