'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

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
}

type Props = {
  product: Product | null
  onClose: () => void
  onSaved: () => void
}

export default function AddProductModal({ product, onClose, onSaved }: Props) {
  const [name, setName] = useState(product?.name ?? '')
  const [category, setCategory] = useState(product?.category ?? '')
  const [variants, setVariants] = useState(product?.variants ?? '')
  const [materialsCost, setMaterialsCost] = useState(product?.materials_cost?.toString() ?? '')
  const [hoursInvested, setHoursInvested] = useState(product?.hours_invested?.toString() ?? '')
  const [askingPrice, setAskingPrice] = useState(product?.asking_price?.toString() ?? '')
  const [quantity, setQuantity] = useState(product?.quantity?.toString() ?? '1')
  const [status, setStatus] = useState<Product['status']>(product?.status ?? 'In Progress')
  const [notes, setNotes] = useState(product?.notes ?? '')
  const [photoPreview, setPhotoPreview] = useState(product?.photo_url ?? '')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    let finalPhotoUrl = product?.photo_url ?? null

    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const filename = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('product-photos')
        .upload(filename, photoFile)
      if (uploadError) {
        setError('Photo upload failed: ' + uploadError.message)
        setLoading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('product-photos').getPublicUrl(filename)
      finalPhotoUrl = urlData.publicUrl
    }

    const payload = {
      name,
      category: category || null,
      photo_url: finalPhotoUrl,
      variants: variants || null,
      materials_cost: parseFloat(materialsCost) || 0,
      hours_invested: parseFloat(hoursInvested) || 0,
      asking_price: parseFloat(askingPrice) || 0,
      quantity: parseInt(quantity) || 1,
      status,
      notes: notes || null,
    }

    if (product) {
      const { error: err } = await supabase.from('products').update(payload).eq('id', product.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: err } = await supabase.from('products').insert({ ...payload, user_id: user!.id })
      if (err) { setError(err.message); setLoading(false); return }
    }

    onSaved()
  }

  async function handleDelete() {
    if (!product || !confirm('Delete this product?')) return
    const supabase = createClient()
    await supabase.from('products').delete().eq('id', product.id)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-4 pt-4 pb-3 border-b border-stone-100 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-stone-800">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-stone-400 text-3xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-10">
          {/* Photo */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-video bg-stone-100 rounded-2xl flex items-center justify-center overflow-hidden"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-stone-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 mx-auto mb-1">
                  <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                <span className="text-sm">Tap to add photo</span>
              </div>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Product Name *</label>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Hand-thrown mug"
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g. Ceramics, Jewelry, Candles"
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Variants */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Variants / Dimensions</label>
            <input
              value={variants}
              onChange={e => setVariants(e.target.value)}
              placeholder={`e.g. Blue, Green — 4" tall`}
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Price + Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Asking Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                <input
                  type="number" step="0.01" min="0"
                  value={askingPrice}
                  onChange={e => setAskingPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Quantity</label>
              <input
                type="number" min="0"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Materials + Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Materials Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                <input
                  type="number" step="0.01" min="0"
                  value={materialsCost}
                  onChange={e => setMaterialsCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Hours Invested</label>
              <input
                type="number" step="0.5" min="0"
                value={hoursInvested}
                onChange={e => setHoursInvested(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as Product['status'])}
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option>In Progress</option>
              <option>Available</option>
              <option>Reserved</option>
              <option>Sold</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any extra details..."
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
            {loading ? 'Saving…' : product ? 'Save Changes' : 'Add Product'}
          </button>

          {product && (
            <button
              type="button"
              onClick={handleDelete}
              className="w-full py-2 text-red-500 font-medium text-sm"
            >
              Delete Product
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
