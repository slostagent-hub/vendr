'use client'

import { useState } from 'react'
import OrderModal from '@/app/(app)/orders/OrderModal'

export default function FloatingOrderButton() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-4 z-30 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold text-sm px-4 py-3 rounded-full shadow-lg transition-all flex items-center gap-1.5"
        aria-label="Add custom order"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Order
      </button>

      {showModal && (
        <OrderModal
          order={null}
          onClose={() => setShowModal(false)}
          onSaved={() => setShowModal(false)}
        />
      )}
    </>
  )
}
