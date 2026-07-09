'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  type: ToastType
  message: string
}

const ToastCtx = createContext<(message: string, type?: ToastType) => void>(() => {})

export function useToast() {
  return useContext(ToastCtx)
}

const BG: Record<ToastType, string> = {
  success: 'var(--low)',
  error: 'var(--high)',
  info: 'var(--ink)',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-5 z-[100] flex flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast-enter rounded-lg px-4 py-2.5 text-[13px] font-bold text-white"
            style={{ background: BG[t.type], boxShadow: '0 8px 24px rgba(0,0,0,.18)' }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
