import React from 'react'

// ============================================================
// Badge component — Popular, status, etc.
// ============================================================

type BadgeVariant = 'popular' | 'success' | 'warning' | 'error' | 'info' | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  popular: 'bg-brand-gold text-white',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  default: 'bg-gray-100 text-gray-700',
}

export function Badge({
  variant = 'default',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
