import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { loadUserReports } from '@/lib/history'
import { AppHeader } from '@/components/common/AppHeader'
import HistoryClient from './HistoryClient'

export default async function HistoryPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const items = await loadUserReports(user.userId)

  return (
    <div className="min-h-screen">
      <AppHeader active="history" username={user.username} />
      <div className="mx-auto max-w-5xl px-8 py-9">
        <HistoryClient items={items} />
      </div>
    </div>
  )
}
