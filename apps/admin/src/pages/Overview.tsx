import { useEffect, useState } from 'react'
import { supabase } from '@myexpert/shared'
import { Briefcase, CheckCircle, DollarSign, AlertTriangle, Users, RefreshCw } from 'lucide-react'

interface Stats {
  activeJobs:       number
  verifiedWorkers:  number
  pendingVerify:    number
  totalWorkers:     number
  totalCustomers:   number
  gmvWeek:          number
  revenueWeek:      number
  openDisputes:     number
  jobsThisWeek:     number
  escrowHeld:       number
}

interface ActivityItem {
  id:         string
  event:      string
  detail:     string
  created_at: string
}

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}k`
  return `₦${n.toLocaleString()}`
}

function timeAgo(iso: string) {
  const secs = (Date.now() - new Date(iso).getTime()) / 1000
  if (secs < 60)   return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

export default function OverviewPage() {
  const [stats,    setStats]    = useState<Stats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading,  setLoading]  = useState(true)
  const [range,    setRange]    = useState<'7' | '30' | 'all'>('7')

  const load = async () => {
    setLoading(true)
    const since = range === 'all'
      ? new Date(0).toISOString()
      : new Date(Date.now() - Number(range) * 86400_000).toISOString()

    const [
      { count: activeJobs },
      { count: verifiedWorkers },
      { count: pendingVerify },
      { count: totalWorkers },
      { count: totalCustomers },
      { data: escrowData },
      { count: openDisputes },
      { count: jobsThisWeek },
    ] = await Promise.all([
      supabase.from('jobs').select('id', { count: 'exact', head: true })
        .in('status', ['open', 'bidding', 'booked', 'accepted', 'in_progress']),
      supabase.from('worker_profiles').select('id', { count: 'exact', head: true })
        .eq('is_verified', true),
      supabase.from('worker_profiles').select('id', { count: 'exact', head: true })
        .eq('is_verified', false),
      supabase.from('worker_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true })
        .eq('role', 'customer'),
      supabase.from('escrow_ledger')
        .select('gross_amount, net_amount, service_fee, status')
        .gte('held_at', since),
      supabase.from('disputes').select('id', { count: 'exact', head: true })
        .eq('status', 'open'),
      supabase.from('jobs').select('id', { count: 'exact', head: true })
        .gte('created_at', since),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (escrowData ?? []) as any[]
    const gmv     = rows.reduce((s, r) => s + Number(r.gross_amount  ?? 0), 0)
    const revenue = rows.reduce((s, r) => s + Number(r.service_fee   ?? 0), 0)
    const held    = rows.filter(r => r.status === 'held')
                        .reduce((s, r) => s + Number(r.net_amount ?? 0), 0)

    setStats({
      activeJobs:      activeJobs      ?? 0,
      verifiedWorkers: verifiedWorkers ?? 0,
      pendingVerify:   pendingVerify   ?? 0,
      totalWorkers:    totalWorkers    ?? 0,
      totalCustomers:  totalCustomers  ?? 0,
      gmvWeek:         gmv,
      revenueWeek:     revenue,
      openDisputes:    openDisputes    ?? 0,
      jobsThisWeek:    jobsThisWeek    ?? 0,
      escrowHeld:      held,
    })

    // Recent activity: last 20 jobs ordered by updated_at
    const { data: recentJobs } = await supabase
      .from('jobs')
      .select('id, title, status, updated_at')
      .order('updated_at', { ascending: false })
      .limit(20)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activityItems: ActivityItem[] = (recentJobs ?? []).map((j: any) => ({
      id:         j.id,
      event:      j.status,
      detail:     j.title,
      created_at: j.updated_at,
    }))
    setActivity(activityItems)
    setLoading(false)
  }

  useEffect(() => { load() }, [range]) // eslint-disable-line react-hooks/exhaustive-deps

  const STATUS_COLORS: Record<string, string> = {
    open:        'bg-blue-100 text-blue-700',
    bidding:     'bg-yellow-100 text-yellow-700',
    booked:      'bg-purple-100 text-purple-700',
    accepted:    'bg-indigo-100 text-indigo-700',
    in_progress: 'bg-orange-100 text-orange-700',
    done:        'bg-teal-100 text-teal-700',
    confirmed:   'bg-green-100 text-green-700',
    disputed:    'bg-red-100 text-red-700',
    cancelled:   'bg-gray-100 text-gray-500',
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Overview</h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={range}
            onChange={e => setRange(e.target.value as '7' | '30' | 'all')}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={load}
            disabled={loading}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin text-gray-400' : 'text-gray-500'} />
          </button>
        </div>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          {
            icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50',
            label: 'ACTIVE JOBS',
            val: loading ? '—' : String(stats?.activeJobs ?? 0),
            sub: loading ? '' : `${stats?.jobsThisWeek ?? 0} this period`,
          },
          {
            icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50',
            label: 'VERIFIED WORKERS',
            val: loading ? '—' : String(stats?.verifiedWorkers ?? 0),
            sub: loading ? '' : `${stats?.pendingVerify ?? 0} pending`,
          },
          {
            icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50',
            label: 'GMV',
            val: loading ? '—' : fmt(stats?.gmvWeek ?? 0),
            sub: loading ? '' : `₦${(stats?.escrowHeld ?? 0).toLocaleString()} in escrow`,
          },
          {
            icon: DollarSign, color: 'text-brand-600', bg: 'bg-brand-50',
            label: 'REVENUE (10%)',
            val: loading ? '—' : fmt(stats?.revenueWeek ?? 0),
            sub: '',
          },
          {
            icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50',
            label: 'OPEN DISPUTES',
            val: loading ? '—' : String(stats?.openDisputes ?? 0),
            sub: '',
          },
        ].map(({ icon: Icon, color, bg, label, val, sub }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-gray-500 uppercase">{label}</p>
              <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon size={14} className={color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{val}</p>
            {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">TOTAL CUSTOMERS</p>
          <p className="text-xl font-bold text-gray-900">{loading ? '—' : stats?.totalCustomers ?? 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">TOTAL WORKERS</p>
          <p className="text-xl font-bold text-gray-900">{loading ? '—' : stats?.totalWorkers ?? 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">VERIFICATION RATE</p>
          <p className="text-xl font-bold text-gray-900">
            {loading || !stats
              ? '—'
              : stats.totalWorkers > 0
                ? `${Math.round((stats.verifiedWorkers / stats.totalWorkers) * 100)}%`
                : '0%'}
          </p>
        </div>
      </div>

      {/* Live activity */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent job activity</h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            live
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activity.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No recent activity.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {activity.map(a => (
              <div key={a.id} className="flex items-center gap-3 py-2.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[a.event] ?? 'bg-gray-100 text-gray-500'}`}>
                  {a.event}
                </span>
                <p className="flex-1 text-sm text-gray-700 truncate">{a.detail}</p>
                <p className="text-xs text-gray-400 shrink-0">{timeAgo(a.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
