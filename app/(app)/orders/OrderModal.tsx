'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Order = {
  id: string
  customer_name: string
  customer_phone: string | null
  product_interest: string | null
  tweaks: string | null
  deposit_paid: boolean
  deposit_amount: number
  deposit_method: 'Venmo' | 'Square' | 'Cash' | null
  status: string
  follow_up_date: string | null
  notes: string | null
}

type Props = {
  order: Order | null
  onClose: () => void
  onSaved: () => void
}

const STATUSES = ['New', 'Contacted', 'Quoted', 'Deposit Paid', 'Won', 'Lost', 'Cold'] as const
const PAYMENT_METHODS = ['Venmo', 'Square', 'Cash'] as const

const STATUS_STYLE: Record<string, string> = {
  'New':          'bg-violet-100 text-violet-700 border-violet-200',
  'Contacted':    'bg-blue-100 text-blue-700 border-blue-200',
  'Quoted':       'bg-amber-100 text-amber-700 border-amber-200',
  'Deposit Paid': 'bg-green-100 text-green-700 border-green-200',
  'Won':          'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Lost':         'bg-red-100 text-red-600 border-red-200',
  'Cold':         'bg-stone-100 text-stone-500 border-stone-200',
}

export default function OrderModal({ order, onClose, onSaved }: Props) {
  const [name, setName] = useState(order?.customer_name ?? '')
  const [phone, setPhone] = useState(order?.customer_phone ?? '')
  const [interest, setInterest] = useState(order?.product_interest ?? '')
  const [tweaks, setTweaks] = useState(order?.tweaks ?? '')
  const [depositPaid, setDepositPaid] = useState(order?.deposit_paid ?? false)
  const [depositAmount, setDepositAmount] = useState(order?.deposit_amount?.toString() ?? '')
  const [depositMethod, setDepositMethod] = useState<'Venmo' | 'Square' | 'Cash'>(order?.deposit_method ?? 'Venmo')
  const [status, setStatus] = useState(order?.status ?? 'New')
  const [followUpDate, setFollowUpDate] = useState(order?.follow_up_date ?? '')
  const [notes, setNotes] = useState(order?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const payload = {
      customer_name: name,
      customer_phone: phone || null,
      product_interest: interest || null,
      tweaks: tweaks || null,
      deposit_paid: depositPaid,
      deposit_amount: depositPaid ? (parseFloat(depositAmount) || 0) : 0,
      deposit_method: depositPaid ? depositMethod : null,
      status,
      follow_up_date: followUpDate || null,
      notes: notes || null,
    }

    if (order) {
      const { error: err } = await supabase.from('custom_orders').update(payload).eq('id', order.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: err } = await supabase.from('custom_orders').insert({ ...payload, user_id: user!.id })
      if (err) { setError(err.message); setLoading(false); return }
    }

    onSaved()
  }

  async function handleDelete() {
    if (!order || !confirm('Delete this order?')) return
    const supabase = createClient()
    await supabase.from('custom_orders').delete().eq('id', order.id)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-4 pt-4 pb-3 border-b border-stone-100 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-stone-800">
            {order ? 'Edit Order' : 'New Custom Order'}
          </h2>
          <button onClick={onClose} className="text-stone-400 text-3xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-10">
          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Name *</label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Customer name"
                className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="555-000-0000"
                className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Interest */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Product Interest</label>
            <input
              value={interest}
              onChange={e => setInterest(e.target.value)}
              placeholder="e.g. Large planter, custom glaze"
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Tweaks */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Tweaks / Special Requests</label>
            <textarea
              value={tweaks}
              onChange={e => setTweaks(e.target.value)}
              placeholder="e.g. Blue glaze, handle on left side"
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

          {/* Deposit */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={depositPaid}
                onChange={e => setDepositPaid(e.target.checked)}
                className="w-4 h-4 accent-amber-500"
              />
              <span className="text-sm font-medium text-stone-700">Deposit collected</span>
            </label>

            {depositPaid && (
              <div className="mt-3 space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                  <input
                    type="number" step="0.01" min="0"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div className="flex gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m} type="button"
                      onClick={() => setDepositMethod(m)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        depositMethod === m
                          ? 'bg-stone-800 text-white border-stone-800'
                          : 'bg-white text-stone-600 border-stone-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button
                  key={s} type="button"
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    status === s
                      ? STATUS_STYLE[s]
                      : 'bg-white text-stone-400 border-stone-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up date */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Follow-up Date</label>
            <input
              type="date"
              value={followUpDate}
              onChange={e => setFollowUpDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anything else to remember..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving…' : order ? 'Save Changes' : 'Add Order'}
          </button>

          {order && (
            <button
              type="button"
              onClick={handleDelete}
              className="w-full py-2 text-red-500 font-medium text-sm"
            >
              Delete Order
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
