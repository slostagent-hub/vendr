'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import AddProductModal from './AddProductModal'
import SoldModal from './SoldModal'

type Product = {
  id: string
  name: string
  category: string | null
  photo_url: string | null
  variants: string | null
  materials_cost: number
  hours_invested: number
  asking_price: number
  quantity: number
  status: 'In Progress' | 'Available' | 'Reserved' | 'Sold'
  notes: string | null
  created_at: string
}

const FILTERS = ['All', 'Available', 'In Progress', 'Reserved', 'Sold'] as const

const STATUS_STYLE: Record<string, string> = {
  'Available':   'bg-green-100 text-green-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Reserved':    'bg-blue-100 text-blue-700',
  'Sold':        'bg-stone-100 text-stone-500',
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [soldProduct, setSoldProduct] = useState<Product | null>(null)

  async function fetchProducts() {
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setProducts(data)
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  const filtered = filter === 'All' ? products : products.filter(p => p.status === filter)

  function openAdd() {
    setEditProduct(null)
    setShowAdd(true)
  }

  function openEdit(product: Product) {
    setEditProduct(product)
    setShowAdd(true)
  }

  function handleSaved() {
    setShowAdd(false)
    setSoldProduct(null)
    fetchProducts()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-3 border-b border-stone-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-stone-800">Inventory</h1>
          <button
            onClick={openAdd}
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

      {/* Grid */}
      <div className="p-4">
        {loading ? (
          <p className="text-center text-stone-400 py-20">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-stone-400 text-sm">
              {filter === 'All'
                ? 'No products yet. Tap + Add to get started.'
                : `No ${filter} products.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(product => (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer active:scale-95 transition-transform"
                onClick={() => openEdit(product)}
              >
                {/* Photo */}
                <div className="aspect-square bg-stone-100">
                  {product.photo_url ? (
                    <img
                      src={product.photo_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-10 h-10 text-stone-300">
                        <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <circle cx="12" cy="13" r="3" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="font-semibold text-stone-800 text-sm truncate">{product.name}</p>
                  {product.category && (
                    <p className="text-xs text-stone-400 mt-0.5 truncate">{product.category}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-base font-bold text-stone-800">${product.asking_price}</span>
                    <span className="text-xs text-stone-400">×{product.quantity}</span>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[product.status]}`}>
                      {product.status}
                    </span>
                  </div>
                  {product.status === 'Available' && (
                    <button
                      onClick={e => { e.stopPropagation(); setSoldProduct(product) }}
                      className="mt-2.5 w-full text-xs font-semibold py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg transition-colors"
                    >
                      Mark as Sold
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddProductModal
          product={editProduct}
          onClose={() => setShowAdd(false)}
          onSaved={handleSaved}
        />
      )}

      {soldProduct && (
        <SoldModal
          product={soldProduct}
          onClose={() => setSoldProduct(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
