'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface AdminUser { _id: string; name: string; email: string; role: string; isBlocked: boolean; createdAt: string }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) return
      const data = await res.json()
      setUsers(data.data.users)
    } finally { setIsLoading(false) }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const updateUser = async (id: string, patch: Record<string, unknown>) => {
    setUpdatingId(id)
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      await fetchUsers()
    } finally { setUpdatingId(null) }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Users</h1>

      <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_3fr_1.5fr_1fr] gap-4 px-5 py-3 border-b border-[#2a2a2a] text-[10px] text-[#555] uppercase tracking-widest">
          <span>Name</span><span>Email</span><span>Role</span><span>Blocked</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#e8604c] border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-[#555]">No users yet</div>
        ) : (
          users.map((user) => (
            <div key={user._id} className="grid grid-cols-[2fr_3fr_1.5fr_1fr] gap-4 px-5 py-4 border-b border-[#222] hover:bg-[#222] transition-colors items-center">
              <span className="text-sm text-white">{user.name}</span>
              <span className="text-sm text-[#888] truncate">{user.email}</span>

              {/* Role dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value={user.role}
                  onChange={(e) => updateUser(user._id, { role: e.target.value })}
                  disabled={updatingId === user._id}
                  className="bg-[#2a2a2a] border border-[#333] text-[#aaa] text-xs rounded px-2 py-1 focus:outline-none focus:border-[#e8604c] disabled:opacity-50"
                >
                  <option value="customer">user</option>
                </select>
                {updatingId === user._id && (
                  <div className="animate-spin rounded-full h-3 w-3 border border-[#e8604c] border-t-transparent" />
                )}
              </div>

              {/* Block button */}
              <button
                onClick={() => updateUser(user._id, { isBlocked: !user.isBlocked })}
                disabled={updatingId === user._id}
                className={`text-xs font-medium disabled:opacity-50 ${user.isBlocked ? 'text-green-400 hover:text-green-300' : 'text-[#e8604c] hover:text-red-300'}`}
              >
                {user.isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
