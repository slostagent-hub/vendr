'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

function CaptureForm() {
  const searchParams = useSearchParams()
  const vendorId = searchParams.get('v')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [interest, setInterest] = useState('')
  const [tweaks, setTweaks] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.from('custom_orders').insert({
      user_id: vendorId || null,
      customer_name: name,
      customer_phone: phone || null,
      product_interest: interest || null,
      tweaks: tweaks || null,
      status: 'New',
      deposit_paid: false,
    })

    if (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">You&apos;re on the list!</h1>
          <p className="text-stone-500 text-sm">
            Thanks {name}! We&apos;ll be in touch soon about your order.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col px-4 py-12">
      <div className="max-w-sm mx-auto w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-stone-800">Custom Order</h1>
          <p className="text-stone-500 text-sm mt-1">Leave your info and we&apos;ll follow up!</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Your Name *</label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="First and last name"
                className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="555-000-0000"
                className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">What are you interested in?</label>
              <input
                value={interest}
                onChange={e => setInterest(e.target.value)}
                placeholder="e.g. A large blue planter"
                className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Any special requests?</label>
              <textarea
                value={tweaks}
                onChange={e => setTweaks(e.target.value)}
                placeholder="Size, color, personalization, etc."
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
              {loading ? 'Submitting…' : 'Submit Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function CapturePage() {
  return (
    <Suspense>
      <CaptureForm />
    </Suspense>
  )
}
