import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { CreditCard, CheckCircle2, Clock, XCircle, DollarSign, TrendingDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { format } from 'date-fns'
import type { FeeBalance, Payment } from '../types'

const paymentStatusConfig = {
  completed: { label: 'Completed', variant: 'success' as const, icon: CheckCircle2 },
  pending:   { label: 'Pending',   variant: 'warning' as const, icon: Clock },
  failed:    { label: 'Failed',    variant: 'danger'  as const, icon: XCircle },
}

export default function Finance() {
  const { user } = useAuth()
  const uid = user?.id
  const [showPayModal, setShowPayModal] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('card')
  const [payLoading, setPayLoading] = useState(false)
  const [paySuccess, setPaySuccess] = useState(false)

  const { data: balance, refetch: refetchBalance } = useQuery<FeeBalance | null>({
    queryKey: ['fee-balance', uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_balances')
        .select('*')
        .eq('student_id', uid!)
        .single()
      if (error) return null
      return data
    },
    enabled: !!uid,
  })

  const { data: payments, isLoading, refetch: refetchPayments } = useQuery<Payment[]>({
    queryKey: ['payments', uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', uid!)
        .order('paid_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!uid,
  })

  async function handlePayment() {
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0 || !uid) return
    setPayLoading(true)

    // Create a payment record (in production this would call backend payment processor)
    const ref = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const { error } = await supabase.from('payments').insert({
      student_id: uid,
      amount,
      payment_method: payMethod,
      reference: ref,
      status: 'completed',
      description: 'Fee payment',
      paid_at: new Date().toISOString(),
    })

    if (!error && balance) {
      await supabase.from('fee_balances').update({
        amount_paid: balance.amount_paid + amount,
        balance: Math.max(0, balance.balance - amount),
        updated_at: new Date().toISOString(),
      }).eq('student_id', uid)
    }

    setPayLoading(false)
    setPaySuccess(true)
    refetchBalance()
    refetchPayments()
    setTimeout(() => { setShowPayModal(false); setPaySuccess(false); setPayAmount('') }, 2000)
  }

  const balancePct = balance ? Math.min(100, Math.round((balance.amount_paid / balance.total_fees) * 100)) : 0

  if (isLoading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Finance & Fees</h1>
        <p className="text-slate-500 text-sm mt-1">View your fee balance and payment history</p>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
              <DollarSign size={18} className="text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-500">Total Fees</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">${balance?.total_fees.toLocaleString() ?? '—'}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-slate-500">Amount Paid</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">${balance?.amount_paid.toLocaleString() ?? '—'}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <TrendingDown size={18} className="text-amber-600" />
            </div>
            <p className="text-sm font-medium text-slate-500">Outstanding Balance</p>
          </div>
          <p className="text-2xl font-bold text-amber-600">${balance?.balance.toLocaleString() ?? '—'}</p>
          {balance?.due_date && (
            <p className="text-xs text-slate-400 mt-1">Due {format(new Date(balance.due_date), 'MMM d, yyyy')}</p>
          )}
        </div>
      </div>

      {/* Progress + pay button */}
      {balance && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Payment Progress</p>
              <p className="text-xs text-slate-400 mt-0.5">{balancePct}% of total fees paid</p>
            </div>
            {balance.balance > 0 && (
              <button onClick={() => setShowPayModal(true)} className="btn-primary">
                <CreditCard size={16} /> Make Payment
              </button>
            )}
            {balance.balance === 0 && (
              <Badge variant="success" size="md">Fully Paid</Badge>
            )}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-700"
              style={{ width: `${balancePct}%` }}
            />
          </div>
        </div>
      )}

      {/* Payment history */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="section-title">Payment History</h2>
        </div>
        {payments && payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reference</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map((p) => {
                  const cfg = paymentStatusConfig[p.status]
                  const Icon = cfg.icon
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{p.reference}</td>
                      <td className="px-5 py-3.5 text-slate-600">{format(new Date(p.paid_at), 'MMM d, yyyy')}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">${p.amount.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-slate-500 capitalize">{p.payment_method ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Icon size={14} className={p.status === 'completed' ? 'text-emerald-500' : p.status === 'failed' ? 'text-red-500' : 'text-amber-500'} />
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <CreditCard size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No payment records yet</p>
          </div>
        )}
      </div>

      {/* Payment modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            {paySuccess ? (
              <div className="text-center py-4">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
                <p className="text-lg font-bold text-slate-900">Payment Successful!</p>
                <p className="text-sm text-slate-500 mt-1">Your balance has been updated.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Make a Payment</h3>
                {balance && balance.balance > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
                    Outstanding balance: <strong>${balance.balance.toLocaleString()}</strong>
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="label">Amount (USD)</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="0.00"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      min="1"
                      max={balance?.balance}
                    />
                  </div>
                  <div>
                    <label className="label">Payment Method</label>
                    <select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                      <option value="card">Credit / Debit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="mobile_money">Mobile Money</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowPayModal(false)} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={handlePayment} disabled={payLoading || !payAmount} className="btn-primary flex-1">
                      {payLoading ? 'Processing...' : `Pay $${payAmount || '0'}`}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
