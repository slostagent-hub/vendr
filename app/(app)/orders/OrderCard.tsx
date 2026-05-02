'use client'

type Order = {
  id: string
  customer_name: string
  customer_phone: string | null
  product_interest: string | null
  tweaks: string | null
  deposit_paid: boolean
  deposit_amount: number
  deposit_method: string | null
  status: string
  follow_up_date: string | null
  notes: string | null
  created_at: string
}

const STATUS_STYLE: Record<string, string> = {
  'New':          'bg-violet-100 text-violet-700',
  'Contacted':    'bg-blue-100 text-blue-700',
  'Quoted':       'bg-amber-100 text-amber-700',
  'Deposit Paid': 'bg-green-100 text-green-700',
  'Won':          'bg-emerald-100 text-emerald-700',
  'Lost':         'bg-red-100 text-red-600',
  'Cold':         'bg-stone-100 text-stone-500',
}

function isOverdue(dateStr: string | null) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date(new Date().toDateString())
}

export default function OrderCard({
  order,
  onClick,
}: {
  order: Order
  onClick: () => void
}) {
  const overdue = isOverdue(order.follow_up_date)

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer active:scale-95 transition-transform"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-stone-800 truncate">{order.customer_name}</p>
          {order.product_interest && (
            <p className="text-sm text-stone-500 mt-0.5 truncate">{order.product_interest}</p>
          )}
          {order.tweaks && (
            <p className="text-xs text-stone-400 mt-0.5 truncate">{order.tweaks}</p>
          )}
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[order.status] ?? 'bg-stone-100 text-stone-500'}`}>
          {order.status}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-3 text-xs text-stone-400">
        {order.deposit_paid && (
          <span className="text-green-600 font-medium">
            ${order.deposit_amount} deposit
            {order.deposit_method ? ` · ${order.deposit_method}` : ''}
          </span>
        )}
        {order.follow_up_date && (
          <span className={overdue ? 'text-red-500 font-medium' : ''}>
            Follow up {overdue ? 'overdue · ' : ''}{order.follow_up_date}
          </span>
        )}
        {order.customer_phone && (
          <span className="ml-auto">{order.customer_phone}</span>
        )}
      </div>
    </div>
  )
}
