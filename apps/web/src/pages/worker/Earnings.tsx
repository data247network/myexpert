import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@myexpert/shared'
import type { WorkerProfile } from '@myexpert/shared'
import { Wallet2, Lock, ArrowDownCircle } from 'lucide-react'

export default function WorkerEarnings() {
  const { user } = useAuth()
  const [worker, setWorker] = useState<WorkerProfile | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('worker_profiles')
      .select('available_balance, escrow_balance, total_jobs')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { if (data) setWorker(data as WorkerProfile) })
  }, [user])

  const available = worker?.available_balance ?? 0
  const escrow    = worker?.escrow_balance    ?? 0
  const total     = available + escrow

  return (
    <div className="page-with-nav">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-ink">Earnings</h1>
      </div>

      {/* Balance card */}
      <div className="mx-4 bg-ink rounded-2xl p-5 mb-4">
        <p className="text-gray-400 text-xs font-semibold uppercase mb-1">TOTAL BALANCE</p>
        <p className="text-white text-3xl font-extrabold mb-4">
          ₦{total.toLocaleString()}
        </p>
        <div className="flex gap-4">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Available</p>
            <p className="text-white font-semibold">₦{available.toLocaleString()}</p>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <p className="text-gray-400 text-xs mb-0.5">In escrow</p>
            <div className="flex items-center gap-1">
              <Lock size={12} className="text-gray-400" />
              <p className="text-gray-300 font-semibold">₦{escrow.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw button */}
      <div className="mx-4 mb-5">
        <button
          disabled={available === 0}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-600 text-white font-semibold rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed">
          <ArrowDownCircle size={18} />
          Withdraw to bank
        </button>
        <p className="text-xs text-ink-tertiary text-center mt-2">
          Minimum ₦1,000 · ₦100 withdrawal fee
        </p>
        {available === 0 && (
          <p className="text-xs text-ink-tertiary text-center mt-1">
            Bank linking &amp; withdrawals unlock after your first completed job.
          </p>
        )}
      </div>

      {/* Transaction history */}
      <div className="mx-4">
        <p className="section-label mb-3">TRANSACTION HISTORY</p>
        <div className="card text-center py-8 flex flex-col items-center gap-2">
          <Wallet2 size={24} className="text-ink-tertiary" />
          <p className="text-ink-tertiary text-sm">No transactions yet.</p>
          <p className="text-xs text-ink-tertiary">
            Earnings from completed jobs appear here.
          </p>
        </div>
      </div>

      <BottomNav variant="worker" />
    </div>
  )
}
