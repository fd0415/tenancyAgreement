import Link from 'next/link'
import { BrandMark } from '@/components/common/BrandMark'
import { Avatar } from '@/components/common/Avatar'

type NavKey = 'home' | 'history' | 'profile'

const NAV: { key: NavKey; label: string; href: string }[] = [
  { key: 'home', label: '首页', href: '/home' },
  { key: 'history', label: '历史记录', href: '/history' },
]

export function AppHeader({
  active,
  username,
}: {
  active?: NavKey
  username?: string
}) {
  return (
    <header className="flex items-center gap-3 border-b border-line bg-surface px-6 py-3">
      <BrandMark size="sm" />
      <span className="text-[15px] font-black text-ink">租房合同审核</span>
      <nav className="ml-6 flex gap-1.5 text-[13.5px] font-bold">
        {NAV.map((n) => (
          <Link
            key={n.key}
            href={n.href}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              active === n.key ? 'bg-page text-ink' : 'text-ink-soft hover:bg-page'
            }`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <Link href="/profile" className="ml-auto" aria-label="个人中心" title={username}>
        <Avatar
          seed={username ?? '访客'}
          size={34}
          className={
            active === 'profile' ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''
          }
        />
      </Link>
    </header>
  )
}
