'use client'

import React, { useEffect } from 'react'

// ============================================================
// Toast notification component
// ============================================================

type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  onClose: () => void
  duration?: number
}

const typeClasses: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-gray-800 text-white',
}

const typeIcons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
}

export function Toast({
  message,
  type = 'info',
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50 flex items-center gap-3',
        'px-5 py-3 rounded-xl shadow-lg text-sm font-medium',
        'animate-fade-in',
        typeClasses[type],
      ].join(' ')}
    >
      <span aria-hidden="true" className="text-base font-bold">
        {typeIcons[type]}
      </span>
      <span>{message}</span>
      <button
        onClick={onClose}
        aria-label="Close notification"
        className="ml-2 opacity-75 hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </div>
  )
}
