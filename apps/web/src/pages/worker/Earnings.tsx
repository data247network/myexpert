import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@myexpert/shared'
import { Wallet2, Lock, ArrowDownCircle, CheckCircle, Clock, X, Building2, CreditCard } from 'lucide-react'

interface WorkerBalance {
  available_balance: number
  escrow_balance:    number
  total_jobs:        number
  bank_name:         string | null
  bank_account_number: string | null
  bank_account_name:   string | null
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

// Nigerian bank list (top banks)
const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Citibank Nigeria', code: '023' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank (FCMB)', code: '214' },
  { name: 'Guaranty Trust Bank (GTB)', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Kuda Bank', code: '090267' },
  { name: 'OPay', code: '100004' },
  { name: 'Palmpay', code: '100033' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank for Africa (UBA)', code: '033' },
  { name: 'Unity Bank', code: '215' },
  { name: 'VFD Bank', code: '566' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
]

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Withdraw modal ─────────────────────────────────────────────────────────────
function WithdrawModal({
  balance,
  currentBank,
  onClose,
  onSuccess,
}: {
  balance: number
  currentBank: { bank_name: string|null; bank_account_number: string|null; bank_account_name: string|null }
  onClose: () => void
  onSuccess: () => void
}) {
  const { user } = useAuth()
  const [bankCode,    setBankCode]    = useState('')
  const [bankName,    setBankName]    = useState(currentBank.bank_name ?? '')
  const [accountNo,   setAccountNo]   = useState(currentBank.bank_account_number ?? '')
  const [accountName, setAccountName] = useState(currentBank.bank_account_name ?? '')
  const [amount,      setAmount]      = useState(String(Math.floor(balance)))
  const [step,        setStep]        = useState<'details'|'confirm'>('details')
  const [verifying,   setVerifying]   = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')

  const WITHDRAWAL_FEE = 100
  const netAmount = Math.max(0, Number(amount) - WITHDRAWAL_FEE)

  // Verify account name via Paystack
  const verifyAccount = async () => {
    if (!accountNo || accountNo.length < 10 || !bankCode) {
      setError('Please enter a valid 10-digit account number and select a bank.')
      return
    }
    setVerifying(true)
    setError('')
    try {
      const res = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${accountNo}&bank_code=${bankCode}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_PUBLIC_KEY}` } }
      )
      const data = await res.json()
      if (data.status && data.data?.account_name) {
        setAccountName(data.data.account_name)
        setStep('confirm')
      } else {
        setError('Could not verify account. Please check account number and bank.')
      }
    } catch {
      setError('Network error verifying account. Please try again.')
    }
    setVerifying(false)
  }

  const submitWithdrawal = async () => {
    if (!user) return
    setSubmitting(true)
    setError('')

    try {
      // 1. Save bank details to worker profile
      await supabase.from('worker_profiles').update({
        bank_name: bankName,
        bank_account_number: accountNo,
        bank_account_name: accountName,
      }).eq('id', user.id)

      // 2. Create a payout record
      const reference = `PAYOUT-${user.id.slice(0,8)}-${Date.now()}`
      const { error: payoutErr } = await supabase.from('payouts').insert({
        worker_id:      user.id,
        amount:         Number(amount),
        fee:            WITHDRAWAL_FEE,
        net_amount:     netAmount,
        bank_name:      bankName,
        account_number: accountNo,
        account_name:   accountName,
        status:         'pending',
        reference,
      })

      if (payoutErr) throw new Error(payoutErr.message)

      // 3. Deduct from available balance
      await supabase.rpc('deduct_worker_balance', {
        p_worker_id: user.id,
        p_amount: Number(amount),
      }).then(() => {/* ignore if function doesn't exist yet */})

      onSuccess()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit withdrawal. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <ArrowDownCircle size={18} className="text-brand-600" />
            {step === 'details' ? 'Withdraw to Bank' : 'Confirm Withdrawal'}
          </h2>
          <button onClick={onClose}><X size={20} className="text-ink-tertiary" /></button>
        </div>

        {step === 'details' ? (
          <div className="flex flex-col gap-4">
            {/* Amount */}
            <div>
              <label className="text-xs font-semibold text-ink-secondary uppercase mb-1 block">Amount (₦)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-ink-secondary">₦</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  min={1000}
                  max={balance}
                  className="input-field pl-8"
                />
              </div>
              <p className="text-xs text-ink-tertiary mt-1">
                Available: ₦{balance.toLocaleString()} · Fee: ₦{WITHDRAWAL_FEE} · You receive: ₦{netAmount.toLocaleString()}
              </p>
            </div>

            {/* Bank selection */}
            <div>
              <label className="text-xs font-semibold text-ink-secondary uppercase mb-1 block">Bank</label>
              <select
                value={bankCode}
                onChange={e => {
                  const bank = NIGERIAN_BANKS.find(b => b.code === e.target.value)
                  setBankCode(e.target.value)
                  setBankName(bank?.name ?? '')
                }}
                className="input-field"
              >
                <option value="">Select bank…</option>
                {NIGERIAN_BANKS.map(b => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Account number */}
            <div>
              <label className="text-xs font-semibold text-ink-secondary uppercase mb-1 block">Account Number</label>
              <div className="relative">
                <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
                <input
                  type="tel"
                  value={accountNo}
                  onChange={e => setAccountNo(e.target.value.replace(/\D/g,'').slice(0,10))}
                  placeholder="10-digit account number"
                  className="input-field pl-9"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

            <button
              onClick={verifyAccount}
              disabled={verifying || !bankCode || accountNo.length < 10 || Number(amount) < 1000}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Building2 size={16} />
              {verifying ? 'Verifying account…' : 'Verify & Continue →'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Summary */}
            <div className="bg-surface-secondary rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-ink-secondary">Amount</span>
                <span className="font-bold text-ink">₦{Number(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-secondary">Withdrawal fee</span>
                <span className="text-ink-secondary">-₦{WITHDRAWAL_FEE}</span>
              </div>
              <div className="border-t border-surface-tertiary pt-2 flex justify-between">
                <span className="font-semibold text-ink">You receive</span>
                <span className="font-bold text-green-600 text-lg">₦{netAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-brand-50 rounded-2xl p-4 flex flex-col gap-1">
              <p className="text-xs text-ink-tertiary">Account name</p>
              <p className="font-bold text-ink">{accountName}</p>
              <p className="text-sm text-ink-secondary">{bankName} · {accountNo}</p>
            </div>

            <p className="text-xs text-ink-tertiary text-center">
              Payouts are processed within 1–2 business days.
            </p>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep('details')} className="btn-secondary flex-1">← Back</button>
              <button onClick={submitWithdrawal} disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Processing…' : 'Confirm withdrawal'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function WorkerEarnings() {
  const { user } = useAuth()
  const [balance,      setBalance]      = useState<WorkerBalance | null>(null)
  const [transactions, setTransactions] = useState<EscrowEntry[]>([])
  const [loadingBal,   setLoadingBal]   = useState(true)
  const [loadingTx,    setLoadingTx]    = useState(true)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [successMsg,   setSuccessMsg]   = useState('')

  const fetchBalance = () => {
    if (!user) return
    supabase
      .from('worker_profiles')
      .select('available_balance, escrow_balance, total_jobs, bank_name, bank_account_number, bank_account_name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setBalance(data as WorkerBalance)
        setLoadingBal(false)
      })
  }

  useEffect(() => {
    if (!user) return

    fetchBalance()

    // Transaction history
    supabase
      .from('escrow_ledger')
      .select('id, gross_amount, net_amount, service_fee, status, held_at, released_at, job_id')
      .eq('worker_id', user.id)
      .order('held_at', { ascending: false })
      .limit(20)
      .then(async ({ data }) => {
        if (!data) { setLoadingTx(false); return }
        const jobIds = [...new Set(data.map((e: { job_id: string }) => e.job_id))]
        const { data: jobs } = await supabase.from('jobs').select('id, title').in('id', jobIds)
        const titleMap: Record<string, string> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        jobs?.forEach((j: any) => { titleMap[j.id] = j.title })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTransactions(data.map((e: any) => ({ ...e, job_title: titleMap[e.job_id] ?? 'Job' })))
        setLoadingTx(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        {successMsg && (
          <div className="mb-3 bg-green-50 rounded-xl px-4 py-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <p className="text-sm text-green-700">{successMsg}</p>
          </div>
        )}
        <button
          onClick={() => { setSuccessMsg(''); setShowWithdraw(true) }}
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

      {showWithdraw && balance && (
        <WithdrawModal
          balance={available}
          currentBank={{ bank_name: balance.bank_name, bank_account_number: balance.bank_account_number, bank_account_name: balance.bank_account_name }}
          onClose={() => setShowWithdraw(false)}
          onSuccess={() => {
            setSuccessMsg('Withdrawal request submitted! It will be processed within 1–2 business days.')
            fetchBalance()
          }}
        />
      )}

      <BottomNav variant="worker" />
    </div>
  )
}
