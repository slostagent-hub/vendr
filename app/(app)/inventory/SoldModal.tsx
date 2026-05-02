'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Product = {
  id: string
  name: string
  asking_price: number
}

type Props = {
  product: Product
  onClose: () => void
  onSaved: () => void
}

const PAYMENT_METHODS = ['Venmo', 'Square', 'Cash'] as const

export default function SoldModal({ product, onClose, onSaved }: Props) {
  const [salePrice, setSalePrice] = useState(product.asking_price.toString())
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [venue, setVenue] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'Venmo' | 'Square' | 'Cash'>('Venmo')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error: saleError } = await supabase.from('sales').insert({
      user_id: user!.id,
      product_id: product.id,
      sale_price: parseFloat(salePrice),
      payment_method: paymentMethod,
      sale_date: saleDate,
      notes: venue || null,
    })

    if (saleError) {
      setError(saleError.message)
      setLoading(false)
      return
    }

    await supabase.from('products').update({ status: 'Sold' }).eq('id', product.id)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl">
        <div className="px-4 pt-4 pb-3 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-800">Mark as Sold</h2>
          <button onClick={onClose} className="text-stone-400 text-3xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-10">
          <p className="text-sm text-stone-500 font-medium">{product.name}</p>

          {/* Sale price */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Sale Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
              <input
                required
                type="number" step="0.01" min="0"
                value={salePrice}
                onChange={e => setSalePrice(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Date</label>
            <input
              type="date"
              value={saleDate}
              onChange={e => setSaleDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Market / Venue</label>
            <input
              value={venue}
              onChange={e => setVenue(e.target.value)}
              placeholder="e.g. Downtown Farmers Market"
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Payment Method</label>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    paymentMethod === method
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'bg-white text-stone-600 border-stone-200'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Confirm Sale'}
          </button>
        </form>
      </div>
    </div>
  )
}
