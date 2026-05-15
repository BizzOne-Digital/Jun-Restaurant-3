import React from 'react'

export function MenuItemSkeleton() {
  return (
    <div aria-hidden="true" className="bg-white rounded-card border border-restaurant-border overflow-hidden shadow-card flex">
      {/* Left: text */}
      <div className="flex-1 p-4 space-y-3">
        <div className="flex gap-1">
          <div className="h-5 shimmer rounded-full w-16" />
        </div>
        <div className="h-4 shimmer rounded-full w-3/4" />
        <div className="h-3 shimmer rounded-full w-full" />
        <div className="h-3 shimmer rounded-full w-2/3" />
        <div className="flex items-center justify-between pt-3 border-t border-restaurant-border">
          <div className="h-6 shimmer rounded-full w-16" />
          <div className="h-7 shimmer rounded-lg w-24" />
        </div>
      </div>
      {/* Right: image */}
      <div className="w-28 sm:w-32 flex-shrink-0 shimmer" />
    </div>
  )
}

export function MenuSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MenuItemSkeleton key={i} />
      ))}
    </div>
  )
}
