'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Sale = {
  id: string
  sale_price: number
  sale_date: string
  payment_method: string | null
  notes: string | null
  products: { name: string; hours_invested: number } | null
}

type Order = {
  id: string
  status: string
  deposit_amount: number
  deposit_paid: boolean
}

type StatCardProps = {
  label: string
  value: string
  sub?: string
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-stone-800 mt-1">{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function MiniBar({ label, value, max, amount }: { label: string; value: number; max: number; amount: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-stone-600 w-32 truncate shrink-0">{label}</p>
      <div className="flex-1 bg-stone-100 rounded-full h-2">
        <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-sm font-medium text-stone-700 w-14 text-right shrink-0">{amount}</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const [{ data: salesData }, { data: ordersData }] = await Promise.all([
        supabase
          .from('sales')
          .select('*, products(name, hours_invested)')
          .order('sale_date', { ascending: true }),
        supabase.from('custom_orders').select('id, status, deposit_amount, deposit_paid'),
      ])
      if (salesData) setSales(salesData)
      if (ordersData) setOrders(ordersData)
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-400">Loading…</p>
      </div>
    )
  }

  // --- Calculations ---
  const now = new Date()
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonthSales = sales.filter(s => s.sale_date?.startsWith(thisMonthStr))
  const revenueThisMonth = thisMonthSales.reduce((sum, s) => sum + s.sale_price, 0)

  const totalRevenue = sales.reduce((sum, s) => sum + s.sale_price, 0)
  const totalHours = sales.reduce((sum, s) => sum + (s.products?.hours_invested ?? 0), 0)
  const hourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0

  const openPipelineValue = orders
    .filter(o => !['Won', 'Lost', 'Cold'].includes(o.status))
    .reduce((sum, o) => sum + (o.deposit_paid ? o.deposit_amount : 0), 0)

  const closedOrders = orders.filter(o => ['Won', 'Lost'].includes(o.status))
  const wonOrders = orders.filter(o => o.status === 'Won')
  const conversionRate = closedOrders.length > 0
    ? Math.round((wonOrders.length / closedOrders.length) * 100)
    : null

  // Revenue by venue (from sale notes field)
  const venueMap: Record<string, number> = {}
  sales.forEach(s => {
    const venue = s.notes || 'Direct / Other'
    venueMap[venue] = (venueMap[venue] ?? 0) + s.sale_price
  })
  const venueEntries = Object.entries(venueMap).sort((a, b) => b[1] - a[1])
  const maxVenueRevenue = venueEntries[0]?.[1] ?? 0
  const bestMarket = venueEntries[0]

  // Top products by revenue
  const productMap: Record<string, number> = {}
  sales.forEach(s => {
    const name = s.products?.name ?? 'Unknown'
    productMap[name] = (productMap[name] ?? 0) + s.sale_price
  })
  const topProducts = Object.entries(productMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxProductRevenue = topProducts[0]?.[1] ?? 0

  // Sales over time (last 8 weeks)
  const weeklyMap: Record<string, number> = {}
  for (let i = 7; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i * 7)
    const key = `${d.getFullYear()}-W${String(getWeekNumber(d)).padStart(2, '0')}`
    weeklyMap[key] = 0
  }
  sales.forEach(s => {
    if (!s.sale_date) return
    const d = new Date(s.sale_date)
    const key = `${d.getFullYear()}-W${String(getWeekNumber(d)).padStart(2, '0')}`
    if (key in weeklyMap) weeklyMap[key] += s.sale_price
  })
  const weeklyEntries = Object.entries(weeklyMap)
  const maxWeekly = Math.max(...weeklyEntries.map(e => e[1]), 1)

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white px-4 pt-14 pb-4 border-b border-stone-100">
        <h1 className="text-2xl font-bold text-stone-800">Analytics</h1>
      </div>

      <div className="p-4 space-y-6">
        {sales.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-20">
            No sales recorded yet. Mark products as sold to see your analytics.
          </p>
        ) : (
          <>
            {/* Key numbers */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Revenue this month"
                value={`$${revenueThisMonth.toFixed(0)}`}
                sub={`${thisMonthSales.length} sale${thisMonthSales.length !== 1 ? 's' : ''}`}
              />
              <StatCard
                label="Actual hourly rate"
                value={hourlyRate > 0 ? `$${hourlyRate.toFixed(0)}/hr` : '—'}
                sub={`${totalHours.toFixed(0)} hrs tracked`}
              />
              <StatCard
                label="Open pipeline value"
                value={`$${openPipelineValue.toFixed(0)}`}
                sub={`${orders.filter(o => !['Won','Lost','Cold'].includes(o.status)).length} open orders`}
              />
              <StatCard
                label="Lead → sale rate"
                value={conversionRate !== null ? `${conversionRate}%` : '—'}
                sub={closedOrders.length > 0 ? `${wonOrders.length} of ${closedOrders.length} closed` : 'No closed orders yet'}
              />
            </div>

            {bestMarket && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Best Market</p>
                <p className="font-semibold text-stone-800 mt-1">{bestMarket[0]}</p>
                <p className="text-sm text-stone-500">${bestMarket[1].toFixed(0)} revenue</p>
              </div>
            )}

            {/* Sales over time */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <p className="text-sm font-semibold text-stone-700 mb-4">Sales — Last 8 Weeks</p>
              <div className="flex items-end gap-1.5 h-24">
                {weeklyEntries.map(([week, amount]) => {
                  const height = maxWeekly > 0 ? Math.max((amount / maxWeekly) * 100, amount > 0 ? 4 : 0) : 0
                  const label = week.split('-W')[1]
                  return (
                    <div key={week} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                        <div
                          className="w-full rounded-t-md bg-amber-400"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-xs text-stone-400">W{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top products */}
            {topProducts.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <p className="text-sm font-semibold text-stone-700 mb-4">Top Products by Revenue</p>
                <div className="space-y-3">
                  {topProducts.map(([name, revenue]) => (
                    <MiniBar
                      key={name}
                      label={name}
                      value={revenue}
                      max={maxProductRevenue}
                      amount={`$${revenue.toFixed(0)}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Revenue by venue */}
            {venueEntries.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <p className="text-sm font-semibold text-stone-700 mb-4">Revenue by Venue</p>
                <div className="space-y-3">
                  {venueEntries.map(([venue, revenue]) => (
                    <MiniBar
                      key={venue}
                      label={venue}
                      value={revenue}
                      max={maxVenueRevenue}
                      amount={`$${revenue.toFixed(0)}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
