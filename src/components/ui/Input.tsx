import React from 'react'

// ============================================================
// Input component — accessible, with label and error state
// ============================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({
  label,
  error,
  hint,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-restaurant-text"
        >
          {label}
          {props.required && (
            <span className="text-brand-red ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <input
        id={inputId}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        aria-invalid={error ? 'true' : undefined}
        className={[
          'w-full rounded-lg border px-4 py-2.5 text-base text-restaurant-text',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent',
          'transition-colors duration-150',
          error
            ? 'border-red-500 bg-red-50'
            : 'border-restaurant-border bg-white hover:border-gray-400',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-sm text-red-600"
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-sm text-restaurant-muted">
          {hint}
        </p>
      )}
    </div>
  )
}
