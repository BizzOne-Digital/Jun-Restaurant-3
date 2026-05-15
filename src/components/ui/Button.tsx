import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  children: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-brand-red to-spice-500 text-white shadow-red hover:from-spice-700 hover:to-brand-red hover:shadow-lg focus:ring-brand-red active:scale-95',
  secondary:
    'bg-white text-brand-red border-2 border-brand-red hover:bg-spice-50 hover:shadow-sm focus:ring-brand-red active:scale-95',
  ghost:
    'bg-transparent text-restaurant-text hover:bg-spice-50 hover:text-brand-red focus:ring-brand-red',
  danger:
    'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 focus:ring-red-500 active:scale-95',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-base rounded-xl',
  lg: 'px-7 py-3.5 text-lg rounded-2xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={[
        'inline-flex items-center justify-center gap-2 font-semibold',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
