import React from 'react'

export function PopularBadge() {
  return (
    <span
      aria-label="Popular item"
      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-green-600 text-white shadow-sm"
    >
      🔥 Popular
    </span>
  )
}
