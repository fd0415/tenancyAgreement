'use client'

import { createContext, useCallback, useContext, useState } from 'react'

// 本会话的体检记录：只存在内存里，刷新浏览器即清空。
export interface SessionReport {
  reportId: string
  contractId: string
  fileName: string
  score: number
  high: number
  mid: number
  low: number
  status: 'scanning' | 'done' | 'failed'
  createdAt: string
}

interface SessionHistoryValue {
  items: SessionReport[]
  addItem: (item: SessionReport) => void
}

const SessionHistoryContext = createContext<SessionHistoryValue | null>(null)

export function SessionHistoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SessionReport[]>([])

  const addItem = useCallback((item: SessionReport) => {
    setItems((prev) => [item, ...prev.filter((x) => x.reportId !== item.reportId)])
  }, [])

  return (
    <SessionHistoryContext.Provider value={{ items, addItem }}>
      {children}
    </SessionHistoryContext.Provider>
  )
}

export function useSessionHistory(): SessionHistoryValue {
  const ctx = useContext(SessionHistoryContext)
  if (!ctx) {
    throw new Error('useSessionHistory 必须在 SessionHistoryProvider 内使用')
  }
  return ctx
}
