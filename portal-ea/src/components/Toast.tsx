'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastMessage {
  id: string
  type: ToastType
  title: string
  details?: string
}

// Estado global simple para toasts
let toastListeners: ((toasts: ToastMessage[]) => void)[] = []
let toastQueue: ToastMessage[] = []

export function showToast(type: ToastType, title: string, details?: string) {
  const id = `${Date.now()}-${Math.random()}`
  const toast: ToastMessage = { id, type, title, details }
  toastQueue = [...toastQueue, toast]
  toastListeners.forEach(fn => fn(toastQueue))

  // Auto-remove después de 5s (errores duran más)
  const duration = type === 'error' || details ? 8000 : 4000
  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== id)
    toastListeners.forEach(fn => fn(toastQueue))
  }, duration)
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const listener = (t: ToastMessage[]) => setToasts([...t])
    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter(fn => fn !== listener)
    }
  }, [])

  if (toasts.length === 0) return null

  const colors: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
    success: { bg: 'bg-green-50', border: 'border-green-200', icon: '✓', text: 'text-green-800' },
    error: { bg: 'bg-red-50', border: 'border-red-200', icon: '✕', text: 'text-red-800' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '⚠', text: 'text-yellow-800' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'ℹ', text: 'text-blue-800' },
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => {
        const c = colors[toast.type]
        return (
          <div
            key={toast.id}
            className={`${c.bg} ${c.border} border rounded-lg shadow-lg p-4 animate-in slide-in-from-right`}
          >
            <div className="flex items-start gap-2">
              <span className={`${c.text} font-bold text-lg leading-none`}>{c.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`${c.text} font-medium text-sm`}>{toast.title}</p>
                {toast.details && (
                  <p className={`${c.text} text-xs mt-1 opacity-80 whitespace-pre-wrap`}>{toast.details}</p>
                )}
              </div>
              <button
                onClick={() => {
                  toastQueue = toastQueue.filter(t => t.id !== toast.id)
                  toastListeners.forEach(fn => fn(toastQueue))
                }}
                className={`${c.text} opacity-50 hover:opacity-100 text-sm`}
              >
                ✕
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
