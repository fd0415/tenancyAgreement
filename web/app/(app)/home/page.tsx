import { getAuthUser } from '@/lib/auth'
import { loadUserReports } from '@/lib/history'
import { BrandMark } from '@/components/common/BrandMark'
import HomeClient from './HomeClient'
import LogoutButton from '@/components/common/LogoutButton'
import { Avatar } from '@/components/common/Avatar'

export default async function HomePage() {
  const user = await getAuthUser()

  // 该用户的体检报告（侧边栏「历史审核」+「我的合同」Tab 共用）
  const reports = user ? await loadUserReports(user.userId) : []
  const history = reports.slice(0, 8)

  return (
    <div className="flex min-h-screen">
      {/* 侧边栏 */}
      <aside className="flex w-[216px] flex-shrink-0 flex-col gap-[22px] border-r border-line bg-surface px-3.5 py-5">
        <div className="flex items-center gap-2.5 px-1.5 text-[15px] font-black text-ink">
          <BrandMark size="sm" />
          <span>租房合同助手</span>
        </div>

        <nav className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2.5 rounded-[10px] bg-page px-3 py-2.5 text-[13.5px] font-bold text-ink">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            合同审核
          </span>
          <a
            href="/history"
            className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px] font-bold text-ink-soft hover:bg-page"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
            </svg>
            历史记录
          </a>
          <a
            href="/profile"
            className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px] font-bold text-ink-soft hover:bg-page"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" />
              <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            我的
          </a>
        </nav>

        <div className="px-1.5 text-[11px] font-extrabold tracking-wider text-muted">历史审核</div>
        <div className="flex flex-col gap-0.5">
          {history.length === 0 ? (
            <span className="px-3 py-2 text-[12px] text-muted">暂无记录</span>
          ) : (
            history.map((h) => (
              <a
                key={h.reportId}
                href={`/report/${h.reportId}`}
                className="block truncate rounded-[10px] px-3 py-2 text-[12.5px] text-ink-soft hover:bg-page"
              >
                {h.fileName}
              </a>
            ))
          )}
        </div>

        <div className="mt-auto px-1.5">
          <LogoutButton />
        </div>
      </aside>

      {/* 主区域 */}
      <HomeClient myContracts={reports.slice(0, 6)} />

      {/* 右上角头像 */}
      <div className="pointer-events-none absolute right-6 top-[22px] z-20">
        <Avatar seed={user?.username ?? '访客'} size={34} />
      </div>
    </div>
  )
}
