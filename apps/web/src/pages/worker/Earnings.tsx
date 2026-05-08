import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@myexpert/shared'
import { Wallet2, Lock, ArrowDownCircle, CheckCircle, Clock } from 'lucide-react'

interface WorkerBalance {
  available_balance: number
  escrow_balance:    number
  total_jobs:        number
}

interface EscrowEntry {
  id:           string
  gross_amount: number
  net_amount:   number
  service_fee:  number
  status:       'held' | 'released' | 'refunded' | 'disputed'
  held_at:      string
  released_at:  string | null
  job_title:    string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function WorkerEarnings() {
  const { user } = useAuth()
  const [balance,       setBalance]      = useState<WorkerBalance | null>(null)
  const [transactions,  setTransactions] = useState<EscrowEntry[]>([])
  const [loadingBal,    setLoadingBal]   = useState(true)
  const [loadingTx,     setLoadingTx]    = useState(true)

  useEffect(() => {
    if (!user) return

    // Balance
    supabase
      .from('worker_profiles')
      .select('available_balance, escrow_balance, total_jobs')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setBalance(data as WorkerBalance)
        setLoadingBal(false)
      })

    // Transaction history from escrow_ledger
    supabase
      .from('escrow_ledger')
      .select('id, gross_amount, net_amount, service_fee, status, held_at, released_at, job_id')
      .eq('worker_id', user.id)
      .order('held_at', { ascending: false })
      .limit(20)
      .then(async ({ data }) => {
        if (!data) { setLoadingTx(false); return }

        // Fetch job titles
        const jobIds = [...new Set(data.map((e: { job_id: string }) => e.job_id))]
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, title')
          .in('id', jobIds)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const titleMap: Record<string, string> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        jobs?.forEach((j: any) => { titleMap[j.id] = j.title })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTransactions(data.map((e: any) => ({
          ...e,
          job_title: titleMap[e.job_id] ?? 'Job',
        })))
        setLoadingTx(false)
      })
  }, [user])

  const available = balance?.available_balance ?? 0
  const escrow    = balance?.escrow_balance    ?? 0
  const total     = available + escrow

  return (
    <div className="page-with-nav">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-ink">Earnings</h1>
      </div>

      {/* Balance card */}
      <div className="mx-4 bg-ink rounded-2xl p-5 mb-4">
        <p className="text-gray-400 text-xs font-semibold uppercase mb-1">TOTAL BALANCE</p>
        {loadingBal ? (
          <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin my-2" />
        ) : (
          <>
            <p className="text-white text-3xl font-extrabold mb-4">
              ₦{total.toLocaleString()}
            </p>
            <div className="flex gap-6">
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Available</p>
                <p className="text-white font-bold text-lg">₦{available.toLocaleString()}</p>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <p className="text-gray-400 text-xs mb-0.5">In escrow</p>
                <div className="flex items-center gap-1">
                  <Lock size={12} className="text-gray-400" />
                  <p className="text-gray-300 font-semibold">₦{escrow.toLocaleString()}</p>
                </div>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Jobs done</p>
                <p className="text-gray-300 font-semibold">{balance?.total_jobs ?? 0}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Withdraw button */}
      <div className="mx-4 mb-5">
        <button
          disabled={available < 1000}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-600 text-white font-semibold rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed">
          <ArrowDownCircle size={18} />
          Withdraw to bank
        </button>
        <p className="text-xs text-ink-tertiary text-center mt-2">
          Minimum ₦1,000 · ₦100 withdrawal fee
        </p>
        {available < 1000 && available > 0 && (
          <p className="text-xs text-ink-tertiary text-center mt-1">
            Balance too low to withdraw (min ₦1,000).
          </p>
        )}
        {available === 0 && (
          <p className="text-xs text-ink-tertiary text-center mt-1">
            Complete jobs to earn and withdraw.
          </p>
        )}
      </div>

      {/* Transaction history */}
      <div className="mx-4">
        <p className="section-label mb-3">TRANSACTION HISTORY</p>

        {loadingTx ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="card text-center py-8 flex flex-col items-center gap-2">
            <Wallet2 size={24} className="text-ink-tertiary" />
            <p className="text-ink-tertiary text-sm">No transactions yet.</p>
            <p className="text-xs text-ink-tertiary">
              Earnings from completed jobs appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map(tx => (
              <div key={tx.id} className="card flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  tx.status === 'released' ? 'bg-green-100' :
                  tx.status === 'held'     ? 'bg-yellow-100' :
                  tx.status === 'disputed' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  {tx.status === 'released'
                    ? <CheckCircle size={18} className="text-green-600" />
                    : <Clock size={18} className={tx.status === 'disputed' ? 'text-red-500' : 'text-yellow-600'} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink truncate">{tx.job_title}</p>
                  <p className="text-xs text-ink-tertiary">
                    {tx.status === 'released'
                      ? `Released ${tx.released_at ? formatDate(tx.released_at) : ''}`
                      : tx.status === 'held'
                      ? `In escrow since ${formatDate(tx.held_at)}`
                      : tx.status === 'disputed'
                      ? 'Disputed — under review'
                      : tx.status}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold text-sm ${
                    tx.status === 'released' ? 'text-green-600' :
                    tx.status === 'held'     ? 'text-yellow-700' : 'text-ink-secondary'
                  }`}>
                    {tx.status === 'released' ? '+' : ''}₦{tx.net_amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-ink-tertiary">
                    of ₦{tx.gross_amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav variant="worker" />
    </div>
  )
}
