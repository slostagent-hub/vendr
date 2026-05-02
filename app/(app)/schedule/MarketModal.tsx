'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Market = {
  id: string
  name: string
  location: string | null
  type: string | null
  application_fee: number
  booth_fee: number
  notes: string | null
}

type Props = {
  market: Market | null
  onClose: () => void
  onSaved: () => void
}

export default function MarketModal({ market, onClose, onSaved }: Props) {
  const [name, setName] = useState(market?.name ?? '')
  const [location, setLocation] = useState(market?.location ?? '')
  const [type, setType] = useState(market?.type ?? '')
  const [applicationFee, setApplicationFee] = useState(market?.application_fee?.toString() ?? '')
  const [boothFee, setBoothFee] = useState(market?.booth_fee?.toString() ?? '')
  const [notes, setNotes] = useState(market?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const payload = {
      name,
      location: location || null,
      type: type || null,
      application_fee: parseFloat(applicationFee) || 0,
      booth_fee: parseFloat(boothFee) || 0,
      notes: notes || null,
    }

    if (market) {
      const { error: err } = await supabase.from('markets').update(payload).eq('id', market.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: err } = await supabase.from('markets').insert({ ...payload, user_id: user!.id })
      if (err) { setError(err.message); setLoading(false); return }
    }

    onSaved()
  }

  async function handleDelete() {
    if (!market || !confirm('Delete this market? Associated events will lose their market link.')) return
    const supabase = createClient()
    await supabase.from('markets').delete().eq('id', market.id)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-4 pt-4 pb-3 border-b border-stone-100 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-stone-800">
            {market ? 'Edit Market' : 'Add Market'}
          </h2>
          <button onClick={onClose} className="text-stone-400 text-3xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-10">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Market Name *</label>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Downtown Farmers Market"
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Location</label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. 123 Main St, Springfield"
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Type</label>
            <input
              value={type}
              onChange={e => setType(e.target.value)}
              placeholder="e.g. Farmers Market, Craft Fair, Pop-up"
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Application Fee</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                <input
                  type="number" step="0.01" min="0"
                  value={applicationFee}
                  onChange={e => setApplicationFee(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Booth Fee</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                <input
                  type="number" step="0.01" min="0"
                  value={boothFee}
                  onChange={e => setBoothFee(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contact info, parking, rules, etc."
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
            {loading ? 'Saving…' : market ? 'Save Changes' : 'Add Market'}
          </button>

          {market && (
            <button type="button" onClick={handleDelete} className="w-full py-2 text-red-500 font-medium text-sm">
              Delete Market
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
