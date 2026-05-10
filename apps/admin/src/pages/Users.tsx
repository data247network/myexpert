import { useEffect, useState } from 'react'
import { supabase } from '@myexpert/shared'
import { Search, UserCheck, UserX, ChevronDown, ChevronUp, Shield, Briefcase, User } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserRow {
  id:         string
  full_name:  string
  email:      string
  phone:      string | null
  role:       'customer' | 'worker' | 'admin'
  created_at: string
  // worker extras
  primary_skill?:       string
  is_verified?:         boolean
  verification_status?: string
  available_balance?:   number
  // customer extras
  job_count?: number
}

const ROLE_CHIP: Record<string, string> = {
  customer: 'bg-blue-50 text-blue-700',
  worker:   'bg-purple-50 text-purple-700',
  admin:    'bg-amber-50 text-amber-700',
}

const ROLE_ICON: Record<string, React.ElementType> = {
  customer: User,
  worker:   Briefcase,
  admin:    Shield,
}

// ── Role-change modal ─────────────────────────────────────────────────────────

function RoleModal({
  user,
  onClose,
  onDone,
}: {
  user:    UserRow
  onClose: () => void
  onDone:  () => void
}) {
  const [role,   setRole]   = useState<UserRow['role']>(user.role)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const save = async () => {
    if (role === user.role) { onClose(); return }
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', user.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    onDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-lg">Change role</h3>
          <p className="text-sm text-gray-500 mt-0.5">{user.full_name} · {user.email}</p>
        </div>
        <div className="p-5 flex flex-col gap-3">
          {(['customer', 'worker', 'admin'] as const).map(r => {
            const Icon = ROLE_ICON[r]
            return (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors capitalize font-medium text-sm ${
                  role === r
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                <Icon size={16} />
                {r}
                {r === 'admin' && (
                  <span className="ml-auto text-xs text-amber-600 font-semibold">⚠ Full access</span>
                )}
              </button>
            )
          })}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 mt-1">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── User row card ─────────────────────────────────────────────────────────────

function UserRowCard({ user, onRefresh }: { user: UserRow; onRefresh: () => void }) {
  const [expanded,  setExpanded]  = useState(false)
  const [showModal, setShowModal] = useState(false)
  const RoleIcon = ROLE_ICON[user.role] ?? User

  const initials = user.full_name
    .split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  const avatarColors: Record<string, { bg: string; color: string }> = {
    admin:    { bg: '#fef3c7', color: '#92400e' },
    worker:   { bg: '#ede9fe', color: '#6d28d9' },
    customer: { bg: '#eff6ff', color: '#1d4ed8' },
  }
  const av = avatarColors[user.role] ?? avatarColors.customer

  return (
    <>
      {showModal && (
        <RoleModal user={user} onClose={() => setShowModal(false)} onDone={onRefresh} />
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header row */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors">

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
            style={{ background: av.bg, color: av.color }}>
            {initials || '?'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{user.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          {/* Role chip */}
          <span className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_CHIP[user.role]}`}>
            <RoleIcon size={11} />
            {user.role}
          </span>

          {/* Worker verified indicator */}
          {user.role === 'worker' && (
            user.is_verified
              ? <UserCheck size={16} className="text-green-500 shrink-0" />
              : <UserX    size={16} className="text-gray-300 shrink-0" />
          )}

          {expanded
            ? <ChevronUp   size={16} className="text-gray-400 shrink-0" />
            : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
        </button>

        {/* Expanded detail panel */}
        {expanded && (
          <div className="border-t border-gray-100 px-5 py-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                <p className="font-medium text-gray-800">{user.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Joined</p>
                <p className="font-medium text-gray-800">
                  {new Date(user.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>

              {user.role === 'worker' && (
                <>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Skill</p>
                    <p className="font-medium text-gray-800">{user.primary_skill ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Balance</p>
                    <p className="font-medium text-gray-800">
                      ₦{(user.available_balance ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Verification</p>
                    <p className="font-medium text-gray-800 capitalize">
                      {user.verification_status?.replace('_', ' ') ?? '—'}
                    </p>
                  </div>
                </>
              )}

              {user.role === 'customer' && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Jobs posted</p>
                  <p className="font-medium text-gray-800">{user.job_count ?? 0}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="self-start flex items-center gap-1.5 text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-2 rounded-lg hover:bg-purple-100">
              <Shield size={12} /> Change role
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users,   setUsers]   = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<'all' | 'customer' | 'worker' | 'admin'>('all')
  const [search,  setSearch]  = useState('')

  const fetchUsers = async () => {
    setLoading(true)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, created_at')
      .order('created_at', { ascending: false })
      .limit(500)

    if (!profiles) { setLoading(false); return }

    // Fetch worker extras
    const workerIds = profiles.filter(p => p.role === 'worker').map(p => p.id)
    const { data: workerProfiles } = workerIds.length > 0
      ? await supabase
          .from('worker_profiles')
          .select('id, primary_skill, is_verified, verification_status, available_balance')
          .in('id', workerIds)
      : { data: [] as { id: string; primary_skill: string; is_verified: boolean; verification_status: string; available_balance: number }[] }

    // Fetch customer job counts
    const customerIds = profiles.filter(p => p.role === 'customer').map(p => p.id)
    const { data: jobRows } = customerIds.length > 0
      ? await supabase
          .from('jobs')
          .select('customer_id')
          .in('customer_id', customerIds)
      : { data: [] as { customer_id: string }[] }

    type WP = { id: string; primary_skill: string; is_verified: boolean; verification_status: string; available_balance: number }
    const wpMap: Record<string, WP> = {}
    workerProfiles?.forEach(w => { if (w) wpMap[w.id] = w as WP })

    const jcMap: Record<string, number> = {}
    jobRows?.forEach(j => {
      if (j?.customer_id) jcMap[j.customer_id] = (jcMap[j.customer_id] ?? 0) + 1
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped: UserRow[] = (profiles as any[]).map(p => ({
      ...p,
      ...(wpMap[p.id] ?? {}),
      job_count: jcMap[p.id] ?? 0,
    }))

    setUsers(mapped)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter(u => {
    const matchRole   = filter === 'all' || u.role === filter
    const q           = search.toLowerCase()
    const matchSearch = !q ||
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone ?? '').includes(q)
    return matchRole && matchSearch
  })

  const counts = {
    all:      users.length,
    customer: users.filter(u => u.role === 'customer').length,
    worker:   users.filter(u => u.role === 'worker').length,
    admin:    users.filter(u => u.role === 'admin').length,
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {counts.all} total · {counts.customer} customers · {counts.worker} workers · {counts.admin} admins
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {(['all', 'customer', 'worker', 'admin'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors ${
              filter === f ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {f}{' '}
            <span className="text-gray-400 font-normal">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center pt-12">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <User size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No users found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(u => (
            <UserRowCard key={u.id} user={u} onRefresh={fetchUsers} />
          ))}
        </div>
      )}
    </div>
  )
}
