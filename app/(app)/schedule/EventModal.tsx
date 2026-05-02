'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Market = { id: string; name: string }

type Event = {
  id: string
  market_id: string | null
  date: string | null
  status: string
  deadline: string | null
  fees_paid: number
  booth_assignment: string | null
  notes: string | null
}

type Props = {
  event: Event | null
  markets: Market[]
  onClose: () => void
  onSaved: () => void
}

const STATUSES = ['Applied', 'Accepted', 'Waitlisted', 'Confirmed', 'Attended', 'Skipped'] as const

const STATUS_STYLE: Record<string, string> = {
  'Applied':    'bg-amber-100 text-amber-700 border-amber-200',
  'Accepted':   'bg-blue-100 text-blue-700 border-blue-200',
  'Waitlisted': 'bg-violet-100 text-violet-700 border-violet-200',
  'Confirmed':  'bg-green-100 text-green-700 border-green-200',
  'Attended':   'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Skipped':    'bg-stone-100 text-stone-500 border-stone-200',
}

export default function EventModal({ event, markets, onClose, onSaved }: Props) {
  const [marketId, setMarketId] = useState(event?.market_id ?? '')
  const [date, setDate] = useState(event?.date ?? '')
  const [status, setStatus] = useState(event?.status ?? 'Applied')
  const [deadline, setDeadline] = useState(event?.deadline ?? '')
  const [feesPaid, setFeesPaid] = useState(event?.fees_paid?.toString() ?? '')
  const [boothAssignment, setBoothAssignment] = useState(event?.booth_assignment ?? '')
  const [notes, setNotes] = useState(event?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const payload = {
      market_id: marketId || null,
      date: date || null,
      status,
      deadline: deadline || null,
      fees_paid: parseFloat(feesPaid) || 0,
      booth_assignment: boothAssignment || null,
      notes: notes || null,
    }

    if (event) {
      const { error: err } = await supabase.from('events').update(payload).eq('id', event.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: err } = await supabase.from('events').insert({ ...payload, user_id: user!.id })
      if (err) { setError(err.message); setLoading(false); return }
    }

    onSaved()
  }

  async function handleDelete() {
    if (!event || !confirm('Delete this event?')) return
    const supabase = createClient()
    await supabase.from('events').delete().eq('id', event.id)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-4 pt-4 pb-3 border-b border-stone-100 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-stone-800">
            {event ? 'Edit Event' : 'Add Event'}
          </h2>
          <button onClick={onClose} className="text-stone-400 text-3xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-10">
          {/* Market */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Market</label>
            <select
              value={marketId}
              onChange={e => setMarketId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">— No market linked —</option>
              {markets.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Date + Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Event Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">App. Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
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
                    status === s ? STATUS_STYLE[s] : 'bg-white text-stone-400 border-stone-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Fees + Booth */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Fees Paid</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                <input
                  type="number" step="0.01" min="0"
                  value={feesPaid}
                  onChange={e => setFeesPaid(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Booth</label>
              <input
                value={boothAssignment}
                onChange={e => setBoothAssignment(e.target.value)}
                placeholder="e.g. B-12"
                className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Setup time, parking, what to bring..."
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
            {loading ? 'Saving…' : event ? 'Save Changes' : 'Add Event'}
          </button>

          {event && (
            <button type="button" onClick={handleDelete} className="w-full py-2 text-red-500 font-medium text-sm">
              Delete Event
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
