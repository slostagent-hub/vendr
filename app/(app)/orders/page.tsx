'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import OrderCard from './OrderCard'
import OrderModal from './OrderModal'

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
  created_at: string
}

const FILTERS = ['All', 'New', 'Contacted', 'Quoted', 'Deposit Paid', 'Won', 'Lost', 'Cold'] as const

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editOrder, setEditOrder] = useState<Order | null>(null)

  async function fetchOrders() {
    const supabase = createClient()
    const { data } = await supabase
      .from('custom_orders')
      .select('*')
      .order('follow_up_date', { ascending: true, nullsFirst: false })
    if (data) setOrders(data)
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])

  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter)

  function handleSaved() {
    setShowAdd(false)
    setEditOrder(null)
    fetchOrders()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-3 border-b border-stone-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-stone-800">Custom Orders</h1>
          <button
            onClick={() => { setEditOrder(null); setShowAdd(true) }}
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
          >
            + Add
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === f ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="p-4 space-y-3">
        {loading ? (
          <p className="text-center text-stone-400 py-20">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-stone-400 text-sm">
              {filter === 'All'
                ? 'No custom orders yet. Tap + Add or share your QR code.'
                : `No ${filter} orders.`}
            </p>
          </div>
        ) : (
          filtered.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => { setEditOrder(order); setShowAdd(true) }}
            />
          ))
        )}
      </div>

      {showAdd && (
        <OrderModal
          order={editOrder}
          onClose={() => { setShowAdd(false); setEditOrder(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
