import { AppHeader } from '@/components/common/AppHeader'
import HistoryClient from './HistoryClient'

export default function HistoryPage() {
  return (
    <div className="min-h-screen">
      <AppHeader active="history" />
      <div className="mx-auto max-w-5xl px-8 py-9">
        <HistoryClient />
      </div>
    </div>
  )
}
