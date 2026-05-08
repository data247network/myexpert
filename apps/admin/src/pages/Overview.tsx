import { Activity, Briefcase, CheckCircle, DollarSign, AlertTriangle } from 'lucide-react'

export default function OverviewPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Overview</h1>
          <p className="text-sm text-gray-500">Today · {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>All time</option>
        </select>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { icon: Briefcase,     label: 'ACTIVE JOBS',       val: '—',  sub: '' },
          { icon: CheckCircle,   label: 'WORKERS VERIFIED',  val: '—',  sub: '— pending' },
          { icon: DollarSign,    label: 'GMV (WEEK)',         val: '₦0', sub: '↑ 0%' },
          { icon: DollarSign,    label: 'REVENUE (10%)',      val: '₦0', sub: '↑ 0%' },
          { icon: AlertTriangle, label: 'OPEN DISPUTES',      val: '0',  sub: '' },
        ].map(({ icon: Icon, label, val, sub }) => (
          <div key={label} className="stat-card">
            <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{val}</p>
            {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Live activity */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Live activity</h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            real-time
          </span>
        </div>
        <p className="text-sm text-gray-500 py-8 text-center">
          Live activity will appear here once connected to Supabase.
        </p>
      </div>
    </div>
  )
}
