import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@myexpert/shared'
import type { Job } from '@myexpert/shared'
import { Briefcase, ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open:        { label: 'Open',        color: 'bg-blue-50 text-blue-700'      },
  bidding:     { label: 'Bidding',     color: 'bg-yellow-50 text-yellow-700'  },
  booked:      { label: 'Booked',      color: 'bg-brand-50 text-brand-700'    },
  accepted:    { label: 'Accepted',    color: 'bg-brand-50 text-brand-700'    },
  en_route:    { label: 'En route',    color: 'bg-orange-50 text-orange-700'  },
  in_progress: { label: 'In progress', color: 'bg-orange-50 text-orange-700'  },
  done:        { label: 'Done',        color: 'bg-green-50 text-green-700'    },
  confirmed:   { label: 'Confirmed',   color: 'bg-green-50 text-green-700'    },
  disputed:    { label: 'Disputed',    color: 'bg-red-50 text-red-700'        },
  cancelled:   { label: 'Cancelled',   color: 'bg-gray-100 text-gray-500'     },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-gray-100 text-gray-500' }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

function JobRow({ job }: { job: Job }) {
  const isDone = ['confirmed', 'cancelled'].includes(job.status)
  const isDisputed = job.status === 'disputed'
  const icon = isDone
    ? <CheckCircle size={18} className="text-green-500 shrink-0" />
    : isDisputed
    ? <AlertCircle size={18} className="text-red-500 shrink-0" />
    : <Clock size={18} className="text-ink-tertiary shrink-0" />

  return (
    <div className={`card flex items-center gap-3 ${isDone ? 'opacity-60' : ''}`}>
      {icon}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-ink truncate">{job.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <StatusBadge status={job.status} />
          {job.final_price != null && (
            <span className="text-xs text-ink-secondary">
              ₦{job.final_price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="text-ink-tertiary shrink-0" />
    </div>
  )
}

export default function CustomerJobs() {
  const { user } = useAuth()
  const [jobs,    setJobs]    = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('jobs')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setJobs(data as Job[])
        setLoading(false)
      })
  }, [user])

  const active    = jobs.filter(j => !['confirmed', 'cancelled'].includes(j.status))
  const completed = jobs.filter(j => ['confirmed', 'cancelled'].includes(j.status))

  return (
    <div className="page-with-nav">
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">My Jobs</h1>
        <Link to="/jobs/new"
          className="px-3 py-1.5 bg-brand-600 text-white text-sm font-semibold rounded-xl">
          + Post job
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center pt-16">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center px-8 pt-20 gap-4 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center">
            <Briefcase size={28} className="text-brand-400" />
          </div>
          <h2 className="font-bold text-ink text-lg">No jobs yet</h2>
          <p className="text-ink-secondary text-sm">
            Post your first job and get quotes from verified pros nearby.
          </p>
          <Link to="/jobs/new" className="btn-primary mt-2 block text-center">Post a job</Link>
          <p className="text-xs text-ink-tertiary">
            Full job posting arrives in the next update.
          </p>
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-6">
          {active.length > 0 && (
            <section>
              <p className="section-label mb-3">ACTIVE ({active.length})</p>
              <div className="flex flex-col gap-2">
                {active.map(j => <JobRow key={j.id} job={j} />)}
              </div>
            </section>
          )}
          {completed.length > 0 && (
            <section>
              <p className="section-label mb-3">COMPLETED ({completed.length})</p>
              <div className="flex flex-col gap-2">
                {completed.map(j => <JobRow key={j.id} job={j} />)}
              </div>
            </section>
          )}
        </div>
      )}

      <BottomNav variant="customer" />
    </div>
  )
}
