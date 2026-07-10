import { ToastProvider } from '@/components/common/Toast'
import { SessionHistoryProvider } from '@/components/common/SessionHistory'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SessionHistoryProvider>{children}</SessionHistoryProvider>
    </ToastProvider>
  )
}
